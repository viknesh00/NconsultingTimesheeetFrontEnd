import React, { useState, useRef, useEffect } from "react";
import { Button, Menu, MenuItem, ListItemIcon, Box, Typography, Divider } from "@mui/material";
import { User, Key, LogOut } from "lucide-react";
import { makeStyles } from "@material-ui/core/styles";
import PasswordChange from "../../services/PasswordChange";
import { useNavigate } from "react-router-dom";
import { postRequest } from "../../services/Apiservice";
import LoadingMask from "../../services/LoadingMask";
import { Avatar } from "@mui/material";
import { cookieKeys, getCookie } from "../../services/Cookies";
import { cookieObj } from "../../models/cookieObj";

const useStyles = makeStyles({
  button: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "2px",
    width: "100%",
    padding: "6px 10px",
  },
  dateText: {
    fontSize: "12px",
    fontWeight: "bold",
  },
  timerText: {
    fontSize: "14px",
    fontWeight: "bold",
  },
});

const Header = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(getCookie("isDefaultPasswordChanged") === "false");
  const [isManualChange, setIsManualChange] = useState(false); // true when user clicks menu

  // Get user details from cookies
  const firstName = getCookie("firstName") || "";
  const lastName = getCookie("lastName") || "";
  const employeeId = getCookie("employeeId") || "";
  const employeeRole = getCookie("role") || "";
  // Account menu handlers
  const handleAccountClick = (event) => setAnchorEl(event.currentTarget);
  const handleAccountClose = () => setAnchorEl(null);

  // When user clicks "Change Password" in menu
  const handleManualPasswordChange = () => {
    setIsManualChange(true);
    setShowPassword(true);
    handleAccountClose();
  };

  const handleLogout = () => {
    cookieKeys(cookieObj, 0);
    navigate("/login");
  };

  return (
    <header className="header">
      <LoadingMask loading={loading} />
      {/* PasswordChange modal */}
      {showPassword && (
        <PasswordChange
          isManualChange={isManualChange}
          onSuccess={() => {
            setShowPassword(false);
            setIsManualChange(false);
          }}
          onClose={() => {
            setShowPassword(false);
            setIsManualChange(false);
          }}
        />
      )}

      <div className="header-left">
        <img src="/assets/images/natobotics-logo.png" alt="Logo" className="header-logo" />
        <div className="header-text">
          N Consulting
        </div>
      </div>

      <div className="header-right">
        <Box sx={{ textAlign: "right" }}>
          <Typography sx={{ fontSize: "0.9rem", color: "#111" }}>
            {firstName} {lastName}
          </Typography>
          <Typography sx={{ fontWeight: "500", fontSize: "0.9rem", color: "#555" }}>
            {employeeRole}
          </Typography>
        </Box>

        {/* Account icon replaced with Avatar */}
        <div onClick={handleAccountClick} style={{ cursor: "pointer", marginLeft: 10 }}>
          <Avatar
            sx={{
              background: "linear-gradient(135deg, #1565c0 0%, #f55742 50%, #f9d890 100%)",
              width: 40,
              height: 40,
              fontSize: "1rem",
              color: "#fff" // optional: ensures text is visible
            }}
          >
            {firstName.charAt(0).toUpperCase()}
          </Avatar>
        </div>


        {/* Account Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleAccountClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="subtitle1" color="textSecondary">
              Hi,
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              {firstName} {lastName}
            </Typography>
            <Typography variant="body3" color="textSecondary">
              {employeeId}
            </Typography>
          </Box>
          <Divider />
          <MenuItem onClick={() => { handleAccountClose(); navigate("/view-employee") }}>
            <ListItemIcon>
              <User size={18} />
            </ListItemIcon>
            View Profile
          </MenuItem>
          <MenuItem onClick={handleManualPasswordChange}>
            <ListItemIcon>
              <Key size={18} />
            </ListItemIcon>
            Change Password
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogOut size={18} />
            </ListItemIcon>
            Logout
          </MenuItem>
        </Menu>
      </div>
    </header>
  );
};

export default Header;
