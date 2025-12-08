import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Box, TextField, Button, Typography } from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format, parse } from "date-fns";
import { makeStyles } from "@mui/styles";
import { postRequest } from "../../services/Apiservice";
import { ToastError, ToastSuccess } from "../../services/ToastMsg";
import LoadingMask from "../../services/LoadingMask";
import Breadcrumb from "../../services/BreadCrumb";

const useStyles = makeStyles({
  rootBox: {
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 12,
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  },
  container: {
    maxWidth: 500,
    margin: "50px auto",
    padding: 24,
    display: "flex",
    flexDirection: "column",
    gap: 24,
  },
  title: {
    textAlign: "center",
    fontWeight: 600,
    fontSize: 22,
    marginBottom: 16,
  },
  buttonsContainer: {
    display: "flex",
    justifyContent: "center",
    gap: 16,
    marginTop: 24,
  },
});

const ProjectForm = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const location = useLocation();
  const editData = location.state?.editData || null;

  const breadCrumb = [
    { label: "Projects", link: "/manage-projects" },
    { label: editData ? "Edit Project" : "Create Project" },
  ];

  const [loading, setLoading] = useState(false);
  const [formValues, setFormValues] = useState({
    projectId: editData?.projectId ?? null,
    projectName: editData?.projectName || "",
    poNumber: editData?.poNumber || "",
    startDate: editData?.startDate
      ? parse(editData.startDate, "dd-MMM-yyyy", new Date())
      : null,
    endDate: editData?.endDate
      ? parse(editData.endDate, "dd-MMM-yyyy", new Date())
      : null,
  });

  const handleSave = async () => {
    if (!formValues.projectName || !formValues.poNumber) {
      ToastError("Please fill all mandatory fields");
      return;
    }

    const saveData = {
      projectId: formValues.projectId,
      projectName: formValues.projectName,
      poNumber: formValues.poNumber,
      startDate: formValues.startDate
        ? format(formValues.startDate, "yyyy-MM-dd")
        : null,
      endDate: formValues.endDate
        ? format(formValues.endDate, "yyyy-MM-dd")
        : null,
      isActive: true, // default active when creating/updating
    };

    setLoading(true);
    postRequest("Project/InsertOrUpdateProject", saveData)
      .then((res) => {
        setLoading(false);
        if (res.status === 200) {
          ToastSuccess(res.data.message);
          navigate("/manage-projects");
        }
      })
      .catch((err) => {
        setLoading(false);
        console.error(err);
      });
  };

  const handleCancel = () => navigate("/manage-projects");

  return (
    <Box className={classes.rootBox}>
      <LoadingMask loading={loading} />
      <Breadcrumb items={breadCrumb} />
      <Box className={classes.container}>
        <Typography variant="h6" className={classes.title}>
          {editData ? "Edit Project" : "Create Project"}
        </Typography>

        <TextField
          label="Project Name"
          fullWidth
          value={formValues.projectName}
          onChange={(e) =>
            setFormValues({ ...formValues, projectName: e.target.value })
          }
        />

        <TextField
          label="PO Number"
          fullWidth
          value={formValues.poNumber}
          onChange={(e) =>
            setFormValues({ ...formValues, poNumber: e.target.value })
          }
        />

        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="Start Date"
            value={formValues.startDate}
            format="dd/MM/yyyy"
            onChange={(newValue) =>
              setFormValues({ ...formValues, startDate: newValue })
            }
            renderInput={(params) => <TextField fullWidth {...params} />}
          />

          <DatePicker
            label="End Date"
            value={formValues.endDate}
            format="dd/MM/yyyy"
            onChange={(newValue) =>
              setFormValues({ ...formValues, endDate: newValue })
            }
            renderInput={(params) => <TextField fullWidth {...params} />}
          />
        </LocalizationProvider>

        <Box className={classes.buttonsContainer}>
          <Button variant="contained" onClick={handleSave}>
            {editData ? "Update" : "Save"}
          </Button>
          <Button variant="outlined" onClick={handleCancel}>
            Cancel
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default ProjectForm;
