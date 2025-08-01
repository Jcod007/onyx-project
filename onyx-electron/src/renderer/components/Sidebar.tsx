import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Timer, 
  BookOpen, 
  BarChart3, 
  Settings, 
  Diamond 
} from 'lucide-react';

interface SidebarProps {
  currentPath: string;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPath }) => {
  const menuItems = [
    {
      path: '/timers',
      icon: Timer,
      label: 'Timers',
      description: 'Manage your study timers'
    },
    {
      path: '/subjects',
      icon: BookOpen,
      label: 'Subjects',
      description: 'Study subjects and goals'
    },
    {
      path: '/stats',
      icon: BarChart3,
      label: 'Statistics',
      description: 'Progress and analytics'
    },
    {
      path: '/settings',
      icon: Settings,
      label: 'Settings',
      description: 'App preferences'
    }
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="app-logo">
          <Diamond className="logo-icon" />
          <span className="app-name">ONYX</span>
        </div>
        <p className="app-subtitle">Study Timer</p>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
              title={item.description}
            >
              <Icon className="nav-icon" size={20} />
              <div className="nav-content">
                <span className="nav-label">{item.label}</span>
                <span className="nav-description">{item.description}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="version-info">
          <span className="version-label">Version 1.0.0</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;