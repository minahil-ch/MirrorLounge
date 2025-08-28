'use client';
import { useEffect } from 'react';
import Sidebar from '@/components/Sidebar';

export default function SidebarWrapper({
  collapsed,
  setCollapsed,
}: {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
}) {
  useEffect(() => {
    const handler = () => {
      const val = localStorage.getItem('sidebar-collapsed') === 'true';
      setCollapsed(val);
    };
    window.addEventListener('toggle-sidebar', handler);
    return () => window.removeEventListener('toggle-sidebar', handler);
  }, []);

return <Sidebar collapsed={collapsed} />;

}