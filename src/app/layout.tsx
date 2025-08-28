'use client';

import './globals.css';
import { ReactNode, useEffect, useState } from 'react';
import SidebarWrapper from '@/components/SidebarWrapper';
// import Header from '@/components/Header';
import Header from '../components/Navbar';

export default function RootLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  // Load sidebar state from localStorage on first mount
  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed');
    if (stored === 'true') setCollapsed(true);

    // Listener for global toggle event
    const handleToggle = () => {
      const updated = localStorage.getItem('sidebar-collapsed') === 'true';
      setCollapsed(updated);
    };

    window.addEventListener('toggle-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-sidebar', handleToggle);
  }, []);

  const toggleSidebar = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    localStorage.setItem('sidebar-collapsed', newCollapsed.toString());
    window.dispatchEvent(new Event('toggle-sidebar'));
  };

  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-green-50/50 via-white to-emerald-50/50 dark:from-gray-900 dark:via-black dark:to-gray-900"
      suppressHydrationWarning={true}
      >
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <SidebarWrapper collapsed={collapsed} setCollapsed={setCollapsed} />

          {/* Main content area */}
          <div className={`flex-1 flex flex-col transition-all duration-400 ease-[cubic-bezier(0.7,-0.15,0.25,1.15)] ${
            collapsed ? 'ml-[58px]' : 'ml-[190px]'
          }`}>
            {/* Header */}
            <Header onToggle={toggleSidebar} collapsed={collapsed} />
            
            {/* Main content */}
            <main className="flex-1 p-6 overflow-auto">
              <div className="max-w-7xl mx-auto">
                {children}
              </div>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}