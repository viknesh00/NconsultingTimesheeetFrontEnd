import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import MUIDataTable from "mui-datatables";
import LoadingMask from "../../services/LoadingMask";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { makeStyles } from "@material-ui/core/styles";
import { getRequest, postRequest } from "../../services/Apiservice";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { IconButton, Tooltip } from "@mui/material";
import { Check, RotateCcw, Lock, Unlock } from "lucide-react";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getCookie } from "../../services/Cookies";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Radio,
    RadioGroup,
    FormControlLabel,
    Button,
    TextField
} from "@mui/material";
import { ToastError } from "../../services/ToastMsg";
import Breadcrumb from "../../services/BreadCrumb";


const getMuiTheme = () =>
    createTheme({
        components: {
            MUIDataTableHeadCell: {
                styleOverrides: {
                    data: { textTransform: "none !important" },
                    root: { textTransform: "none !important" },
                },
            },
            MUIDataTableViewCol: {
                styleOverrides: {
                    root: { padding: "8px 12px !important" },
                    label: { textTransform: "none !important" },
                },
            },
            // MuiFormControl: {
            //     styleOverrides: {
            //         root: {
            //             minWidth: "160px !important",       // full label visible
            //             whiteSpace: "normal !important",
            //         },
            //     },
            // },   
        },
    });

const useStyles = makeStyles(() => ({
    tableBody: {
        "& .Mui-active .MuiTableSortLabel-icon": {
            color: "#fff !important",
        },
        "& .tss-10rusft-MUIDataTableToolbar-icon": {
            color: "#0c4a6e",
            boxShadow:
                "0px -1px 2px 0 #065881 inset, 0px 1px 1px 1px #ccc, 0 0 0 6px #fff, 0 2px 12px 8px #ddd",
            borderRadius: "5px",
            marginLeft: "15px",
        },
        "& .tss-9z1tfs-MUIDataTableToolbar-iconActive": {
            color: "#0c4a6e",
            boxShadow:
                "0px -1px 2px 0 #065881 inset, 0px 1px 1px 1px #ccc, 0 0 0 6px #fff, 0 2px 12px 8px #ddd",
            borderRadius: "5px",
            marginLeft: "15px",
        },
        "& .tss-qbo1l6-MUIDataTableToolbar-actions": {
            justifyContent: "left",
            position: "absolute",
        },
        "& .tss-1ufdzki-MUIDataTableSearch-main": {
            marginRight: "10px",
            width: 500,
        },
        "& .tss-1fz5efq-MUIDataTableToolbar-left": {
            position: "absolute",
            right: 25,
        },
        "& .tss-1h5wt30-MUIDataTableSearch-searchIcon": {
            color: "#0c4a6e",
        },
    },
    rootBox: {
        backgroundColor: "#fff",
        padding: 12,
        borderRadius: 8,
        boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
    },
    dateFilterBox: {
        display: "flex",
        gap: 12,
        alignItems: "center",
        marginBottom: 16,
        justifyContent: "flex-end",
    },
    statusActive: {
        color: "#0a9949",
        fontWeight: 500,
        cursor: "pointer",
    },
    statusInactive: {
        color: "#d32f2f",
        fontWeight: 500,
        cursor: "pointer",
    },
    statusPending: {
        color: "#7D7D7D",
        fontWeight: 500,
        cursor: "pointer",
    },
    iconBox: {
        color: "#0c4a6e",
        boxShadow: "0px -1px 2px 0 #065881 inset, 0px 1px 1px 1px #ccc, 0 0 0 6px #fff, 0 2px 12px 8px #ddd",
        marginLeft: "15px",
        padding: "8px 8px",
        marginLeft: "18px",
        cursor: "pointer",
    },

}));

export default function TimeSheetOverview() {
    const classes = useStyles();
    const navigate = useNavigate();
    const breadCrumb = [{ label: "TimeSheet" }];
    const [loading, setLoading] = useState(false);
    const [singleDate, setSingleDate] = useState(dayjs());
    const [tableData, setTableData] = useState([]);
    const [comment, setComment] = useState("");
    const userRole = getCookie("role");
    const isAdminOrHR = userRole === "Admin" || userRole === "HR Manager";
    const isAdminOrTimesheetApprover = userRole === "Admin" || userRole === "Timesheet Approver";

    const [selectedRowsData, setSelectedRowsData] = useState([]);
    const [openModal, setOpenModal] = useState(false);
    const [selectedField, setSelectedField] = useState("");
    const [selectedRowIndex, setSelectedRowIndex] = useState(null);
    const [radioValue, setRadioValue] = useState("");

    useEffect(() => {
        if (!singleDate) return;
        getTimeSheetEntries(singleDate);
    }, [singleDate]);

    const getTimeSheetEntries = (monthObj) => {
        const selectedMonth = monthObj.format("YYYY-MM");
        const url = `TimeSheet/GetTimesheet?month=${selectedMonth}`;

        setLoading(true);
        getRequest(url)
            .then((res) => {
                setTableData(res?.data || []);
                setLoading(false);
            })
            .catch((err) => {
                console.error("API Error:", err);
                setLoading(false);
            });
    };

    const handleReset = () => {
        setSingleDate(dayjs());
        setTableData([]);
    };

    const handleFilter = () => {
        if (!singleDate) return;
        getTimeSheetEntries(singleDate);
    };

    const handleOpenModal = (field, rowIndex, value) => {
        setSelectedField(field);
        setComment(""); // reset comment

        if (field === "isLocked") {
            setRadioValue(value ? "locked" : "not_locked");
        } else {
            setRadioValue(value ? "approved" : "not_approved");
        }

        setSelectedRowIndex(rowIndex);
        setOpenModal(true);
    };

    const handleSave = () => {
        const row = tableData[selectedRowIndex];
        if (radioValue === "not_approved" && comment.trim() === "") {
            ToastError("Please enter a comment for not approving.");
            return;
        }
        const payload = {
            username: row.username,
            monthYear: dayjs(singleDate).format("YYYY-MM"),
            actionType:
                selectedField === "isApprovedHR"
                    ? "HR_APPROVAL"
                    : selectedField === "isApprovedTimesheetManager"
                        ? "MANAGER_APPROVAL"
                        : "LOCK",
            actionValue:
                selectedField === "isLocked"
                    ? radioValue === "locked"
                    : radioValue === "approved",
            comment: radioValue === "not_approved" ? comment : null,
        };
        const url = "TimeSheet/UpdateTimesheetStatus";
        postRequest(url, payload)
            .then((res) => {
                console.log("Updated successfully:", res);

                getTimeSheetEntries(singleDate); // refresh table
                setOpenModal(false);
            })
            .catch((err) => {
                console.error("Error updating:", err);
                setOpenModal(false);
            });
    };


    const handleCancel = () => setOpenModal(false);

    const getBackgroundColor = (status) => {
        switch (status?.toLowerCase()) {
            case "approved":
                return "#DFF5D8";           // green light
            case "rejected":
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

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case "approved":
                return "#0F7B0F";           // green
            case "rejected":
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



    const StatusChip = ({ label, cursorDefault }) => {
        return (
            <div
                style={{
                    backgroundColor: getBackgroundColor(label),
                    color: getStatusColor(label),
                    padding: "2px 8px",
                    fontWeight: 500,
                    fontSize: "12px",
                    lineHeight: "18px",
                    borderRadius: "16px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textTransform: "capitalize",
                    cursor: cursorDefault ? "default" : "pointer"
                }}
            >
                {label}
            </div>
        );
    };



    const columns = [
        { name: "username", label: "User Name" },
        {
            name: "status",
            label: "Status",
            options: {
                customBodyRender: (value) => <StatusChip label={value} cursorDefault />,
            },
        },
        { name: "workingDays", label: "Regular-Time (Days)" },
        { name: "totalHours", label: "Overtime (Hours)" },
        {
            name: "isApprovedTimesheetManager",
            label: "Timesheet Approver",
            options: {
                display: isAdminOrTimesheetApprover || userRole === "HR Manager",
                customBodyRender: (value, meta) => {
                    const row = tableData[meta.rowIndex];

                    const allow =
                        row.status === "Submitted" ||
                        row.status === "Approved" ||
                        row.status === "Locked";

                    if (!allow) return "";

                    const allowEditing =
                        isAdminOrTimesheetApprover && // Only Timesheet Approver / Admin can edit
                        (row.status === "Submitted" || row.status === "Approved" || row.status === "Locked") &&
                        !row.isLocked;

                    // Determine label to display
                    let label = "";
                    if (row.isApprovedTimesheetManagerBy === null) {
                        label = "Pending";
                    } else {
                        label = row.isApprovedTimesheetManager ? "Approved" : "Rejected";
                    }

                    // If user is HR Manager, only display the label (no click)
                    if (userRole === "HR Manager") {
                        return <StatusChip label={label} cursorDefault />;
                    }

                    // For Admin / Timesheet Approver, allow click only if editable
                    if (allowEditing) {
                        return (
                            <span onClick={() => handleOpenModal("isApprovedTimesheetManager", meta.rowIndex, value)}>
                                <StatusChip label={label} />
                            </span>
                        );
                    }

                    // Otherwise, show label without click
                    return <StatusChip label={label} />;
                },
            },
        },
        {
            name: "isApprovedHR",
            label: "HR Approver",
            options: {
                display: isAdminOrHR,
                customBodyRender: (value, meta) => {
                    const row = tableData[meta.rowIndex];

                    const allow =
                        row.status === "Submitted" ||
                        row.status === "Approved" ||
                        row.status === "Locked";

                    if (!allow) return "";

                    // Pending
                    if (row.isApprovedHRBy === null) {
                        return (
                            <span onClick={() => handleOpenModal("isApprovedHR", meta.rowIndex, value)}>
                                <StatusChip label="Pending" />
                            </span>
                        );
                    }

                    // Approved / Rejected
                    const label = value ? "Approved" : "Rejected";

                    return (
                        <span
                            onClick={() => !row.isLocked && handleOpenModal("isApprovedHR", meta.rowIndex, value)}
                        >
                            <StatusChip label={label} />
                        </span>
                    );
                },
            },
        },

        {
            name: "isLocked",
            label: "Locked",
            options: {
                customBodyRender: (value, meta) => {
                    const row = tableData[meta.rowIndex];

                    // if (row.status !== "Approved" && row.status !== "Locked" && row.isApprovedTimesheetManagerBy === null) return "";
                    if (!row.isApprovedTimesheetManagerBy && row.status !== "Locked") return "";
                    const isAllowed = isAdminOrHR;
                    return (
                        <span
                            style={{ color: "#0a9949", cursor: isAllowed ? "pointer" : "default", display: "flex", alignItems: "center" }}
                            onClick={() => {
                                if (isAllowed) {
                                    handleOpenModal("isLocked", meta.rowIndex, value);
                                }
                            }}
                        >
                            {value ? (
                                <Lock size={18} />
                            ) : (
                                <Unlock size={18} />
                            )}
                        </span>
                    );
                },
            },
        },
        {
            name: "action",
            label: "Action",
            options: {
                customBodyRender: (val, meta) => {
                    const rowData = tableData[meta.rowIndex];
                    return (
                        <IconButton
                            onClick={() =>
                                navigate("/timesheet/timesheet-view", {
                                    state: {
                                        viewData: rowData,
                                        selectedMonth: singleDate.format("MMM-YYYY"),
                                    },
                                })
                            }
                        >
                            <Eye size={18} />
                        </IconButton>
                    );
                },
            },
        },
    ];

    const handleBulkLock = () => {
        if (!selectedRowsData || selectedRowsData.length === 0) {
            ToastError("Please select at least one row to lock!");
            return;
        }

        // Validate all selected rows — they must be approved by Timesheet Approver
        const invalidRows = selectedRowsData.filter(row => !row.isApprovedTimesheetManager);

        if (invalidRows.length > 0) {
            ToastError("Only Timesheet Approver Approved entries can be locked.");
            return;
        }

        // Proceed only if all rows are valid
        const payload = selectedRowsData.map(row => ({
            username: row.username,
            monthYear: singleDate.format("YYYY-MM"),
            actionType: "LOCK",
            actionValue: true,
            comment: null
        }));

        postRequest("TimeSheet/BulkUpdateTimesheetStatus", payload)
            .then(res => {
                getTimeSheetEntries(singleDate);
                setSelectedRowsData([]);
            })
            .catch(err => console.error(err));
    };



    const custom = () => {
        if (!isAdminOrHR) return null; // Don't render anything if not Admin or HR

        return (
            <Tooltip title="Bulk Lock">
                <IconButton
                    onClick={handleBulkLock}
                    className="tss-10rusft-MUIDataTableToolbar-icon"
                >
                    <Lock size={20} />
                </IconButton>
            </Tooltip>
        );
    };


    const options = {
        customToolbarSelect: () => { },
        selectToolbarPlacement: "none",
        responsive: "standard",
        filterType: 'multiselect',
        selectableRows: "multiple",
        download: true,
        print: true,
        search: true,
        filter: true,
        viewColumns: true,
        customToolbar: custom,
        rowsPerPage: 10,
        rowsPerPageOptions: [10, 15, 50, 100],
        onRowSelectionChange: (currentRowsSelected, allRowsSelected, rowsSelected) => {
            const selectedData = rowsSelected.map(index => tableData[index]);
            console.log(selectedData)
            setSelectedRowsData(selectedData);

        },
    };

    return (
        <Box className={classes.rootBox}>
            <LoadingMask loading={loading} />
            <Breadcrumb items={breadCrumb} />
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Box className={classes.dateFilterBox}>
                    <DatePicker
                        label="Select Month"
                        value={singleDate}
                        onChange={(v) => setSingleDate(v)}
                        views={["year", "month"]}
                        inputFormat="MM/YYYY"
                        slotProps={{ textField: { size: "small" } }}
                    />

                    <Tooltip title="Apply Filter">
                        <IconButton onClick={handleFilter}>
                            <Check size={20} />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Reset Filters">
                        <IconButton onClick={handleReset}>
                            <RotateCcw size={20} />
                        </IconButton>
                    </Tooltip>
                </Box>
            </LocalizationProvider>

            <Box className="reportstablehead">
                <ThemeProvider theme={getMuiTheme()}>
                    <MUIDataTable
                        title="Employee Timesheet"
                        className={classes.tableBody}
                        data={tableData}
                        columns={columns}
                        options={options}
                    />
                </ThemeProvider>
            </Box>

            {/* Status / Lock Modal */}
            <Dialog
                open={openModal}
                onClose={handleCancel}
                maxWidth="sm"
                fullWidth
                sx={{
                    "& .MuiDialog-paper": {
                        width: "520px",      // increase width
                        padding: "10px 0",   // adjust spacing
                        borderRadius: "10px",
                    },
                }}
            >
                <DialogTitle sx={{ fontWeight: 600, fontSize: "18px" }}>
                    {selectedField === "isLocked"
                        ? "Update Timesheet Lock Status"
                        : "Update Approval Status"}
                </DialogTitle>

                <DialogContent dividers>
                    <Box mb={2}>
                        <strong>Select Status:</strong>
                    </Box>

                    <RadioGroup
                        value={radioValue}
                        onChange={(e) => setRadioValue(e.target.value)}
                    >
                        {selectedField === "isLocked" ? (
                            <Box display="flex" flexDirection="row" gap={1}>
                                <FormControlLabel value="locked" control={<Radio />} label="Locked" />
                                <FormControlLabel value="not_locked" control={<Radio />} label="Not Locked" />
                            </Box>
                        ) : (
                            <Box display="flex" flexDirection="row" gap={1}>
                                <FormControlLabel value="approved" control={<Radio />} label="Approved" />
                                <FormControlLabel value="not_approved" control={<Radio />} label="Rejected" />
                            </Box>
                        )}
                    </RadioGroup>
                    {radioValue === "not_approved" && (
                        <Box mt={2}>
                            <TextField
                                fullWidth
                                multiline
                                minRows={3}
                                label="Comments (required)"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                            />
                        </Box>
                    )}

                </DialogContent>

                <DialogActions sx={{ padding: "12px 24px" }}>
                    <Button variant="outlined" onClick={handleCancel}>Cancel</Button>
                    <Button variant="contained" onClick={handleSave} color="primary">
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}