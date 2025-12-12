import React, { useEffect, useState } from "react";
import { Card, CardContent, Typography, Box, Avatar, Divider } from "@mui/material";
import { File } from "lucide-react"
import { makeStyles } from "@material-ui/core/styles";
import { getCookie } from "../../services/Cookies";
import { getRequest } from "../../services/Apiservice";
import Breadcrumb from "../../services/BreadCrumb";

const useStyles = makeStyles((theme) => ({
    rootBox: {
        backgroundColor: "#fff",
        padding: 12,
        borderRadius: 8,
        boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
    },
}));
const ViewEmployee = ({ employee }) => {
    const classes = useStyles();
    const email = getCookie("email");
    const breadCrumb = [{ label: "View Profile" }]
    const [formvalues, setFormvalues] = useState({
        firstName: "",
        lastName: "",
        email: "",
        employeeType: "",
        department: "",
        designation: "",
        doj: null,
        city: "",
        country: "",
        workLocation: "",
        reportingManager: "",
        accessRole: "",
        employmentStatus: "",
        employeeId: "",
    });

    useEffect(() => {
        fetchEmployeeData(email);
    }, [email]);

    const sanitize = (obj) => {
        const ignoreKeys = ["resume", "aadharCard", "panCard", "offerLetter"];
        const cleaned = {};

        for (const key in obj) {
            const value = obj[key];

            // Skip cleaning for file-related keys
            if (ignoreKeys.includes(key)) {
                cleaned[key] = value;
                continue;
            }

            cleaned[key] =
                value === null || value === "" ? "-" : value;
        }

        return cleaned;
    };


    const formatDate = (val) => {
        if (!val || val === "-") return "-";
        try {
            const d = new Date(val);
            const day = String(d.getDate()).padStart(2, "0");
            const month = d.toLocaleString("en-GB", { month: "short" }); // Jan, Feb, ...
            const year = d.getFullYear();
            return `${day}-${month}-${year}`;
        } catch {
            return "-";
        }
    };


    const fetchEmployeeData = () => {
        getRequest(`User/GetUser/${email}`)
            .then((res) => {
                if (res.data && res.data.length > 0) {

                    const data = sanitize(res.data[0]);
                    setFormvalues({
                        ...data,
                        doj: formatDate(data.doj),
                    });
                }
            })
            .catch((err) => {
                console.error("Error fetching user:", err);
            });
    };

    const emp = employee || formvalues;

    return (
        <Box className={classes.rootBox} display="flex" flexDirection="column" gap={3}>
            <Breadcrumb items={breadCrumb} />
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>Personal Details</Typography>
                    <Divider sx={{ mb: 2 }} />

                    <Box display="flex" gap={2} flexWrap="wrap">
                        {/* Avatar */}
                        <Box display="flex" flexDirection="column" alignItems="center" flex={1}>
                            <Avatar
                                src={emp.profilePhoto || ""}
                                sx={{
                                    width: 100,
                                    height: 100,
                                    mb: 1,
                                    border: "2px solid #1976d2",
                                    bgcolor: !emp.profilePhoto ? "#e0e0e0" : "transparent",
                                    color: "#1976d2",
                                    fontWeight: 500,
                                }}
                            >
                                {!emp.profilePhoto && emp.firstName
                                    ? emp.firstName.charAt(0) + emp.lastName.charAt(0)
                                    : ""}
                            </Avatar>

                            <Typography variant="subtitle1" align="center" sx={{ mb: 1 }}>
                                {emp.firstName} {emp.middleName} {emp.lastName}
                            </Typography>
                            <Typography variant="body2" align="center" sx={{ color: "#555" }}>
                                {emp.jobTitle}
                            </Typography>
                        </Box>
                        <Box display="flex" flexDirection="column" gap={1} flex={1}>
                            <Typography sx={{ fontWeight: 500, color: "#1976d2" }}>First Name</Typography>
                            <Typography sx={{ fontWeight: 500, color: "#1976d2" }}>Last Name</Typography>
                            <Typography sx={{ fontWeight: 500, color: "#1976d2" }}>Employee ID</Typography>
                        </Box>
                        <Box display="flex" flexDirection="column" gap={1} flex={1}>
                            <Typography sx={{ color: "#555" }}>{emp.firstName}</Typography>
                            <Typography sx={{ color: "#555" }}>{emp.lastName}</Typography>
                            <Typography sx={{ color: "#555" }}>{emp.employeeId}</Typography>
                        </Box>
                        <Box display="flex" flexDirection="column" gap={1} flex={1}>
                            <Typography sx={{ fontWeight: 500, color: "#1976d2" }}>Email Address</Typography>
                            <Typography sx={{ fontWeight: 500, color: "#1976d2" }}>Access Role</Typography>
                        </Box>
                        <Box display="flex" flexDirection="column" gap={1} flex={1}>
                            <Typography sx={{ color: "#555" }}>{emp.email}</Typography>
                            <Typography sx={{ color: "#555" }}>{emp.accessRole}</Typography>
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>Employment Details</Typography>
                    <Divider sx={{ mb: 2 }} />

                    <Box display="flex" gap={2} flexWrap="wrap">

                        <Box display="flex" flexDirection="column" gap={1} flex={1}>
                            <Typography sx={{ fontWeight: 500, color: "#1976d2" }}>Employee Type</Typography>
                            <Typography sx={{ fontWeight: 500, color: "#1976d2" }}>Designation</Typography>
                            <Typography sx={{ fontWeight: 500, color: "#1976d2" }}>Department</Typography>
                        </Box>
                        <Box display="flex" flexDirection="column" gap={1} flex={1}>
                            <Typography sx={{ color: "#555" }}>{emp.employeeType}</Typography>
                            <Typography sx={{ color: "#555" }}>{emp.designation}</Typography>
                            <Typography sx={{ color: "#555" }}>{emp.department}</Typography>
                        </Box>
                        <Box display="flex" flexDirection="column" gap={1} flex={1}>
                            <Typography sx={{ fontWeight: 500, color: "#1976d2" }}>Country</Typography>
                            <Typography sx={{ fontWeight: 500, color: "#1976d2" }}>City</Typography>
                            <Typography sx={{ fontWeight: 500, color: "#1976d2" }}>Work Location</Typography>
                        </Box>
                        <Box display="flex" flexDirection="column" gap={1} flex={1}>
                            <Typography sx={{ color: "#555" }}>{emp.country}</Typography>
                            <Typography sx={{ color: "#555" }}>{emp.city}</Typography>
                            <Typography sx={{ color: "#555" }}>{emp.workLocation}</Typography>
                        </Box>
                        <Box display="flex" flexDirection="column" gap={1} flex={1}>
                            <Typography sx={{ fontWeight: 500, color: "#1976d2" }}>Date of Joining</Typography>
                            <Typography sx={{ fontWeight: 500, color: "#1976d2" }}>Employement Status</Typography>
                            <Typography sx={{ fontWeight: 500, color: "#1976d2" }}>Reporting Manager</Typography>
                        </Box>
                        <Box display="flex" flexDirection="column" gap={1} flex={1}>
                            <Typography sx={{ color: "#555" }}>{emp.doj}</Typography>
                            <Typography sx={{ color: "#555" }}>{emp.employmentStatus}</Typography>
                            <Typography sx={{ color: "#555" }}>{emp.reportingManager}</Typography>
                        </Box>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default ViewEmployee;
