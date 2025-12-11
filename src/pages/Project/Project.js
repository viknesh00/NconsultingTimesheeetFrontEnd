import React, { useEffect, useState } from "react";
import MUIDataTable from "mui-datatables";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { makeStyles } from "@mui/styles";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import { Pencil, Plus } from "lucide-react";
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, RadioGroup, FormControlLabel, Radio } from "@mui/material";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import { getRequest, postRequest } from "../../services/Apiservice";
import LoadingMask from "../../services/LoadingMask";
import Breadcrumb from "../../services/BreadCrumb";
import { ToastError, ToastSuccess } from "../../services/ToastMsg";

const getMuiTheme = () =>
    createTheme({
        components: {
            MUIDataTableHeadCell: { styleOverrides: { data: { textTransform: "none !important" }, root: { textTransform: "none !important" } } },
            MUIDataTableViewCol: { styleOverrides: { root: { padding: "8px 12px !important" }, label: { textTransform: "none !important" } } },
        },
    });

const useStyles = makeStyles({
    rootBox: { backgroundColor: "#fff", padding: 12, borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.12)" },
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
    addButtonContainer: { display: "flex", justifyContent: "flex-end", marginBottom: "10px" },
    addButton: { backgroundColor: "#0c4a6e", gap: "8px", textTransform: "none" },
});

export default function Project() {
    const classes = useStyles();
    const navigate = useNavigate();
    const breadCrumb = [{ label: "Projects" }];
    const [loading, setLoading] = useState(false);
    const [projectList, setProjectList] = useState([]);
    const [openStatusDialog, setOpenStatusDialog] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState(true);
    const [selectedProjectId, setSelectedProjectId] = useState(null);

    useEffect(() => {
        getProjects();
    }, []);

    const getProjects = () => {
        setLoading(true);
        const url = "Project/GetAllProjects";
        getRequest(url)
            .then((res) => {
                if (res.data) {
                    const formatted = res.data.map((p) => ({
                        ...p,
                        startDate: p.startDate ? moment(p.startDate).format("DD-MMM-YYYY") : "",
                        endDate: p.endDate ? moment(p.endDate).format("DD-MMM-YYYY") : "",
                    }));
                    setProjectList(formatted);
                }
                setLoading(false);
            })
            .catch((err) => {
                setLoading(false);
                console.error(err);
            });
    };

    const handleEdit = (rowData) => {
        navigate("/manage-projects/edit-project", { state: { editData: rowData } });
    };

    const handleCreateForm = () => navigate("/manage-projects/create-project");

    const handleStatusClick = (rowIndex) => {
        const project = projectList[rowIndex];
        setSelectedProjectId(project.projectId);
        setSelectedStatus(project.isActive);
        setOpenStatusDialog(true);
    };

    const handleSaveStatus = () => {
        const data = { projectId: selectedProjectId, isActive: selectedStatus };
        setLoading(true);
        const url = "Project/UpdateProjectStatus";
        postRequest(url, data)
            .then((res) => {
                setLoading(false);
                setOpenStatusDialog(false);
                ToastSuccess(res.data.message);  // show success message
                getProjects();                   // refresh project table
            })
            .catch((err) => {
                setLoading(false);
                ToastError("Failed to update status");
                console.error(err);
            });
    };


    const StatusChip = ({ label }) => {
        const colors = {
            active: { bg: "#DFF5D8", color: "#0F7B0F" },
            inactive: { bg: "#FDE0E0", color: "#C62828" },
        };
        const { bg, color } = colors[label.toLowerCase()] || { bg: "#E9E9E9", color: "#7D7D7D" };
        return (
            <div style={{ backgroundColor: bg, color, padding: "3px 10px", fontWeight: 500, fontSize: 12, borderRadius: 16, display: "inline-flex", alignItems: "center", justifyContent: "center", textTransform: "capitalize", cursor: "pointer" }}>
                {label}
            </div>
        );
    };

    const columns = [
        { name: "projectName", label: "Project Name" },
        { name: "poNumber", label: "PO Number" },
        { name: "startDate", label: "Start Date" },
        { name: "endDate", label: "End Date" },
        {
            name: "isActive",
            label: "Status",
            options: {
                customBodyRenderLite: (dataIndex) => {
                    const value = projectList[dataIndex]?.isActive;
                    return <span onClick={() => handleStatusClick(dataIndex)}><StatusChip label={value ? "active" : "inactive"} /></span>;
                },
            },
        },
        {
            name: "actions",
            label: "Actions",
            options: {
                filter: false,
                sort: false,
                empty: true,
                customBodyRender: (value, tableMeta) => {
                    const rowData = projectList[tableMeta.rowIndex];
                    return (
                        <IconButton onClick={() => handleEdit(rowData)}>
                            <Pencil size={20} />
                        </IconButton>
                    );
                },
            },
        },
    ];

    const options = {
    customToolbarSelect: () => { },
    selectableRows: "none",
    responsive: "standard",
    filterType: 'multiselect',
    download: true,
    print: true,
    search: true,
    filter: true,
    viewColumns: true,
    rowsPerPage: 10,
    rowsPerPageOptions: [10, 15, 50, 100],
  };

    return (
        <Box className={classes.rootBox}>
            <LoadingMask loading={loading} />
            <Breadcrumb items={breadCrumb} />
            <Box className={classes.addButtonContainer}>
                <Button variant="contained" onClick={handleCreateForm} className={classes.addButton}>
                    <Plus size={20} /> Create Project
                </Button>
            </Box>
            <Box className="reportstablehead">
                <ThemeProvider theme={getMuiTheme()}>
                    <MUIDataTable title="Project List" className={classes.tableBody} data={projectList} columns={columns} options={options} />
                </ThemeProvider>
            </Box>

            {/* Status Dialog */}
            <Dialog
                open={openStatusDialog}
                onClose={() => setOpenStatusDialog(false)}
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
                <DialogTitle>Change Project Status</DialogTitle>
                <DialogContent dividers>
                    <Box mb={2}>
                        <strong>Status:</strong>
                    </Box>

                    <RadioGroup
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value === "true")}
                    >
                        <Box display="flex" alignItems="center" gap={2}>
                            <FormControlLabel value={true} control={<Radio />} label="Active" />
                            <FormControlLabel value={false} control={<Radio />} label="Inactive" />
                        </Box>

                    </RadioGroup>
                </DialogContent>
                <DialogActions>
                    <Button variant="outlined" onClick={() => setOpenStatusDialog(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSaveStatus}>Save</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
