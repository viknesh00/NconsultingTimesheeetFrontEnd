import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Users,
  LogOut,
  CircleChevronRight,
  CircleChevronLeft,
  Building,
  ClipboardList,
  ListTodo,
  Calendar
} from "lucide-react";
import { cookieKeys, getCookie } from "../../services/Cookies";
import { cookieObj } from "../../models/cookieObj";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const userRole = getCookie("role") || "Employee";

  const organizationMenu = [
    { to: "/employees", label: "Employees", icon: <Users size={20} />, roles: ["Admin"] },
    { to: "/timesheet", label: "Timesheet", icon: <ClipboardList size={20} />, roles: ["Admin", "Employee"] },
    { to: "/timesheet", label: "Timesheet HR Inbox", icon: <ClipboardList size={20} />, roles: ["HR Manager"] },
    { to: "/timesheet", label: "Timesheet Approver Inbox", icon: <ClipboardList size={20} />, roles: ["Timesheet Approver"] },
    { to: "/manage-projects", label: "Manage Projects", icon: <Building size={20} />, roles: ["Admin", "HR Manager"] },
    { to: "/managingtask", label: "Managing Task", icon: <ListTodo  size={20} />, roles: ["Admin", "HR Manager"] },
    { to: "/Calendar", label: "Calendar", icon: <Calendar size={20} />, roles: ["Admin", "HR Manager","Timesheet Approver", "Employee"] },
  ];

  const filteredOrganizationMenu = organizationMenu.filter(item => item.roles.includes(userRole));

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
        {collapsed ? <CircleChevronRight size={20} /> : <CircleChevronLeft size={20} />}
      </button>

      <div className="menu-scroll">
        <MenuSection items={filteredOrganizationMenu} collapsed={collapsed} />
      </div>

      <div className="logout-section" onClick={() => { cookieKeys(cookieObj, 0); }}>
        <MenuItem to="/login" icon={<LogOut size={20} />} label="Logout" collapsed={collapsed} />
      </div>

      <div className="footer">
        {!collapsed && (
          <span
            className="footer-text"
            onClick={(e) => {
              e.stopPropagation();
              window.open("http://www.natobotics.com", "_blank");
            }}
          >
            Powered by <span className="footer-companyname">NATOBOTICS</span>
          </span>
        )}
        <img src="/assets/images/natobotics-logo.png" alt="Logo" className="footer-logo" />
      </div>
    </aside>
  );
};

const MenuSection = ({ title, items, collapsed }) => (
  <div className="menu-section">
    {!collapsed && title && <h3 className="menu-title">{title}</h3>}
    <ul>
      {items.map((item) => (
        <MenuItem key={item.to} {...item} collapsed={collapsed} />
      ))}
    </ul>
  </div>
);

const MenuItem = ({ to, icon, label, collapsed }) => (
  <li>
    <NavLink
      to={to}
      className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}
      title={collapsed ? label : ""}
    >
      <div className="icon">{icon}</div>
      {!collapsed && <span>{label}</span>}
    </NavLink>
  </li>
);

export default Sidebar;
