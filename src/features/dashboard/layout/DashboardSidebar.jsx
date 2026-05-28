import React, { useContext, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FiHome,
  FiFile,
  FiSettings,
  FiBarChart2,
  FiRefreshCw,
  FiBook,
  FiUsers,
  FiMenu,
  FiX,
  FiChevronDown
} from 'react-icons/fi';
import DashboardContext from '../context/DashboardContext';
import { dashboardMenuConfig } from '../config/dashboardMenuConfig';
import './DashboardSidebar.css';

const DashboardSidebar = () => {
  const { dashboardType, sidebarOpen, setSidebarOpen } = useContext(DashboardContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState(new Set());

  const menuItems = dashboardMenuConfig[dashboardType] || [];

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleMenu = (menuId) => {
    const newExpanded = new Set(expandedMenus);
    if (newExpanded.has(menuId)) {
      newExpanded.delete(menuId);
    } else {
      newExpanded.add(menuId);
    }
    setExpandedMenus(newExpanded);
  };

  const handleNavigation = (path) => {
    React.startTransition(() => {
      navigate(path);
    });
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const renderMenuItem = (item, index) => {
    const isExpanded = expandedMenus.has(item.id);
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const active = isActive(item.path);

    return (
      <div key={index} className="menu-item">
        <div
          className={`menu-link ${active ? 'active' : ''}`}
          onClick={() => {
            if (hasSubItems) {
              toggleMenu(item.id);
            } else {
              handleNavigation(item.path);
            }
          }}
        >
          <div className="menu-content">
            <item.icon className="menu-icon" />
            <span className="menu-label">{item.label}</span>
          </div>
          {hasSubItems && (
            <FiChevronDown
              className={`menu-chevron ${isExpanded ? 'expanded' : ''}`}
            />
          )}
        </div>

        {hasSubItems && isExpanded && (
          <div className="submenu">
            {item.subItems.map((subItem, subIndex) => (
              <div
                key={subIndex}
                className={`submenu-item ${isActive(subItem.path) ? 'active' : ''}`}
                onClick={() => handleNavigation(subItem.path)}
              >
                <subItem.icon className="submenu-icon" />
                <span className="submenu-label">{subItem.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button
        className="sidebar-toggle mobile"
        onClick={toggleSidebar}
      >
        {sidebarOpen ? <FiX /> : <FiMenu />}
      </button>

      {/* Sidebar */}
      <div className={`dashboard-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        {/* Desktop Menu Toggle */}
        <button
          className="sidebar-toggle desktop"
          onClick={toggleSidebar}
        >
          {sidebarOpen ? <FiX /> : <FiMenu />}
        </button>

        {/* Sidebar Header */}
        <div className="sidebar-header">
          <h2>IMPACT</h2>
          <p className="dashboard-type">
            {dashboardType.charAt(0).toUpperCase() + dashboardType.slice(1)} Dashboard
          </p>
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          {menuItems.map(renderMenuItem)}
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              <FiUsers />
            </div>
            <div className="user-details">
              <div className="user-name">Admin User</div>
              <div className="user-role">{dashboardType}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardSidebar;
