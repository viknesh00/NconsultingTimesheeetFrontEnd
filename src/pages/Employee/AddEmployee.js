import React, { useEffect, useState } from "react";
import {
    Button,
    Typography,
    Card,
    CardContent,
    Box,
    TextField,
} from "@mui/material";
import Autocomplete from '@mui/material/Autocomplete';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useNavigate, useParams } from "react-router-dom";
import { X } from "lucide-react";
import IconButton from "@mui/material/IconButton";
import { getRequest, postRequest } from "../../services/Apiservice";
import { ToastError, ToastSuccess } from "../../services/ToastMsg";
import { format, parseISO } from "date-fns";
import LoadingMask from "../../services/LoadingMask";
import Breadcrumb from "../../services/BreadCrumb";

export default function AddEmployee() {
    const navigate = useNavigate();
    const { email } = useParams();
    const [loading, setLoading] = useState(false);
    const [departmentNames, setDepartmentNames] = useState([]);
    const [managerList, setManagerList] = useState([]);
    const isEditMode = !!email;
    const breadCrumb = !isEditMode ? [{ label: "Employee", link: "/employees" }, { label: "Add-Employee" }] : [{ label: "Employee", link: "/employees" }, { label: "Edit-Employee" }];
    const [formvalues, setFormvalues] = useState({
        firstName: null,
        lastName: null,
        email: null,
        employeeType: null,
        department: null,
        designation: null,
        doj: null,
        city: null,
        country: null,
        workLocation: null,
        reportingManager: null,
        accessRole: null,
        employmentStatus: null,
        employeeId: null
    });

    useEffect(() => {
        if (isEditMode) {
            fetchEmployeeData(email);
        }
    }, [email]);

    useEffect(() => {
        getDepartmentName();
        getManagerLists();
    }, [])

    const getDepartmentName = () => {
        getRequest(`Department/GetAllDepartment`)
            .then((res) => {
                if (res.data && res.data.length > 0) {
                    const formattedList = res.data.map((item) => ({
                        label: item.departmentName,
                        value: item.departmentName
                    }));
                    setDepartmentNames(formattedList);
                }
            })
            .catch((err) => {
                console.error("Error fetching user:", err);
            });
    }

    const getManagerLists = () => {
        getRequest(`Account/GetManagerLists`)
            .then((res) => {
                if (res.data && res.data.length > 0) {
                    setManagerList(res.data);
                }
            })
            .catch((err) => {
                console.error("Error fetching user:", err);
            });
    }


    const fetchEmployeeData = () => {
        getRequest(`User/GetUser/${email}`)
            .then((res) => {
                if (res.data && res.data.length > 0) {
                    const data = res.data[0];

                    setFormvalues({
                        ...data,
                        doj: data.doj ? new Date(data.doj) : null,
                        employeeType: data.employeeType ? { label: data.employeeType, value: data.employeeType } : null,
                        department: data.department ? { label: data.department, value: data.department } : null,
                        accessRole: data.accessRole ? { label: data.accessRole, value: data.accessRole } : null,
                        employmentStatus: data.employmentStatus ? { label: data.employmentStatus, value: data.employmentStatus } : null,
                        reportingManager: data.reportingManager ? { label: data.reportingManager, value: data.reportingManager } : null,
                    });
                }
            })
            .catch((err) => {
                console.error("Error fetching user:", err);
            });
    };



    const extractValues = (data) => {
        const newObj = {};
        for (const key in data) {
            const item = data[key];
            let value = item && typeof item === "object" && "value" in item ? item.value : item;
            if (value && (key === "dob" || key === "doj")) {
                // If value is already a Date object
                if (value instanceof Date) {
                    value = format(value, "yyyy-MM-dd");
                }
                else if (typeof value === "string") {
                    const parsedDate = parseISO(value); // try ISO first
                    if (!isNaN(parsedDate)) {
                        value = format(parsedDate, "yyyy-MM-dd");
                    }
                }
            }
            newObj[key] = value;
        }
        return newObj;
    };

    const checkEmailExistAsync = async () => {
        const email = formvalues.email;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            ToastError("Please enter a valid email address!");
            return false;
        }

        const url = `User/CheckEmail?email=${email}`;
        setLoading(true);

        try {
            const res = await getRequest(url);
            setLoading(false);

            if (res.data?.emailExists) {
                ToastError("Entered Email already exists!");
                return false;
            }

            return true; // Email is valid and available
        } catch (err) {
            setLoading(false);
            console.error("Check email error:", err);
            ToastError(err.response?.data?.message || "Failed to check email");
            return false;
        }
    };


    const validateStep = async () => {

        if (!formvalues.firstName || !formvalues.lastName || !formvalues.email) {
            ToastError("Please fill all mandatory fields");
            return false;
        }
        if (!isEditMode) {
            const emailValid = await checkEmailExistAsync();
            if (!emailValid) return false;
        }
        if (!formvalues.employeeId || !formvalues.department || !formvalues.workLocation || !formvalues.accessRole) {
            ToastError("Please fill all mandatory fields");
            return false;
        }
        return true;
    };


    const handleNext = async () => {
        const isValid = await validateStep(); // wait for async validation
        if (!isValid) return; // stop if validation fails
        const data = extractValues(formvalues);
        const url = isEditMode ? `User/Edit` : `User/Add`;
        setLoading(true);
        postRequest(url, data)
            .then((res) => {
                setLoading(false);
                if (res.status === 200) {
                    navigate("/employees");
                    ToastSuccess(isEditMode ? "User Updated Successfully" : "User Added Successfully");
                }
            })
            .catch((err) => {
                setLoading(false);
                if (err.response && err.response.status === 409) {
                    ToastError(err.response.data.message); // Email already exists
                } else {
                    ToastError("Failed to save user data");
                }
            });
    };


    const handleCancel = () => {
        navigate("/employees");
    };

    return (
        <Box>
            <LoadingMask loading={loading} />
            <Breadcrumb items={breadCrumb} />
            <Card elevation={1} sx={{ height: "600px", borderRadius: 3, display: "flex", flexDirection: "column" }}>
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        px: 3,
                        mt: 2,
                    }}
                >
                    <Box sx={{ width: 24 }} /> {/* Empty placeholder to keep title perfectly centered */}

                    <Typography variant="h5" sx={{ my: 3, fontWeight: 600, textAlign: "center" }}>
                        {isEditMode ? "Update Employee" : "Add Employee"}
                    </Typography>

                    <IconButton onClick={handleCancel}>
                        <X size={24} />
                    </IconButton>
                </Box>

                <CardContent sx={{ flex: 1, overflowY: "auto", mt: 2, mb: 2 }}>
                    <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                        <TextField
                            fullWidth
                            label={<span>First Name <span style={{ color: 'red' }}>*</span></span>}
                            value={formvalues.firstName || ""}
                            onChange={(e) =>
                                setFormvalues({ ...formvalues, firstName: e.target.value })
                            }
                        />
                        <TextField
                            fullWidth
                            label={<span>Last Name <span style={{ color: 'red' }}>*</span></span>}
                            value={formvalues.lastName || ""}
                            onChange={(e) =>
                                setFormvalues({ ...formvalues, lastName: e.target.value })
                            }
                        />
                        <TextField
                            fullWidth
                            label={<span>Email (User ID) <span style={{ color: 'red' }}>*</span></span>}
                            type="email" // ensures browser-level email validation
                            value={formvalues.email || ""}
                            onChange={(e) =>
                                setFormvalues({ ...formvalues, email: e.target.value })
                            }
                            disabled={isEditMode}
                        />
                    </Box>
                    <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                        <TextField
                            fullWidth
                            label={<span>Employee Id <span style={{ color: 'red' }}>*</span></span>}
                            value={formvalues.employeeId || ""}
                            onChange={(e) =>
                                setFormvalues({ ...formvalues, employeeId: e.target.value })
                            }
                        />
                        <Autocomplete
                            fullWidth
                            options={[
                                { label: 'Permanent', value: 'Permanent' },
                                { label: 'Contract', value: 'Contract' },
                                { label: 'Intern', value: 'Intern' },
                                { label: 'FreeLancer', value: 'FreeLancer' },
                                { label: 'MiniJob', value: 'MiniJob' },
                                { label: 'PartTime', value: 'PartTime' },
                                { label: 'FTE', value: 'FTE' }
                            ]}
                            getOptionLabel={(option) => option.label || ""}
                            value={formvalues.employeeType} // should be {label, value} object
                            onChange={(event, newValue) => setFormvalues({ ...formvalues, employeeType: newValue })}
                            renderInput={(params) => <TextField {...params} label="Employee Type" />}
                        />
                        <TextField
                            fullWidth
                            label="Designation"
                            value={formvalues.designation || ""}
                            onChange={(e) =>
                                setFormvalues({ ...formvalues, designation: e.target.value })
                            }
                        />
                    </Box>
                    <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DatePicker
                                fullWidth
                                label="Date of Joining"
                                value={formvalues.doj}
                                format="dd/MM/yyyy"
                                onChange={(newValue) => setFormvalues({ ...formvalues, doj: newValue })}
                                renderInput={(params) => <TextField fullWidth  {...params} />}
                                sx={{ flex: 1 }}
                            />
                        </LocalizationProvider>
                        <Autocomplete
                            fullWidth
                            options={[
                                { label: 'Infy-DTAG', value: 'Infy-DTAG' },
                                { label: 'Infy-MBAG', value: 'Infy-MBAG' },
                                { label: 'Reporting Managers', value: 'Reporting Managers' },
                                { label: 'Human Resources', value: 'Human Resources' }
                            ]}
                            getOptionLabel={(option) => option.label || ""}
                            value={formvalues.department} // should be {label, value} object
                            onChange={(event, newValue) => setFormvalues({ ...formvalues, department: newValue })}
                            renderInput={(params) => <TextField {...params} label={<span>Department <span style={{ color: 'red' }}>*</span></span>} />}
                            sx={{ flex: 1 }}
                        />
                        <TextField
                            fullWidth
                            label="Country"
                            value={formvalues.country || ""}
                            onChange={(e) =>
                                setFormvalues({ ...formvalues, country: e.target.value })
                            }
                            sx={{ flex: 1 }}
                        />

                    </Box>
                    <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                        <TextField
                            fullWidth
                            label="City"
                            value={formvalues.city || ""}
                            onChange={(e) =>
                                setFormvalues({ ...formvalues, city: e.target.value })
                            }
                        />
                        <TextField
                            fullWidth
                             label={<span>Work Location <span style={{ color: 'red' }}>*</span></span>}
                            value={formvalues.workLocation || ""}
                            onChange={(e) =>
                                setFormvalues({ ...formvalues, workLocation: e.target.value })
                            }
                        />
                        <Autocomplete
                            fullWidth
                            options={[
                                { label: 'Active', value: 'Active' },
                                { label: 'Probation', value: 'Probation' },
                                { label: 'Resigned', value: 'Resigned' },
                            ]}
                            getOptionLabel={(option) => option.label || ""}
                            value={formvalues.employmentStatus} // should be {label, value} object
                            onChange={(event, newValue) => setFormvalues({ ...formvalues, employmentStatus: newValue })}
                            renderInput={(params) => <TextField {...params} label="Employement Status" />}
                        />
                    </Box>
                    <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                        <Autocomplete
                            fullWidth
                            freeSolo                       // ✅ allows typing
                            options={managerList}
                            getOptionLabel={(option) =>
                                typeof option === "string" ? option : option.label || ""
                            }
                            value={formvalues.reportingManager}
                            onChange={(event, newValue) => {
                                // when selecting from dropdown
                                if (typeof newValue === "string") {
                                    setFormvalues({
                                        ...formvalues,
                                        reportingManager: { label: newValue, value: newValue },
                                    });
                                } else {
                                    setFormvalues({
                                        ...formvalues,
                                        reportingManager: newValue,
                                    });
                                }
                            }}
                            onInputChange={(event, newInputValue) => {
                                // when typing manually
                                setFormvalues({
                                    ...formvalues,
                                    reportingManager: {
                                        label: newInputValue,
                                        value: newInputValue,
                                    },
                                });
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label={
                                        <span>
                                            Reporting Manager <span style={{ color: "red" }}>*</span>
                                        </span>
                                    }
                                />
                            )}
                            sx={{ flex: 1 }}
                        />

                        <Autocomplete
                            fullWidth
                            options={[
                                { label: 'Admin', value: 'Admin' },
                                { label: 'HR Manager', value: 'HR Manager' },
                                { label: 'Timesheet Approver', value: 'Timesheet Approver' },
                                { label: 'Employee', value: 'Employee' }
                            ]}
                            getOptionLabel={(option) => option.label || ""}
                            value={formvalues.accessRole} // should be {label, value} object
                            onChange={(event, newValue) => setFormvalues({ ...formvalues, accessRole: newValue })}
                            renderInput={(params) => <TextField {...params} label={<span>Access Role <span style={{ color: 'red' }}>*</span></span>} />}
                            sx={{ flex: 1 }}
                        />
                        <Box sx={{ flex: 1 }}></Box>
                    </Box>
                </CardContent>

                {/* Buttons always at bottom */}
                <Box sx={{ display: "flex", justifyContent: "flex-end", p: 2 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleNext}
                    >
                        {isEditMode ? "Update" : "Save"}
                    </Button>
                </Box>
            </Card>
        </Box>
    );
}
