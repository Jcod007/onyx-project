import React from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

import { ThemeToggle } from './theme-toggle';
import { Button } from './ui/button';

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="layout">
      <Sidebar currentPath={location.pathname} />
      <div className="main-content">
        <Header />
        <div className="content-area">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;