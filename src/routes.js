import React from "react";
import { Navigate } from "react-router-dom";
import ProtectedRoute from "./services/ProtectedRoute";
import Dashboard from "./pages/Dashboard/Dashboard";
import Layout from "./pages/Layout/Layout";
import Login from "./pages/Login/Login";
import Employees from "./pages/Employee/Employee";
import AddEmployee from "./pages/Employee/AddEmployee";
import ViewEmployee from "./pages/Employee/ViewEmployee";
import TimeSheetLayout from "./pages/TimeSheet/TimeSheetLayout";
import TimesheetCalendar from "./pages/TimeSheet/TimesheetCalendar";
import ManagingTask from "./pages/ManagingTask/ManagingTask";
import CreateTask from "./pages/ManagingTask/CreateTask";
import RoleBasedRedirect from "./services/RoleBasedRedirect";
import Holiday from "./pages/Holiday/Holiday";
import CreateHoliday from "./pages/Holiday/CreateHoliday";
import Project from "./pages/Project/Project";
import ProjectForm from "./pages/Project/ProjectForm";

const routes = [
    // Public Route
    { path: "/", element: <Login /> },
    { path: "/login", element: <Login /> },
    { path: "/sign-in", element: <Login /> },

    // Protected Routes
    {
        path: "/*", // Wildcard path for nested layout routes
        element: (
            <ProtectedRoute>
                <Layout />
            </ProtectedRoute>
        ),
        children: [
            { path: "dashboard", element: <Dashboard /> },
            { path: "employees", element: <Employees /> },
            { path: "employees/add-employee", element: <AddEmployee /> },
            { path: "employees/edit-employee/:email", element: <AddEmployee />},
            { path: "view-employee", element: <ViewEmployee /> },
            { path: "manage-projects", element: <Project /> },
            { path: "manage-projects/create-project", element: <ProjectForm /> },
            { path: "manage-projects/edit-project", element: <ProjectForm /> },
            { path: "timesheet", element: <TimeSheetLayout /> },
            { path: "timesheet/timesheet-view", element: <TimesheetCalendar/>},
            { path: "managingtask", element: <ManagingTask/>},
            { path: "managingtask/create", element: <CreateTask/>},
            { path: "managingtask/edit", element: <CreateTask/>},
            { path: "calendar", element: <Holiday/>},
            { path: "calendar/create-event", element: <CreateHoliday/>},
            { path: "calendar/edit-event", element: <CreateHoliday/>},
            { path: "*", element: <RoleBasedRedirect /> },
        ],
    },

    { path: "*", element: <Navigate to="/" /> },
];

export default routes;