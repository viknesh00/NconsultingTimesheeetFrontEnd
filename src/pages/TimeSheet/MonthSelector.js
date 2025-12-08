import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  MenuItem,
  FormControl,
  Select,
  Paper,
  Button,
} from "@mui/material";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";

dayjs.extend(isoWeek);

// -------------------- TEXT COLOR --------------------
const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "approved":
      return "#0F7B0F";           // green
    case "not approved":
      return "#C62828";           // red
    case "locked":
      return "#0A5E96";           // blue
    case "submitted":
      return "#1F618D";           // dark blue
    case "saved":
      return "#D35400";           // orange
    case "not submitted":
      return "#E67E22";           // light orange
    case "future":
      return "#7D7D7D";           // gray
    default:
      return "#7D7D7D";
  }
};


// -------------------- BACKGROUND COLOR --------------------
const getBackgroundColor = (status) => {
  switch (status?.toLowerCase()) {
    case "approved":
      return "#DFF5D8";           // green light
    case "not approved":
      return "#FDE0E0";           // red light
    case "locked":
      return "#D7EBFF";           // blue light
    case "submitted":
      return "#D9E8FF";           // dark blue light
    case "saved":
      return "#FFECC7";           // orange light
    case "not submitted":
      return "#FFE7D6";           // light orange
    case "future":
      return "#E9E9E9";           // gray
    default:
      return "#E9E9E9";
  }
};


// -------------------- MONTH DATA --------------------
const generateMonthData = (summary = {}) => {
  const today = dayjs();
  const data = [];

  for (let i = 0; i <= 1; i++) {
    const month = today.add(i, "month");
    const start = month.startOf("month").format("MMM DD");
    const end = month.endOf("month").format("MMM DD");
    const year = month.year();

    const monthKey = month.format("YYYY-MM");
    const entry = summary[monthKey] || {};

    const status = entry.status || (i === 0 ? "Not Submitted" : "Future");
    const days = entry.workingDays || 0;

    data.push({
      range: `${start} - ${end}, ${year}`,
      status,
      days: `${days} days`,
      color: getBackgroundColor(status),
      monthObj: month,
    });
  }

  return data;
};

// -------------------- GET WEEKS --------------------
const getWeeksOfMonth = (monthObj, allowWeekendEdit) => {
  const startMonth = monthObj.startOf("month");
  const endMonth = monthObj.endOf("month");

  let cursor = startMonth.isoWeekday(1);
  if (cursor.isAfter(startMonth)) cursor = cursor.subtract(1, "week");

  const weeks = [];

  while (cursor.isBefore(endMonth) || cursor.isSame(endMonth)) {
    const weekStart = cursor;
    const weekEnd = cursor.add(6, "day");

    const tabStart = weekStart.isBefore(startMonth) ? startMonth : weekStart;
    const tabEnd = weekEnd.isAfter(endMonth) ? endMonth : weekEnd;

    const dayList = [];
    for (let i = 0; i < 7; i++) {
      const date = weekStart.add(i, "day");
      dayList.push({
        date,
        inMonth: date.month() === monthObj.month(),
        isWeekend: date.isoWeekday() >= 6,
      });
    }

    const editableCount = dayList.filter(
      (d) => d.inMonth && !(d.isWeekend && !allowWeekendEdit)
    ).length;

    weeks.push({
      label: `${tabStart.format("MMM DD")} - ${tabEnd.format(
        "MMM DD"
      )} (${editableCount} days)`,
      dayList,
    });

    cursor = cursor.add(1, "week");
  }

  return weeks;
};

export default function MonthSelector({
  summary,
  setWeeks,
  setSelectedMonth,
  allowWeekendEdit,
  uiStatus,
  setUiStatus,
  dayCount,
  viewData
}) {
  const [selected, setSelected] = useState(0);
  const [monthData, setMonthData] = useState(() =>
    generateMonthData(summary)
  );
  const [pendingIndex, setPendingIndex] = useState(null);
  const [openPopup, setOpenPopup] = useState(false);

  useEffect(() => {
    setMonthData(generateMonthData(summary));
  }, [summary]);

  useEffect(() => {
    if (monthData[0]) {
      const weeks = getWeeksOfMonth(monthData[0].monthObj, allowWeekendEdit);
      setWeeks(weeks);
      setSelectedMonth(monthData[0].monthObj.format("YYYY-MM"));
      setUiStatus && setUiStatus(monthData[0].status);
    }
  }, [monthData]);

  const handleChange = (newIndex) => {
    const current = monthData[selected];

    if (uiStatus !== current.status) {
      setPendingIndex(newIndex);
      setOpenPopup(true);
    } else {
      selectMonth(newIndex);
    }
  };

  const selectMonth = (index) => {
    const next = monthData[index];
    setSelected(index);

    const weeks = getWeeksOfMonth(next.monthObj, allowWeekendEdit);
    setWeeks(weeks);
    setSelectedMonth(next.monthObj.format("YYYY-MM"));
    if (setUiStatus) setUiStatus(next.status);
  };

  const confirmChange = () => {
    const next = monthData[pendingIndex];
    if (setUiStatus) setUiStatus(next.status);
    selectMonth(pendingIndex);

    setPendingIndex(null);
    setOpenPopup(false);
  };

  return (
    <Box>
      <FormControl fullWidth>
        <Select
          value={selected}
          onChange={(e) => handleChange(Number(e.target.value))}
          disabled={!!viewData}
          sx={{ border: "1px solid #BFBFBF", borderRadius: "6px" }}
          renderValue={() => (
            <Box>
              <Typography variant="body1">
                {monthData[selected]?.range}
              </Typography>
              <Typography variant="caption" sx={{ color: getStatusColor(uiStatus) }}>
                {uiStatus}
              </Typography>
              <Typography variant="caption" sx={{ display: "block", color: "gray" }}>
                {dayCount}
              </Typography>
            </Box>
          )}
        >
          {monthData.map((item, index) => (
            <MenuItem key={index} value={index}>
              <Box
                sx={{
                  background: item.color,
                  padding: "10px",
                  borderRadius: "6px",
                  width: "100%",
                }}
              >
                <Typography fontWeight="bold">{item.range}</Typography>
                <Typography variant="caption" sx={{ color: getStatusColor(item.status) }}>
                  {item.status}
                </Typography>
                <Typography variant="caption" display="block">
                  {item.days}
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* ---------------- CUSTOM POPUP LIKE PASSWORD CHANGE ---------------- */}
      {openPopup && (
        <>
          {/* Overlay */}
          <Box
            sx={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.3)",
              zIndex: 1200,
            }}
          />

          {/* Center Popup */}
          <Paper
            elevation={6}
            sx={{
              width: 420,
              p: 4,
              borderRadius: 3,
              textAlign: "left",
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 1301,
              backdropFilter: "blur(10px)",
            }}
          >
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              Confirm Timesheet Change
            </Typography>

            <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
              All changes to the current timesheet since your last save or submit will be lost
            </Typography>

            <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
              What would you like to do?
            </Typography>


            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
              <Button variant="outlined" onClick={() => setOpenPopup(false)}>
                Keep Editing
              </Button>

              <Button variant="contained" color="success" onClick={confirmChange}>
                Change Timesheet
              </Button>
            </Box>
          </Paper>
        </>
      )}
    </Box>
  );
}
