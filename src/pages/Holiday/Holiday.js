import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Plus, ArrowLeft, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import LoadingMask from "../../services/LoadingMask";
import Breadcrumb from "../../services/BreadCrumb";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { Typography, Box, Button } from "@mui/material";
import { getRequest } from "../../services/Apiservice";
import { getCookie } from "../../services/Cookies";

dayjs.extend(isoWeek);

const useStyles = makeStyles(() => ({
    rootBox: {
        backgroundColor: "#fff",
        padding: 12,
        borderRadius: 8,
        boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
    },
    addButtonContainer: {
        display: "flex",
        justifyContent: "flex-end",
        marginBottom: "10px",
    },
    addButton: {
        backgroundColor: "#0c4a6e",
        gap: "8px",
        textTransform: "none",
    },
    calendarWrapper: {
        maxWidth: 600,
        margin: "0 auto",
        padding: 16,
        display: "flex",
        flexDirection: "column",
    },
    table: {
        borderCollapse: "collapse",
        textAlign: "center",
        fontSize: 18,
        width: "100%",
        tableLayout: "fixed", // <-- add this
    },
    td: {
        width: 80,
        height: 80,
        border: "1px solid #ddd",
        cursor: "pointer",
        verticalAlign: "top",
        position: "relative",
        padding: 0, // <-- reduce padding
        boxSizing: "border-box", // <-- include border in size
    },

    th: {
        padding: "10px 15px",
        border: "1px solid #ddd",
        backgroundColor: "#e0e0e0",
    },


    // Background colors defined ONLY in makeStyles (as required)

    dimDay: {
        color: "#bbb",
        backgroundColor: "#fafafa",
    },
    today: {
        backgroundColor: "#dbeafe !important",
        border: "2px solid #2563eb",
    },
    weekend: {
        backgroundColor: "#FFF7E6", // soft weekend orange
    },
    holidayCell: {
        backgroundColor: "#ffe6e6 !important",
    },
    eventCell: {
        backgroundColor: "#FFFDE7", // soft yellow
    },
    holidayTag: {
        marginTop: 4,
        padding: "2px 4px",
        backgroundColor: "#ffcccc",
        color: "#990000",
        fontSize: 12,
        borderRadius: 4,
        fontWeight: 600,
        maxWidth: 100, // limit the width of the label
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    eventTag: {
        marginTop: 4,
        padding: "2px 4px",
        backgroundColor: "#FEF3C7",
        color: "#B45309",
        fontSize: 12,
        borderRadius: 4,
        fontWeight: 600,
        maxWidth: 100, // limit the width of the label
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    }
}));

export default function Holiday() {
    const classes = useStyles();
    const navigate = useNavigate();
    const breadCrumb = [{ label: "Calendar" }];
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(dayjs());
    const role = getCookie("role");

    useEffect(() => {
        getEvent();
    }, []);


    const getEvent = () => {
        const url = `Holiday/GetHolidays`
        getRequest(url)
            .then((res) => {
                if (res.data && res.data.length > 0) {
                    const formatted = res.data.map(x => ({
                        ...x,
                        eventDate: dayjs(x.eventDate).format("YYYY-MM-DD")
                    }));

                    setHolidays(formatted);
                }
            })
            .catch((err) => {
                console.error("Error fetching user:", err);
            });
    }

    // FINAL DATA FORMAT (city + type)


    const generateCalendar = () => {
        const startOfMonth = currentMonth.startOf("month");
        const endOfMonth = currentMonth.endOf("month");

        const startDate = startOfMonth.startOf("isoWeek");
        const endDate = endOfMonth.endOf("isoWeek");

        const days = [];
        let cur = startDate;

        while (cur.isBefore(endDate) || cur.isSame(endDate)) {
            days.push(cur);
            cur = cur.add(1, "day");
        }
        return days;
    };

    const totalDays = generateCalendar();
    const weeks = [];
    for (let i = 0; i < totalDays.length; i += 7) {
        weeks.push(totalDays.slice(i, i + 7));
    }

    const currentYear = dayjs().year();
    const thisYear = currentMonth.year();

    const handleCreateForm = () => navigate("/calendar/create-event");

    const handleEdit = (holiday) => {
        navigate("/calendar/edit-event", { state: { holiday } });
    };


    return (
        <Box className={classes.rootBox}>
            <LoadingMask loading={loading} />
            <Breadcrumb items={breadCrumb} />

            {/* CREATE BUTTON (ONLY FOR ADMIN) */}
            {role === "Admin" && (
                <Box className={classes.addButtonContainer}>
                    <Button
                        variant="contained"
                        onClick={handleCreateForm}
                        className={classes.addButton}
                    >
                        <Plus size={20} /> Create Event
                    </Button>
                </Box>
            )}


            {/* HEADER WITH MONTH ARROWS */}
            <Box display="flex" justifyContent="center" alignItems="center" gap={4} mb={2}>
                <ArrowLeft
                    onClick={() => setCurrentMonth(currentMonth.subtract(1, "month"))}
                    size={32}
                    style={{ cursor: "pointer" }}
                />

                <Typography variant="h5" style={{ minWidth: 180, textAlign: "center" }}>
                    {currentMonth.format("MMMM YYYY")}
                </Typography>

                <ArrowRight
                    onClick={() => {
                        const next = currentMonth.add(1, "month");
                        if (next.isSame(dayjs(), "month") || next.isBefore(dayjs(), "month")) {
                            setCurrentMonth(next);
                        }
                    }}
                    size={32}
                    style={{
                        cursor:
                            currentMonth.add(1, "month").isAfter(dayjs(), "month")
                                ? "not-allowed"
                                : "pointer",
                        opacity:
                            currentMonth.add(1, "month").isAfter(dayjs(), "month")
                                ? 0.4
                                : 1
                    }}
                />

            </Box>

            {/* CALENDAR */}
            <div className={classes.calendarWrapper}>
                <table className={classes.table}>
                    <thead>
                        <tr>
                            {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
                                <th key={d} className={classes.th}>{d}</th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {weeks.map((week, i) => (
                            <tr key={i}>
                                {week.map((day) => {
                                    const isCurrentMonth = day.month() === currentMonth.month();
                                    const isToday = day.format("YYYY-MM-DD") === dayjs().format("YYYY-MM-DD");
                                    const isWeekend = [6, 0].includes(day.day()); // Sat=6, Sun=0

                                    const holidayObj = holidays.find(
                                        h =>
                                            h.eventDate === day.format("YYYY-MM-DD") &&
                                            dayjs(h.eventDate).month() === currentMonth.month()
                                    );


                                    let cellClass = "";

                                    if (!isCurrentMonth) cellClass = classes.dimDay;
                                    if (isWeekend && isCurrentMonth) cellClass = classes.weekend;

                                    if (holidayObj && holidayObj.city) {
                                        if (holidayObj.eventType === "Holiday") {
                                            cellClass = classes.holidayCell;
                                        } else if (holidayObj.eventType === "Event") {
                                            cellClass = classes.eventCell;
                                        }
                                    }

                                    if (isToday) cellClass = classes.today;

                                    return (
                                        <td
                                            key={day.format("YYYY-MM-DD")}
                                            className={`${classes.td} ${cellClass}`}
                                            onClick={() => role === "Admin" && holidayObj && handleEdit(holidayObj)}
                                            style={{ cursor: role === "Admin" && holidayObj ? "pointer" : "default" }}
                                        >

                                            {/* DATE */}
                                            <div>{day.format("DD")}</div>

                                            {/* HOLIDAY LABEL */}
                                            {holidayObj && (
                                                <div className={
                                                    holidayObj.eventType === "Holiday"
                                                        ? classes.holidayTag
                                                        : classes.eventTag
                                                }
                                                    title={`${holidayObj.eventName}${holidayObj.city ? ` (${holidayObj.city})` : ""}`}
                                                >
                                                    {holidayObj.eventName}
                                                    <br />
                                                    {holidayObj.city ? `(${holidayObj.city})` : ""}
                                                </div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Box>
    );
}
