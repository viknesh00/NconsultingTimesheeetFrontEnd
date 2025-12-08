import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Typography, Menu, MenuItem } from "@mui/material";
import MonthSelector from "./MonthSelector";
import { makeStyles } from "@material-ui/core/styles";
import { ChevronDown, Save, Pin, Trash2, Plus, MessageSquare, Pencil, FileDown, History, X } from "lucide-react";
import { postRequest, getRequest } from "../../services/Apiservice";
import { ToastError, ToastSuccess } from "../../services/ToastMsg";
import LoadingMask from "../../services/LoadingMask";
import dayjs from "dayjs";
import jsPDF from "jspdf";
import moment from "moment";
import autoTable from "jspdf-autotable";
import { getCookie } from "../../services/Cookies";
import { useLocation } from "react-router-dom";
import Breadcrumb from "../../services/BreadCrumb";

const useStyles = makeStyles(() => ({
    rootBox: {
        backgroundColor: "#ffffff",
        padding: 12,
        borderRadius: 12,
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
    },
    innerBox: {
        width: "360px",
        margin: "0 auto",
    },
    buttonBox: {
        marginTop: 10,
        display: "flex",
        justifyContent: "flex-end",
        gap: 12,
    },
    weekTabBox: {
        marginTop: 10,
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        paddingBottom: 10,
    },
    weekTab: {
        padding: "10px 16px",
        backgroundColor: "#F1F3F4",
        borderRadius: 10,
        cursor: "pointer",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        color: "#333",
        flexShrink: 0,
        transition: "all 0.25s ease",
        border: "1px solid transparent",
        "&:hover": {
            backgroundColor: "#e8eef7",
            transform: "translateY(-2px)",
            boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
        },
    },
    weekSelected: {
        backgroundColor: "#ffffff",
        borderRadius: 10,
        fontWeight: "bold",
        border: "1px solid #1976d2",
        boxShadow: "0 3px 8px rgba(25,118,210,0.2)",
    },
}));

export default function TimesheetCalendar() {
    const classes = useStyles();
    const location = useLocation();
    const { viewData } = location.state || {};
    const breadCrumb = !viewData ? [{ label: "TimeSheet" }] : [{ label: "TimeSheet", link: "/timesheet" }, { label: `${viewData.username} - Timesheet for ${moment(viewData.monthYear).format("MMM-YYYY")}` }];
    const [loading, setLoading] = useState(false);
    const [weeks, setWeeks] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState(dayjs().format("YYYY-MM"));
    const [selectedWeek, setSelectedWeek] = useState(null);
    const [weekDays, setWeekDays] = useState([]);
    const [focusedCell, setFocusedCell] = useState({ rowId: null, dayIndex: null });
    const [commentModalOpen, setCommentModalOpen] = useState(false);
    const [leaveType, setLeaveType] = useState("");
    const [commentText, setCommentText] = useState("");
    const [monthSummary, setMonthSummary] = useState({});
    const [apiDailyRows, setApiDailyRows] = useState([]);
    const [selectedCommentCell, setSelectedCommentCell] = useState({ rowId: null, dayIndex: null });
    const [taskDetails, setTaskDetails] = useState([]);
    const [allowWeekendEdit, setAllowWeekendEdit] = useState(false);
    const [allowOvertime, setAllowOverTime] = useState(false);
    const [logModalOpen, setLogModalOpen] = useState(false);
    const [uiStatus, setUiStatus] = useState("");
    const [holidayList, setHolidayList] = useState(new Set());
    const isMoreActionsEnabled = uiStatus === "Submitted" || uiStatus === "Approved" || uiStatus === "Locked";
    const isEditable = uiStatus === "Saved" || uiStatus === "Not Submitted"
    const [dayCount, setDayCount] = useState(0);
    const [logDetails, setLogDetails] = useState([]);
    const [anchorEl, setAnchorEl] = useState(null);
    const [pdfData, setPdfData] = useState({});
    const open = Boolean(anchorEl);


    // Rows per week: { [weekIndex]: [rows] }
    const [weekRows, setWeekRows] = useState({});

    useEffect(() => {
        getData();
        getlogdetails();
    }, []);

    useEffect(() => {
        let count = 0;

        weeks.forEach((week, weekIndex) => {
            const rows = weekRows[weekIndex] || [];

            week.dayList.forEach((day, dayIndex) => {
                if (!day.inMonth) return;

                let hasValue = false;

                rows.forEach((row) => {
                    const hours = row.hours?.[dayIndex];
                    const note = row.notes?.[dayIndex];

                    // Consider 0 as a valid input
                    if (hours !== null && hours !== undefined) hasValue = true;
                    if (note?.leaveType) hasValue = true;
                    if (note?.comment) hasValue = true;
                });

                if (hasValue) count++;
            });
        });

        setDayCount(count);
    }, [weekRows, weeks]);

    useEffect(() => {
        if (weeks.length > 0 && apiDailyRows.length > 0) {
            const newWeekRows = populateWeekRowsFromAPI(apiDailyRows, weeks);
            setWeekRows(newWeekRows);
        }
    }, [weeks, apiDailyRows]);

    useEffect(() => {
        if (weeks.length > 0 && selectedWeek === null) setSelectedWeek(0);
    }, [weeks]);

    useEffect(() => {
        if (selectedWeek !== null && weeks[selectedWeek]) {
            const days = weeks[selectedWeek].dayList;
            setWeekDays(days);

            setWeekRows((prev) => {
                if (prev[selectedWeek]) return prev;
                return {
                    ...prev,
                    [selectedWeek]: [{ id: Date.now(), hours: {}, pin: false, notes: {} }],
                };
            });
        }
    }, [selectedWeek, weeks]);

    const getData = () => {
        const data = { MonthYear: !viewData ? selectedMonth : viewData.monthYear };
        setLoading(true);
        const url = !viewData ? `TimeSheet/GetTimesheetByMonth` : `TimeSheet/GetTimesheetByMonth?userName=${viewData.username}`;
        postRequest(url, data)
            .then((res) => {
                setLoading(false);
                if (res.data) {
                    setPdfData(res.data);
                    if (res.data.summary) {
                        const item = res.data.summary;
                        const summaryObj = { [item.monthYear]: { status: item.status, workingDays: item.workingDays, totalHours: item.totalHours, isApproved: item.isApproved, isLocked: item.isLocked, monthObj: dayjs(item.monthYear + "-01") } };
                        setMonthSummary(summaryObj);
                        setUiStatus(item.status);
                    }
                    if (res.data.dailyRows && res.data.dailyRows.length > 0) setApiDailyRows(res.data.dailyRows);
                    if (res.data.taskDetails && res.data.taskDetails.length > 0) {
                        setTaskDetails(res.data.taskDetails[0]);
                        setAllowOverTime(res.data.taskDetails[0].allowOvertime);
                        setAllowWeekendEdit(res.data.taskDetails[0].enableWeekend);
                    }
                    if (res.data.holidays && res.data.holidays.length > 0) {
                        const formatHoliday = new Set(
                            res.data.holidays
                                .filter(h => h.eventType === "Holiday")
                                .map(h => new Date(h.eventDate).toDateString())
                        );
                        setHolidayList(formatHoliday);
                    }
                }
            })
            .catch((err) => {
                setLoading(false);
                console.error("Login error:", err);
            });
    };

    const populateWeekRowsFromAPI = (dailyRows, weeks) => {
        const rowsMap = {};
        weeks.forEach((week, weekIndex) => {
            const weekRows = [];
            const weekDates = week.dayList.map(d => d.date.format("YYYY-MM-DD"));
            const rowsForWeek = dailyRows.filter(d => weekDates.includes(dayjs(d.date).format("YYYY-MM-DD")));

            const grouped = {};
            rowsForWeek.forEach(d => {
                const key = d.payCode || "Regular Time";
                if (!grouped[key]) grouped[key] = [];
                grouped[key].push(d);
            });

            Object.keys(grouped).forEach((payCode, idx) => {
                const row = { id: Date.now() + weekIndex + idx, payCode, hours: {}, notes: {} };
                grouped[payCode].forEach(d => {
                    const dayIndex = week.dayList.findIndex(day => day.date.isSame(dayjs(d.date), "day"));
                    if (dayIndex !== -1) row.hours[dayIndex] = d.workingHours;
                    if (dayIndex !== -1) row.notes[dayIndex] = { leaveType: d.leaveType || "", comment: d.comment || "" };
                });
                weekRows.push(row);
            });

            if (weekRows.length === 0) weekRows.push({ id: Date.now() + weekIndex, payCode: "Regular Time", hours: {}, notes: {} });

            rowsMap[weekIndex] = weekRows;
        });
        return rowsMap;
    };

    const handleHourChange = (rowId, dayIndex, value) => {
        if (weekDays[dayIndex]?.isWeekend && !allowWeekendEdit) return;
        setUiStatus("Not Submitted")
        const numericValue = Number(value);
        setWeekRows((prev) => {
            const updatedRows = prev[selectedWeek].map((r) => {
                if (r.id === rowId) {
                    const newHours = { ...r.hours, [dayIndex]: numericValue };
                    const newNotes = { ...r.notes };
                    if (numericValue !== 0) delete newNotes[dayIndex];
                    return { ...r, hours: newHours, notes: newNotes };
                }
                return r;
            });
            return { ...prev, [selectedWeek]: updatedRows };
        });

        if (
            selectedCommentCell.rowId === rowId &&
            selectedCommentCell.dayIndex === dayIndex &&
            numericValue !== 0
        ) {
            setCommentModalOpen(false);
        }
    };

    debugger
    const rows = weekRows[selectedWeek] || [];

    const handleSaveMonth = () => {
        const monthData = [];
        const errors = [];

        weeks.forEach((week, weekIndex) => {
            const rows = weekRows[weekIndex] || [];
            week.dayList.forEach((day, dayIndex) => {
                if (!day.inMonth) return;
                rows.forEach((r) => {
                    const workingHours = r.hours[dayIndex]; // keep undefined if user didn't enter
                    const leaveType = r.notes[dayIndex]?.leaveType || "";
                    const comment = r.notes[dayIndex]?.comment || "";
                    const payCode = r.payCode || "Regular Time";
                    // 🔍 VALIDATION:
                    if (workingHours === 0 && !comment) {
                        errors.push(day.date.format("DD-MMM-YYYY")); // updated format
                    }


                    monthData.push({
                        date: day.date.format("YYYY-MM-DD"),
                        workingHours: workingHours ?? null, // if user entered 0, keep 0
                        leaveType,
                        comment,
                        payCode,
                    });

                });
            });
        });
        if (errors.length > 0) {
            ToastError(
                `Comment is missing for the following days: ${errors.join(", ")}`
            );
            return; // stop saving
        }

        const data = {
            MonthYear: selectedMonth,
            Status: "Saved",
            WorkingDays: monthData.filter(item => item.payCode === "Regular Time" && item.workingHours > 0).length,
            TotalHours: monthData.filter(item => item.payCode === "Overtime").reduce((sum, item) => sum + item.workingHours, 0),
            IsApproved: false,
            IsLocked: false,
            Timesheet: monthData,
        };
        const url = `TimeSheet/InsertOrUpdateTimesheet`;
        setLoading(true)
        postRequest(url, data)
            .then((res) => {
                if (res.status === 200) {
                    ToastSuccess("Saved Successfully");
                    getData();
                    getlogdetails();
                }
            })
            .catch((err) => {
                setLoading(false);
                console.error("Login error:", err);
            });
    };

    const handleSubmitMonth = () => {
        const monthData = [];
        const errors = [];

        weeks.forEach((week, weekIndex) => {
            const rows = weekRows[weekIndex] || [];
            week.dayList.forEach((day, dayIndex) => {
                if (!day.inMonth) return;
                rows.forEach((r) => {
                    const workingHours = r.hours[dayIndex]; // keep undefined if user didn't enter
                    const leaveType = r.notes[dayIndex]?.leaveType || "";
                    const comment = r.notes[dayIndex]?.comment || "";
                    const payCode = r.payCode || "Regular Time";

                    if (workingHours === 0 && !comment) {
                        errors.push(day.date.format("DD-MMM-YYYY")); // updated format
                    }

                    // Only include if user entered something
                    monthData.push({
                        date: day.date.format("YYYY-MM-DD"),
                        workingHours: workingHours ?? null, // if user entered 0, keep 0
                        leaveType,
                        comment,
                        payCode,
                    });
                });
            });
        });

        if (errors.length > 0) {
            ToastError(
                `Comment is missing for the following days: ${errors.join(", ")}`
            );
            return; // stop saving
        }

        const doc = new jsPDF("p", "pt");
        const firstName = getCookie("firstName") || "";
        const lastName = getCookie("lastName") || "";
        const fullName = lastName ? `${firstName} ${lastName}` : firstName;
        const displayName = viewData && viewData.username ? viewData.username : fullName;
        const margin = 14;

        // Helper to format date as DD-MMM-YYYY
        const formatDate = (dateStr) => {
            if (!dateStr) return "N/A";
            const d = new Date(dateStr);
            const day = String(d.getDate()).padStart(2, "0");
            const month = d.toLocaleString("en-GB", { month: "short" });
            const year = d.getFullYear();
            return `${day}-${month}-${year}`;
        };

        // Helper to get all dates in the month
        const getAllDatesInMonth = (monthYear) => {
            const [year, month] = monthYear.split("-").map(Number); // YYYY-MM
            const date = new Date(year, month - 1, 1);
            const dates = [];
            while (date.getMonth() === month - 1) {
                dates.push(new Date(date));
                date.setDate(date.getDate() + 1);
            }
            return dates;
        };

        // Title
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(
            `${displayName} timesheet for ${getMonthRange(pdfData.summary.monthYear)}`,
            margin,
            30
        );

        // Status / Client / Supplier
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(
            `Status: ${pdfData.summary.status ? pdfData.summary.status : "N/A"} | Client: ${pdfData.taskDetails[0]?.client ? pdfData.taskDetails[0].client : "N/A"} | Company Name: N Consulting GMBH`,
            margin,
            50
        );

        // Last Approved / Last Submitted (formatted)
        doc.text(`Last Approved: ${formatDate(pdfData.summary.isApprovedTimesheetManagerAt)}`, margin, 65);
        doc.text(`Last Submitted: ${formatDate(pdfData.summary.updatedAt)}`, margin, 80);

        // Prepare table data for the entire month
        const tableData = [];
        const allDates = getAllDatesInMonth(pdfData.summary.monthYear);

        allDates.forEach((dateObj) => {
            const formattedDate = dateObj.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }).replace(/ /g, "-");

            const rowsForDate = pdfData.dailyRows.filter(r => new Date(r.date).toDateString() === dateObj.toDateString());

            if (rowsForDate.length > 0) {
                rowsForDate.forEach((row, idx) => {
                    tableData.push([
                        idx === 0 ? formattedDate : "", // Show date only for first entry of that day
                        row.payCode === "Overtime" ? (row.workingHours != null ? row.workingHours.toFixed(2) : "") : "",
                        row.payCode === "Regular Time" ? (row.workingHours != null ? row.workingHours.toFixed(2) : "") : "",
                        row.payCode,
                        row.leaveType || "",
                        row.comment || ""
                    ]);
                });
            } else {
                tableData.push([formattedDate, "", "", "", "", ""]);
            }
        });

        // Draw table
        const startY = 100;
        let lastSeenDate = null;
        let dayColorFlag = false;

        autoTable(doc, {
            startY: startY,
            head: [["Date", "Hours", "Days", "Pay Code", "Leave Type", "Comment"]],
            body: tableData,
            styles: { fontSize: 8, cellPadding: 3 },
            headStyles: { fillColor: [220, 220, 220], textColor: 0 },

            didParseCell: function (data) {
                if (data.section !== "body") return;

                const row = tableData[data.row.index];
                const dateLabel = row[0]; // First column, may be "" for multi-row days

                // Determine the actual date for this row
                let effectiveDate = dateLabel !== "" ? dateLabel : lastSeenDate;

                // If this row begins a new date group → flip color
                if (effectiveDate !== lastSeenDate) {
                    dayColorFlag = !dayColorFlag;
                    lastSeenDate = effectiveDate;
                }

                // Apply background color
                const bgColor = dayColorFlag ? [245, 245, 245] : [255, 255, 255];
                data.cell.styles.fillColor = bgColor;
            }
        });


        // Calculate totals
        const totalDays = pdfData.dailyRows
            .filter(r => r.payCode === "Regular Time")
            .reduce((sum, r) => sum + r.workingHours, 0);

        const totalHours = pdfData.dailyRows
            .filter(r => r.payCode === "Overtime")
            .reduce((sum, r) => sum + r.workingHours, 0);

        const pageHeight = doc.internal.pageSize.height;
        const bottomMargin = 50;
        const lineY = pageHeight - bottomMargin;
        const colWidth = 200;

        // Totals above signature
        doc.setFont("helvetica", "bold");
        doc.text(`Total Hours (Over Time): ${totalHours.toFixed(2)}`, margin, lineY - 30);
        doc.text(`Total Days (Regular Time): ${totalDays.toFixed(2)}`, margin, lineY - 15);

        // Signature section
        doc.setFont("helvetica", "normal");

        // Employee section
        doc.line(margin, lineY, margin + colWidth, lineY);
        doc.setFont("helvetica", "bold");
        doc.text(`Employee Name:`, margin, lineY + 12);
        doc.setFont("helvetica", "normal");
        doc.text(`${displayName}`, margin + 90, lineY + 12);

        doc.setFont("helvetica", "bold");
        doc.text(`Date:`, margin, lineY + 27);
        doc.setFont("helvetica", "normal");
        doc.text(`${formatDate(pdfData.summary.updatedAt)}`, margin + 90, lineY + 27);

        // Approver section
        doc.line(margin + 300, lineY, margin + 300 + colWidth, lineY);
        doc.setFont("helvetica", "bold");
        doc.text(`HR Approver:`, margin + 300, lineY + 12);
        doc.setFont("helvetica", "normal");
        doc.text(`${pdfData.summary.isApprovedHRBy || "N/A"}`, margin + 300 + 120, lineY + 12);

        doc.setFont("helvetica", "bold");
        doc.text(`Date:`, margin + 300, lineY + 27);
        doc.setFont("helvetica", "normal");
        doc.text(`${formatDate(pdfData.summary.isApprovedTimesheetManagerAt)}`, margin + 300 + 120, lineY + 27);

        const pdfBase64 = doc.output("datauristring").split(",")[1]; // remove prefix

        const data = {
            MonthYear: selectedMonth,
            Status: "Submitted", // change here
            WorkingDays: monthData.filter(item => item.payCode === "Regular Time" && item.workingHours > 0).length,
            TotalHours: monthData.filter(item => item.payCode === "Overtime").reduce((sum, item) => sum + item.workingHours, 0),
            IsApproved: false,
            IsLocked: false,
            Timesheet: monthData,
            pdfBase64,
            fileName: `${displayName.replace(/\s+/g, "_")}_${selectedMonth}_timesheet.pdf`

        };

        const url = `TimeSheet/InsertOrUpdateTimesheet`;
        setLoading(true);
        postRequest(url, data)
            .then((res) => {
                setLoading(false);
                if (res.status === 200) {
                    ToastSuccess("Submitted Successfully");
                    getData();
                    getlogdetails();
                }
            })
            .catch((err) => {
                setLoading(false);
                console.error("Submit error:", err);
            });
    };

    const handleMoreClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const getlogdetails = () => {
        const data = { MonthYear: !viewData ? selectedMonth : viewData.monthYear };
        const url = !viewData ? `TimeSheet/GetActivityLog` : `TimeSheet/GetActivityLog?userName=${viewData.username}`;
        setLoading(true);
        postRequest(url, data)
            .then((res) => {
                setLoading(false);
                if (res.data) {
                    setLogDetails(res.data)
                }
            })
            .catch((err) => {
                setLoading(false);
                console.error("Login error:", err);
            });
    }

    const handleViewDetails = () => {
        setLogModalOpen(true);
        setAnchorEl(null);
    }

    const getStatusColor = (status) => {
        switch (status) {
            case "Locked": return "green";
            case "Approved": return "#1a7f1a";
            case "Submitted": return "blue";
            case "Saved": return "orange";
            default: return "#000";
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        return d.toLocaleString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true
        });
    };

    const getMonthRange = (monthYear) => {
        if (!monthYear) return "";
        const [year, month] = monthYear.split("-");

        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0);

        return `${start.toLocaleString("en-US", {
            month: "short",
            day: "2-digit"
        })} - ${end.toLocaleString("en-US", {
            month: "short",
            day: "2-digit"
        })}, ${year}`;
    };

    const handleDownloadPDF = () => {
        const doc = new jsPDF("p", "pt");
        const firstName = getCookie("firstName") || "";
        const lastName = getCookie("lastName") || "";
        const fullName = lastName ? `${firstName} ${lastName}` : firstName;
        const displayName = viewData && viewData.username ? viewData.username : fullName;
        const margin = 14;

        // Helper to format date as DD-MMM-YYYY
        const formatDate = (dateStr) => {
            if (!dateStr) return "N/A";
            const d = new Date(dateStr);
            const day = String(d.getDate()).padStart(2, "0");
            const month = d.toLocaleString("en-GB", { month: "short" });
            const year = d.getFullYear();
            return `${day}-${month}-${year}`;
        };

        // Helper to get all dates in the month
        const getAllDatesInMonth = (monthYear) => {
            const [year, month] = monthYear.split("-").map(Number); // YYYY-MM
            const date = new Date(year, month - 1, 1);
            const dates = [];
            while (date.getMonth() === month - 1) {
                dates.push(new Date(date));
                date.setDate(date.getDate() + 1);
            }
            return dates;
        };

        // Title
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(
            `${displayName} timesheet for ${getMonthRange(pdfData.summary.monthYear)}`,
            margin,
            30
        );

        // Status / Client / Supplier
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(
            `Status: ${pdfData.summary.status ? pdfData.summary.status : "N/A"} | Client: ${pdfData.taskDetails[0]?.client ? pdfData.taskDetails[0].client : "N/A"} | Company Name: N Consulting GMBH`,
            margin,
            50
        );

        // Last Approved / Last Submitted (formatted)
        doc.text(`Last Approved: ${formatDate(pdfData.summary.isApprovedTimesheetManagerAt)}`, margin, 65);
        doc.text(`Last Submitted: ${formatDate(pdfData.summary.updatedAt)}`, margin, 80);

        // Prepare table data for the entire month
        const tableData = [];
        const allDates = getAllDatesInMonth(pdfData.summary.monthYear);

        allDates.forEach((dateObj) => {
            const formattedDate = dateObj.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }).replace(/ /g, "-");

            const rowsForDate = pdfData.dailyRows.filter(r => new Date(r.date).toDateString() === dateObj.toDateString());

            if (rowsForDate.length > 0) {
                rowsForDate.forEach((row, idx) => {
                    tableData.push([
                        idx === 0 ? formattedDate : "", // Show date only for first entry of that day
                        row.payCode === "Overtime" ? (row.workingHours != null ? row.workingHours.toFixed(2) : "") : "",
                        row.payCode === "Regular Time" ? (row.workingHours != null ? row.workingHours.toFixed(2) : "") : "",
                        row.payCode,
                        row.leaveType || "",
                        row.comment || ""
                    ]);
                });
            } else {
                tableData.push([formattedDate, "", "", "", "", ""]);
            }
        });

        // Draw table
        const startY = 100;
        let lastSeenDate = null;
        let dayColorFlag = false;

        autoTable(doc, {
            startY: startY,
            head: [["Date", "Hours", "Days", "Pay Code", "Leave Type", "Comment"]],
            body: tableData,
            styles: { fontSize: 8, cellPadding: 3 },
            headStyles: { fillColor: [220, 220, 220], textColor: 0 },

            didParseCell: function (data) {
                if (data.section !== "body") return;

                const row = tableData[data.row.index];
                const dateLabel = row[0]; // First column, may be "" for multi-row days

                // Determine the actual date for this row
                let effectiveDate = dateLabel !== "" ? dateLabel : lastSeenDate;

                // If this row begins a new date group → flip color
                if (effectiveDate !== lastSeenDate) {
                    dayColorFlag = !dayColorFlag;
                    lastSeenDate = effectiveDate;
                }

                // Apply background color
                const bgColor = dayColorFlag ? [245, 245, 245] : [255, 255, 255];
                data.cell.styles.fillColor = bgColor;
            }
        });


        // Calculate totals
        const totalDays = pdfData.dailyRows
            .filter(r => r.payCode === "Regular Time")
            .reduce((sum, r) => sum + r.workingHours, 0);

        const totalHours = pdfData.dailyRows
            .filter(r => r.payCode === "Overtime")
            .reduce((sum, r) => sum + r.workingHours, 0);

        const pageHeight = doc.internal.pageSize.height;
        const bottomMargin = 50;
        const lineY = pageHeight - bottomMargin;
        const colWidth = 200;

        // Totals above signature
        doc.setFont("helvetica", "bold");
        doc.text(`Total Hours (Over Time): ${totalHours.toFixed(2)}`, margin, lineY - 30);
        doc.text(`Total Days (Regular Time): ${totalDays.toFixed(2)}`, margin, lineY - 15);

        // Signature section
        doc.setFont("helvetica", "normal");

        // Employee section
        doc.line(margin, lineY, margin + colWidth, lineY);
        doc.setFont("helvetica", "bold");
        doc.text(`Employee Name:`, margin, lineY + 12);
        doc.setFont("helvetica", "normal");
        doc.text(`${displayName}`, margin + 90, lineY + 12);

        doc.setFont("helvetica", "bold");
        doc.text(`Date:`, margin, lineY + 27);
        doc.setFont("helvetica", "normal");
        doc.text(`${formatDate(pdfData.summary.updatedAt)}`, margin + 90, lineY + 27);

        // Approver section
        doc.line(margin + 300, lineY, margin + 300 + colWidth, lineY);
        doc.setFont("helvetica", "bold");
        doc.text(`HR Approver:`, margin + 300, lineY + 12);
        doc.setFont("helvetica", "normal");
        doc.text(`${pdfData.summary.isApprovedHRBy || "N/A"}`, margin + 300 + 120, lineY + 12);

        doc.setFont("helvetica", "bold");
        doc.text(`Date:`, margin + 300, lineY + 27);
        doc.setFont("helvetica", "normal");
        doc.text(`${formatDate(pdfData.summary.isApprovedTimesheetManagerAt)}`, margin + 300 + 120, lineY + 27);

        // Save PDF
        const monthText = getMonthRange(pdfData.summary.monthYear).replace(/\s+/g, "_");
        doc.save(`${displayName}_${monthText}_timesheet.pdf`);
    };

    return (
        <Box className={classes.rootBox}>
            <LoadingMask loading={loading} />
            <Breadcrumb items={breadCrumb} />
            {logModalOpen && (
                <>
                    {/* BACKDROP */}
                    <div
                        id="log-backdrop"
                        style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            width: "100vw",
                            height: "100vh",
                            background: "rgba(0,0,0,0.2)",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            zIndex: 2000,
                        }}
                        onClick={(e) => {
                            if (e.target.id === "log-backdrop") setLogModalOpen(false);
                        }}
                    />

                    {/* MODAL */}
                    <div
                        style={{
                            background: "#fff",
                            padding: 20,
                            width: 380,
                            maxHeight: "80vh",
                            overflowY: "auto",
                            borderRadius: 10,
                            position: "fixed",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            zIndex: 2100,
                            boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* HEADER */}
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: 15,
                                borderBottom: "1px solid #e0e0e0",
                                paddingBottom: 8, // spacing between text and border
                            }}
                        >
                            <h4 style={{ margin: 0, fontWeight: 600 }}>
                                Details | {getMonthRange(selectedMonth)}
                            </h4>

                            <div
                                style={{
                                    cursor: "pointer",
                                    padding: 5,
                                    borderRadius: "50%",
                                    transition: "0.2s",
                                }}
                                onClick={() => setLogModalOpen(false)}
                            >
                                <X size={20} color="#333" />
                            </div>
                        </div>


                        {/* LIST OF LOGS */}
                        {logDetails?.map((item, index) => (
                            <div
                                key={index}
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                    marginBottom: 15,
                                    gap: 10, // optional spacing
                                }}
                            >
                                {/* LEFT: ACTION TYPE */}
                                <div
                                    style={{
                                        fontWeight: "bold",
                                        fontSize: 15,
                                        color: getStatusColor(item.actionType),
                                        minWidth: 100, // adjust width as needed
                                    }}
                                >
                                    {item.actionType}
                                </div>

                                {/* RIGHT: OTHER DETAILS */}
                                <div style={{ flex: 1 }}>
                                    <div>{item.fullName} ({item.role})</div>

                                    <div
                                        style={{
                                            marginTop: 2,
                                            fontSize: 12,
                                            color: "#666",
                                        }}
                                    >
                                        {formatDate(item.performedAt)}
                                    </div>

                                    {item.comments && (
                                        <div style={{ fontSize: 12, fontStyle: "italic", marginTop: 2 }}>
                                            Comments: {item.comments}
                                        </div>
                                    )}

                                    <div
                                        style={{
                                            marginTop: 10,
                                            borderTop: "1px solid #e0e0e0",
                                        }}
                                    />
                                </div>
                            </div>
                        ))}

                    </div>
                </>
            )}

            <Box className={classes.innerBox}>
                <MonthSelector
                    summary={monthSummary}
                    setWeeks={setWeeks}
                    setSelectedMonth={setSelectedMonth}
                    allowWeekendEdit={allowWeekendEdit}
                    uiStatus={uiStatus} // <-- pass current status
                    setUiStatus={setUiStatus} // <-- allow MonthSelector to update status
                    dayCount={dayCount}
                    viewData={viewData}
                />
            </Box>

            {/* BUTTONS */}
            <Box className={classes.buttonBox}>

                {!viewData && (
                    <>
                        {uiStatus === "Submitted" || uiStatus === "Approved" ? (
                            <Button
                                variant="contained"
                                color="warning"
                                startIcon={<Pencil size={16} />}
                                disabled={monthSummary[selectedMonth]?.isLocked}
                                onClick={() => setUiStatus("Not Submitted")}
                            >
                                Edit Timesheet
                            </Button>
                        ) : (
                            <>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<Save size={18} />}
                                    onClick={handleSaveMonth}
                                    disabled={!isEditable}
                                >
                                    Save Changes
                                </Button>

                                <Button
                                    variant="contained"
                                    sx={{ backgroundColor: "green" }}
                                    onClick={handleSubmitMonth}
                                    disabled={!isEditable}
                                >
                                    Submit for Approval
                                </Button>
                            </>
                        )}
                    </>
                )}

                <Button
                    variant="outlined"
                    endIcon={<ChevronDown size={18} />}
                    onClick={handleMoreClick}
                    sx={{ textTransform: "none", width: 180 }}
                >
                    More Actions
                </Button>

                <Menu
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleMenuClose}
                    PaperProps={{
                        sx: {
                            width: anchorEl ? anchorEl.clientWidth : undefined,
                        },
                    }}
                >
                    <MenuItem onClick={handleDownloadPDF} disabled={!isMoreActionsEnabled}>
                        <FileDown size={18} style={{ marginRight: 10 }} />
                        Download PDF
                    </MenuItem>

                    <MenuItem onClick={handleViewDetails} disabled={!isMoreActionsEnabled}>
                        <History size={18} style={{ marginRight: 10 }} />
                        Audit Log
                    </MenuItem>
                </Menu>

            </Box>


            {/* WEEK TABS */}
            <Box className={classes.weekTabBox}>
                {weeks.map((w, i) => (
                    <Box
                        key={i}
                        className={`${classes.weekTab} ${selectedWeek === i ? classes.weekSelected : ""}`}
                        onClick={() => setSelectedWeek(i)}
                    >
                        <Typography variant="body2">{w.label.split("(")[0]}</Typography>
                        <Typography variant="caption">{w.label.match(/\((.*?)\)/)?.[1]}</Typography>
                    </Box>
                ))}
            </Box>

            <Box sx={{ borderTop: "1px solid #e0e0e0" }} />

            {/* ================= DETAILS BELOW WEEK TABS ================= */}
            <Box
                sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: 4,
                    mt: 1.25,
                    mb: 1.25,
                }}
            >
                {/* Project Name */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography sx={{ fontWeight: "bold", fontSize: "0.9rem", color: "#555" }}>
                        Project Name:
                    </Typography>
                    <Typography sx={{ fontSize: "0.9rem", color: "#111" }}>
                        {taskDetails.project}
                    </Typography>
                </Box>

                {/* Task */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography sx={{ fontWeight: "bold", fontSize: "0.9rem", color: "#555" }}>
                        Task:
                    </Typography>
                    <Typography sx={{ fontSize: "0.9rem", color: "#111" }}>
                        {taskDetails.task}
                    </Typography>
                </Box>

                {/* Client */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography sx={{ fontWeight: "bold", fontSize: "0.9rem", color: "#555" }}>
                        Client:
                    </Typography>
                    <Typography sx={{ fontSize: "0.9rem", color: "#111" }}>
                        {taskDetails.client}
                    </Typography>
                </Box>

                {/* Timesheet Approver */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography sx={{ fontWeight: "bold", fontSize: "0.9rem", color: "#555" }}>
                        Timesheet Approver:
                    </Typography>
                    <Typography sx={{ fontSize: "0.9rem", color: "#111" }}>
                        {taskDetails.timesheetApprover}
                    </Typography>
                </Box>

                {/* HR Approver */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography sx={{ fontWeight: "bold", fontSize: "0.9rem", color: "#555" }}>
                        HR Approver:
                    </Typography>
                    <Typography sx={{ fontSize: "0.9rem", color: "#111" }}>
                        {taskDetails.hrApprover}
                    </Typography>
                </Box>
            </Box>


            <Box sx={{ borderTop: "1px solid #e0e0e0" }} />


            <Box
                mt={1.25}
                sx={{
                    boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                    borderRadius: 1, // optional, to soften edges
                    p: 2,           // optional padding
                    backgroundColor: "#fff", // optional background
                }}
            >
                {/* LEGENDS */}
                <Box mb={1.25} display="flex" justifyContent="flex-end" gap={3}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <Box sx={{ width: 14, height: 14, bgcolor: "#ffe6e6", borderRadius: 1 }} />
                        <Typography variant="caption">Holiday</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                        <Box sx={{ width: 14, height: 14, bgcolor: "#e6f0ff", borderRadius: 1 }} />
                        <Typography variant="caption">Weekend</Typography>
                    </Box>
                </Box>

                {/* MAIN ROWS */}

                {/* ROW LABELS */}
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography sx={{ width: 240, display: "flex", justifyContent: "flex-end", gap: "4px" }} fontWeight="bold">
                        Pay Code <span style={{ color: "red" }}> (required)</span>
                    </Typography>

                    <Box display="flex" gap={2} alignItems="flex-start">
                        {weekDays.map((d, i) => (
                            <Box key={i} sx={{ width: 80, textAlign: "center" }}>
                                <Typography variant="caption" fontWeight="bold" display="block">
                                    {d.date.format("ddd")}
                                </Typography>
                                <Typography variant="caption" color="gray" display="block">
                                    {d.date.format("DD/MM")}
                                </Typography>
                            </Box>
                        ))}
                        <Box sx={{ width: 80, textAlign: "center" }}>
                            <Typography variant="caption" fontWeight="bold" display="block">
                                TOTAL
                            </Typography>
                            <Typography variant="caption" display="block" sx={{ visibility: "hidden" }}>
                                00/00
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                {/* ROWS */}
                {rows.map((row) => (
                    <Box key={row.id} mt={1.25}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            {/* LEFT: ICONS + PAY CODE */}
                            <Box display="flex" alignItems="center" gap={1.5}>
                                <Box display="flex" alignItems="center" gap={0.5}>
                                    <Button
                                        size="small"
                                        sx={{ minWidth: 32, height: 32, border: "1px solid #ccc" }}
                                        onClick={() =>
                                            setWeekRows((prev) => ({
                                                ...prev,
                                                [selectedWeek]: prev[selectedWeek].map((r) =>
                                                    r.id === row.id ? { ...r, pin: !r.pin } : r
                                                ),
                                            }))
                                        }
                                    >
                                        <Pin size={16} />
                                    </Button>
                                    <Button
                                        size="small"
                                        sx={{
                                            minWidth: 32,
                                            height: 32,
                                            border: "1px solid #ccc",
                                            opacity: row.pin ? 0.5 : 1,
                                            cursor: row.pin ? "not-allowed" : "pointer",
                                        }}
                                        disabled={row.pin}
                                        onClick={() => {
                                            if (!row.pin) {
                                                setWeekRows((prev) => ({
                                                    ...prev,
                                                    [selectedWeek]: prev[selectedWeek].filter((r) => r.id !== row.id),
                                                }));
                                            }
                                        }}
                                    >
                                        <Trash2 size={16} />
                                    </Button>
                                </Box>
                                <select
                                    value={row.payCode || ""}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setWeekRows((prev) => ({
                                            ...prev,
                                            [selectedWeek]: prev[selectedWeek].map((r) =>
                                                r.id === row.id ? { ...r, payCode: value } : r
                                            ),
                                        }));
                                    }}
                                    disabled={!isEditable || (rows.length === 2)}
                                    style={{ padding: "6px", width: "170px", borderRadius: "4px", border: "1px solid #ccc" }}
                                >
                                    {rows.length === 1 ? (
                                        <>
                                            <option value="Regular Time">Regular Time (Days)</option>
                                            {allowOvertime && <option value="Overtime">Overtime (Hours)</option>}
                                        </>
                                    ) : (
                                        <option value={row.payCode}>
                                            {row.payCode === "Overtime"
                                                ? "Overtime (Hours)"
                                                : "Regular Time (Days)"}
                                        </option>
                                    )}
                                </select>

                            </Box>

                            {/* DAY INPUTS */}
                            <Box display="flex" gap={2} alignItems="center">
                                {weekDays.map((d, i) => {
                                    const isHoliday = holidayList.has(d.date.toDate().toDateString());
                                    const isDisabledWeekend = d.isWeekend && !allowWeekendEdit;
                                    const raw = row.hours[i];
                                    const dayValue = (isDisabledWeekend || isHoliday)
                                        ? ""
                                        : (raw === null || raw === undefined ? "" : raw);


                                    return (
                                        <Box key={i} sx={{ width: 80, textAlign: "center" }}>
                                            {row.payCode === "Overtime" ? (
                                                // Overtime input
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={8}
                                                    step={1}
                                                    value={dayValue === null || dayValue === undefined ? "" : dayValue} // <-- allow empty string
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        // Only allow numbers within range or empty
                                                        if (val === "") {
                                                            handleHourChange(row.id, i, ""); // pass empty string
                                                        } else {
                                                            const num = Number(val);
                                                            if (num >= 0 && num <= 8) {
                                                                handleHourChange(row.id, i, num);
                                                            }
                                                        }
                                                    }}
                                                    onFocus={() => setFocusedCell({ rowId: row.id, dayIndex: i })}
                                                    onBlur={() => setFocusedCell({ rowId: null, dayIndex: null })}
                                                    disabled={!isEditable || !d.inMonth || isDisabledWeekend || isHoliday}
                                                    style={{
                                                        width: "80px",
                                                        height: "30px",
                                                        borderRadius: "4px",
                                                        border: "1px solid #ccc",
                                                        textAlign: "center",
                                                        backgroundColor: !d.inMonth
                                                            ? "#f0f0f0"
                                                            : isHoliday
                                                                ? "#ffe6e6"
                                                                : d.isWeekend
                                                                    ? "#e6f0ff"
                                                                    : "white",
                                                    }}
                                                />

                                            ) : (
                                                // Regular Time select
                                                <select
                                                    value={dayValue}
                                                    onChange={(e) => handleHourChange(row.id, i, e.target.value)}
                                                    onFocus={() => setFocusedCell({ rowId: row.id, dayIndex: i })}
                                                    onBlur={() => setFocusedCell({ rowId: null, dayIndex: null })}
                                                    disabled={!isEditable || !d.inMonth || isDisabledWeekend || isHoliday}
                                                    style={{
                                                        width: "80px",
                                                        height: "30px",
                                                        borderRadius: "4px",
                                                        border: "1px solid #ccc",
                                                        textAlign: "center",
                                                        backgroundColor: !d.inMonth
                                                            ? "#f0f0f0"
                                                            : isHoliday
                                                                ? "#ffe6e6"
                                                                : d.isWeekend
                                                                    ? "#e6f0ff"
                                                                    : "white",
                                                    }}
                                                >
                                                    <option value="" hidden></option>
                                                    <option value="0">0</option>
                                                    <option value="0.5">0.5</option>
                                                    <option value="1">1</option>
                                                </select>
                                            )}
                                        </Box>
                                    );
                                })}

                                {/* TOTAL */}
                                <Box sx={{ width: 80, textAlign: "center" }}>
                                    <Box
                                        sx={{
                                            width: "80px",
                                            height: "30px",
                                            border: "1px solid #ccc",
                                            borderRadius: "4px",
                                            lineHeight: "30px",
                                            fontWeight: "bold",
                                            margin: "0 auto",
                                        }}
                                    >
                                        {Object.values(row.hours).reduce((a, b) => a + b, 0)}
                                    </Box>
                                </Box>
                            </Box>

                        </Box>

                        {/* COMMENT ICON BELOW THIS ROW */}
                        <Box display="flex" justifyContent="flex-end" mt={0.5}>
                            <Box display="flex" gap={2}>
                                {weekDays.map((d, i) => {
                                    const saved = row.notes[i] || {};
                                    const hasSaved = Boolean(saved.leaveType) || Boolean(saved.comment);

                                    return (
                                        <Box key={i} sx={{ width: 80, textAlign: "center" }}>

                                            {(focusedCell.rowId === row.id && focusedCell.dayIndex === i) || hasSaved ? (
                                                <MessageSquare
                                                    size={16}
                                                    style={{ cursor: "pointer", opacity: 0.85 }}
                                                    onMouseDown={() => {
                                                        setSelectedCommentCell({ rowId: row.id, dayIndex: i });
                                                        setCommentModalOpen(true);
                                                        setLeaveType(saved.leaveType || "");
                                                        setCommentText(saved.comment || "");
                                                    }}
                                                />
                                            ) : null}

                                        </Box>
                                    );
                                })}
                                <Box sx={{ width: 80 }} />
                            </Box>
                        </Box>

                        {/* COMMENT MODAL */}
                        {commentModalOpen &&
                            selectedCommentCell.rowId === row.id &&
                            rows.find((r) => r.id === row.id) && (
                                <>
                                    {/* BACKDROP */}
                                    <div
                                        id="popup-backdrop"
                                        style={{
                                            position: "fixed",
                                            top: 0,
                                            left: 0,
                                            width: "100vw",
                                            height: "100vh",
                                            background: "rgba(0,0,0,0.2)",
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            zIndex: 2000,
                                        }}
                                        onClick={(e) => {
                                            if (e.target.id === "popup-backdrop") setCommentModalOpen(false);
                                        }}
                                    />

                                    {/* MODAL */}
                                    <div
                                        style={{
                                            background: "#fff",
                                            padding: 20,
                                            width: 350,
                                            borderRadius: 10,
                                            position: "fixed",
                                            top: "50%",
                                            left: "50%",
                                            transform: "translate(-50%, -50%)",
                                            zIndex: 2100,
                                        }}
                                        onClick={(e) => e.stopPropagation()} // <-- prevent backdrop click closing modal
                                    >
                                        <h4 style={{ marginBottom: 10 }}>Employee Notes</h4>

                                        {/* LEAVE TYPE */}
                                        {row.hours[selectedCommentCell.dayIndex] === 0 && (
                                            <select
                                                value={leaveType}
                                                onChange={(e) => {
                                                    setUiStatus("Not Submitted");
                                                    const value = e.target.value;
                                                    setLeaveType(value);
                                                    setWeekRows((prev) => ({
                                                        ...prev,
                                                        [selectedWeek]: prev[selectedWeek].map((r) => {
                                                            if (r.id === row.id) {
                                                                return {
                                                                    ...r,
                                                                    notes: {
                                                                        ...r.notes,
                                                                        [selectedCommentCell.dayIndex]: {
                                                                            ...r.notes[selectedCommentCell.dayIndex],
                                                                            leaveType: value,
                                                                            comment: commentText,
                                                                        },
                                                                    },
                                                                };
                                                            }
                                                            return r;
                                                        }),
                                                    }));
                                                }}
                                                style={{
                                                    width: "100%",
                                                    padding: "10px",
                                                    borderRadius: 5,
                                                    border: "1px solid #ccc",
                                                    marginBottom: 12,
                                                }}
                                            >
                                                <option value="">Select Leave</option>
                                                <option value="Sick Leave">Sick Leave</option>
                                                <option value="Casual Leave">Casual Leave</option>
                                                <option value="Comp Off">Comp Off</option>
                                                <option value="Unpaid Leave">Unpaid Leave</option>

                                            </select>
                                        )}

                                        {/* COMMENT */}
                                        <textarea
                                            value={commentText}
                                            onChange={(e) => {
                                                setUiStatus("Not Submitted");
                                                const value = e.target.value;
                                                setCommentText(value);
                                                setWeekRows((prev) => ({
                                                    ...prev,
                                                    [selectedWeek]: prev[selectedWeek].map((r) => {
                                                        if (r.id === row.id) {
                                                            return {
                                                                ...r,
                                                                notes: {
                                                                    ...r.notes,
                                                                    [selectedCommentCell.dayIndex]: {
                                                                        ...r.notes[selectedCommentCell.dayIndex],
                                                                        leaveType: leaveType,
                                                                        comment: value,
                                                                    },
                                                                },
                                                            };
                                                        }
                                                        return r;
                                                    }),
                                                }));
                                            }}
                                            placeholder="Enter comment..."
                                            style={{
                                                width: "100%",
                                                height: "100px",
                                                padding: "10px",
                                                borderRadius: 5,
                                                border: "1px solid #ccc",
                                                resize: "none",
                                                boxSizing: "border-box",
                                            }}
                                        />
                                    </div>
                                </>
                            )}

                    </Box>
                ))}

                {/* ADD BUTTON */}
                <Button
                    startIcon={<Plus size={18} />}
                    variant="outlined"
                    sx={{ height: 32, textTransform: "none" }}
                    disabled={!isEditable || (!allowOvertime && rows.length >= 1) || (allowOvertime && rows.length >= 2)}
                    onClick={() =>
                        setWeekRows((prev) => {
                            const currentRows = prev[selectedWeek] || [];
                            const newRow = { id: Date.now(), hours: {}, pin: false, notes: {}, payCode: "" };

                            if (currentRows.length === 0) {
                                newRow.payCode = "";
                            } else if (currentRows.length === 1 && allowOvertime) {
                                if (currentRows[0].payCode === "Overtime") {
                                    currentRows[0].payCode = "Overtime";
                                    newRow.payCode = "Regular Time";
                                } else {
                                    currentRows[0].payCode = "Regular Time";
                                    newRow.payCode = "Overtime";
                                }
                            }

                            return {
                                ...prev,
                                [selectedWeek]: [...currentRows, newRow],
                            };
                        })
                    }
                >
                    Add
                </Button>

                {/* DIVIDER LINE */}
                <Box sx={{ borderTop: "1px solid #e0e0e0", mt: 1.25, mb: 1 }} />

                {/* TOTAL DAYS ROW */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Box sx={{ width: 240, display: "flex", justifyContent: "flex-end" }}>
                        <Typography sx={{ fontWeight: "bold", fontSize: "0.9rem", color: "#555" }}>
                            TOTAL DAYS
                        </Typography>
                    </Box>

                    <Box display="flex" gap={2} alignItems="center">
                        {weekDays.map((_, i) => {
                            const dayTotal = rows
                                .filter((r) => r.payCode === "Regular Time")
                                .reduce((sum, r) => sum + (r.hours[i] || 0), 0);

                            return (
                                <Box key={i} sx={{ width: 80, textAlign: "center" }}>
                                    <Typography variant="caption" fontWeight="bold">
                                        {dayTotal}
                                    </Typography>
                                </Box>
                            );
                        })}

                        {/* TOTAL DAYS SUM */}
                        <Box sx={{ width: 80, textAlign: "center" }}>
                            <Typography variant="caption" fontWeight="bold">
                                {rows
                                    .filter((r) => r.payCode === "Regular Time")
                                    .reduce((sum, r) => sum + Object.values(r.hours).reduce((a, b) => a + b, 0), 0)}
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                {/* TOTAL HOURS ROW */}
                {allowOvertime &&
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Box sx={{ width: 240, display: "flex", justifyContent: "flex-end" }}>
                            <Typography sx={{ fontWeight: "bold", fontSize: "0.9rem", color: "#555" }}>
                                TOTAL HOURS
                            </Typography>
                        </Box>

                        <Box display="flex" gap={2} alignItems="center">
                            {weekDays.map((_, i) => {
                                const otTotal = rows
                                    .filter((r) => r.payCode === "Overtime")
                                    .reduce((sum, r) => sum + (r.hours[i] || 0), 0);

                                return (
                                    <Box key={i} sx={{ width: 80, textAlign: "center" }}>
                                        <Typography variant="caption" fontWeight="bold">
                                            {otTotal}
                                        </Typography>
                                    </Box>
                                );
                            })}

                            {/* TOTAL OT SUM */}
                            <Box sx={{ width: 80, textAlign: "center" }}>
                                <Typography variant="caption" fontWeight="bold">
                                    {rows
                                        .filter((r) => r.payCode === "Overtime")
                                        .reduce((sum, r) => sum + Object.values(r.hours).reduce((a, b) => a + b, 0), 0)}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                }
            </Box>
        </Box>
    );
}
