import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    Box,
    TextField,
    Button,
    Typography,
    RadioGroup,
    Radio,
    FormControlLabel
} from "@mui/material";
import { makeStyles } from "@material-ui/core/styles";
import Autocomplete from "@mui/material/Autocomplete";
import { postRequest, getRequest } from "../../services/Apiservice";
import { ToastSuccess } from "../../services/ToastMsg";
import LoadingMask from "../../services/LoadingMask";
import Breadcrumb from "../../services/BreadCrumb";

// ------------------ STYLES ------------------
const useStyles = makeStyles({
    rootBox: {
        backgroundColor: "#fff",
        padding: 12,
        borderRadius: 8,
        boxShadow: "0 1px 4px rgba(0,0,0,0.12)"
    },
    container: {
        maxWidth: 1000,
        margin: "50px auto",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 32
    },
    title: {
        textAlign: "center",
        fontWeight: 500
    },
    gridRow: {
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 20,
        alignItems: "center"
    },
    radioRow: {
        display: "flex",
        alignItems: "center",
        gap: 16
    },
    buttonsContainer: {
        display: "flex",
        justifyContent: "center",
        gap: 16,
        marginTop: 16
    }
});

// --------------------------------------------------------

const CreateTask = () => {
    const classes = useStyles();
    const navigate = useNavigate();
    const location = useLocation();
    const editData = location.state?.editData || null;
    const breadCrumb = [
    { label: "Managing Task", link: "/managingtask" },
    { label: editData ? "Edit-Task" : "Create-Task" }
  ];
    const [userOptions, setUserOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hrApproverList, setHrApproverList] = useState([]);
    const [timeSheetApproverList, setTimeSheetApproverList] = useState([])

   useEffect(() => {
    getTaskManager();
}, []); // <- empty dependency to run once


    const getTaskManager = () => {
        const url = `Account/GetTaskManager`;
        setLoading(true);
        getRequest(url)
          .then((res) => {
            if (res.data) {
              setHrApproverList(res.data.hrManagers);
              setTimeSheetApproverList(res.data.timesheetApprovers);
              setLoading(false);
            }
          })
          .catch((err) => {
            setLoading(false);
            console.error("Login error:", err);
          });
      };

    const [formValues, setFormValues] = useState({
        taskId: editData?.taskId ?? null,

        selectedUser: editData ? {
            userName: editData.userName,
            employeeName: editData.employeeName,
            employeeId: editData.employeeId
        } : null,
        userName: editData?.userName || "",
        employeeName: editData?.employeeName || "",
        employeeId: editData?.employeeId || "",
        project: editData?.project || "",
        client: editData?.client || "",
        task: editData?.task || "",
        timesheetApprover: timeSheetApproverList.find(x => x.value === editData?.timesheetApprover) || null,
        hrApprover: hrApproverList.find(x => x.value === editData?.hrApprover) || null,
        enableWeekend: editData?.enableWeekend ?? false,
        allowOvertime: editData?.allowOvertime ?? false
    });


    useEffect(() => {
        getUserName();
    }, []);

    useEffect(() => {
    if (hrApproverList.length > 0 && timeSheetApproverList.length > 0 && editData) {
        setFormValues(prev => ({
            ...prev,
            timesheetApprover: timeSheetApproverList.find(x => x.value === editData.timesheetApprover) || null,
            hrApprover: hrApproverList.find(x => x.value === editData.hrApprover) || null
        }));
    }
}, [hrApproverList, timeSheetApproverList, editData]);


    const getUserName = () => {
        getRequest(`Task/TaskUserList`)
            .then((res) => {
                if (res.data && res.data.length > 0) {
                    setUserOptions(res.data); // keep full object
                }
            })
            .catch((err) => console.error("Error fetching users:", err));
    };

    // ------------------ Save ------------------
    const handleSave = () => {
        const saveData = {
            taskId: formValues.taskId,
            userName: formValues.userName,
            employeeName: formValues.employeeName,
            employeeId: formValues.employeeId,
            project: formValues.project,
            client: formValues.client,
            task: formValues.task,
            timesheetApprover: formValues.timesheetApprover.value,
            hrApprover: formValues.hrApprover.value,
            enableWeekend: formValues.enableWeekend,
            allowOvertime: formValues.allowOvertime
        };

        setLoading(true);
        postRequest(`Task/SaveTask`, saveData)
            .then((res) => {
                if (res.status === 200) {
                    ToastSuccess(res.data.message);
                    navigate("/managingtask");
                    setLoading(false);
                }
            })
            .catch((err) => {
                setLoading(false);
                console.error("Save error:", err);
            });
    };

    return (
        <Box className={classes.rootBox}>
            <LoadingMask loading={loading} />
            <Breadcrumb items={breadCrumb} />
            <Box className={classes.container}>
                <Typography variant="h6" className={classes.title}>
                    {editData ? "Edit Task" : "Create Task"}
                </Typography>

                {/* ROW 1 - User Name, Employee Name, Employee ID */}
                <Box className={classes.gridRow}>
                    {/* User Name */}
                    <Autocomplete
                        fullWidth
                        disabled={!!editData}   // 🔥 disable in edit mode
                        options={userOptions}
                        getOptionLabel={(option) => option.userName || ""}
                        value={formValues.selectedUser}
                        onChange={(e, newValue) => {
                            setFormValues({
                                ...formValues,
                                selectedUser: newValue,
                                userName: newValue?.userName || "",
                                employeeName: newValue?.employeeName || "",
                                employeeId: newValue?.employeeId || ""
                            });
                        }}
                        renderInput={(params) => <TextField {...params} label="User Name" />}
                    />


                    {/* Employee Name */}
                    <TextField
                        label="Employee Name"
                        value={formValues.employeeName}
                        disabled
                        fullWidth
                    />

                    {/* Employee ID */}
                    <TextField
                        label="Employee ID"
                        value={formValues.employeeId}
                        disabled
                        fullWidth
                    />
                </Box>

                {/* ROW 2 - Project, Client, Task */}
                <Box className={classes.gridRow}>
                    <TextField
                        label="Project"
                        value={formValues.project}
                        onChange={(e) =>
                            setFormValues({ ...formValues, project: e.target.value })
                        }
                        fullWidth
                    />

                    <TextField
                        label="Client"
                        value={formValues.client}
                        onChange={(e) =>
                            setFormValues({ ...formValues, client: e.target.value })
                        }
                        fullWidth
                    />

                    <TextField
                        label="Task"
                        value={formValues.task}
                        onChange={(e) =>
                            setFormValues({ ...formValues, task: e.target.value })
                        }
                        fullWidth
                    />
                </Box>

                {/* ROW 3 - Timesheet Approver, HR Manager Approver, empty */}
                <Box className={classes.gridRow}>
                    <Autocomplete
                        fullWidth
                        options={timeSheetApproverList}
                        getOptionLabel={(option) => option.label || ""}
                        value={formValues.timesheetApprover} // should be {label, value} object
                        onChange={(event, newValue) => setFormValues({ ...formValues, timesheetApprover: newValue })}
                        renderInput={(params) => <TextField {...params} label="Timesheet Approver" />}
                    />

                    <Autocomplete
                        fullWidth
                        options={hrApproverList}
                        getOptionLabel={(option) => option.label || ""}
                        value={formValues.hrApprover} // should be {label, value} object
                        onChange={(event, newValue) => setFormValues({ ...formValues, hrApprover: newValue })}
                        renderInput={(params) => <TextField {...params} label="HR Manager Approver" />}
                    />
                    <div></div> {/* empty column */}
                </Box>

                {/* ROW 4 - Enable Weekend, Allow Overtime, empty */}
                <Box className={classes.gridRow}>
                    {/* Enable Weekend */}
                    <Box className={classes.radioRow}>
                        <Typography sx={{ minWidth: 130 }}>Enable Weekend</Typography>
                        <RadioGroup
                            row
                            value={formValues.enableWeekend}
                            onChange={(e) =>
                                setFormValues({
                                    ...formValues,
                                    enableWeekend: e.target.value === "true"
                                })
                            }
                        >
                            <FormControlLabel value={true} control={<Radio />} label="Yes" />
                            <FormControlLabel value={false} control={<Radio />} label="No" />
                        </RadioGroup>
                    </Box>

                    {/* Allow Overtime */}
                    <Box className={classes.radioRow}>
                        <Typography sx={{ minWidth: 130 }}>Allow Overtime</Typography>
                        <RadioGroup
                            row
                            value={formValues.allowOvertime}
                            onChange={(e) =>
                                setFormValues({
                                    ...formValues,
                                    allowOvertime: e.target.value === "true"
                                })
                            }
                        >
                            <FormControlLabel value={true} control={<Radio />} label="Yes" />
                            <FormControlLabel value={false} control={<Radio />} label="No" />
                        </RadioGroup>
                    </Box>

                    <div></div> {/* empty column */}
                </Box>

                {/* BUTTONS */}
                <Box className={classes.buttonsContainer}>
                    <Button variant="contained" onClick={handleSave}>
                        {editData ? "Update" : "Save"}
                    </Button>

                    <Button variant="outlined" onClick={() => navigate("/managingtask")}>
                        Cancel
                    </Button>
                </Box>
            </Box>
        </Box>
    );
};

export default CreateTask;
