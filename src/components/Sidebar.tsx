'use client';

import {
  LayoutDashboard,
  Users,
  FolderOpen,
  Scissors,
  Tag,
  Calendar,
  User,
  Building2,
  MessageCircle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Pacifico } from 'next/font/google';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useState, useEffect } from 'react';

const pacifico = Pacifico({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-pacifico',
});

// ✅ Nav items
const navItems: {
  icon: any;
  label: string;
  href: string;
  roles: string[];
  subItems?: { label: string; href: string }[];
}[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/", roles: ["admin", "user"] },
  { icon: FolderOpen, label: "Categories", href: "/catagories", roles: ["admin", "user"], subItems: [] },
  { icon: Scissors, label: "Services", href: "/services", roles: ["admin", "user"], subItems: [] },
  { icon: Tag, label: "Offers", href: "/offers", roles: ["admin", "user"], subItems: [] },
  { icon: Calendar, label: "Bookings", href: "/bookings", roles: ["admin"], subItems: [] },
  { icon: MessageCircle, label: "Chat", href: "/chat", roles: ["admin"], subItems: [] },
  { icon: Building2, label: "Branches", href: "/branches", roles: ["admin", "user"], subItems: [] },
  { icon: Users, label: "Users", href: "/users", roles: ["admin"], subItems: [] },
  { icon: User, label: "Profile", href: "/profile", roles: ["admin", "user"], subItems: [] },
];

interface SidebarProps {
  collapsed: boolean;
}

export default function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [darkMode, setDarkMode] = useState(false);

  // ✅ Sync theme from localStorage
  useEffect(() => {
    const isDark = localStorage.getItem("theme") === "dark";
    setDarkMode(isDark);
    const observer = new MutationObserver(() => {
      setDarkMode(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const isMenuItemActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/' || pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const toggleSubmenu = (href: string) => {
    setOpenMenus((prev) =>
      prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href]
    );
  };

  return (
    <motion.div
      initial={false}
      animate={{
        width: collapsed ? '54px' : '176px',
      }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 30,
        mass: 0.5,
      }}
      className={cn(
        'fixed left-0 top-0 z-50 flex flex-col h-screen overflow-hidden rounded-r-3xl',
        darkMode
          ? 'bg-black border border-white/30 shadow-lg shadow-white/10'
          : 'bg-gradient-to-br from-white/95 via-pink-50/90 to-white/95 backdrop-blur-xl border border-pink-200/40 shadow-2xl shadow-pink-500/10'
      )}
    >
      {/* Content Container */}
      <div className="relative z-10 flex flex-col h-full px-2 py-6 items-center">
        {/* Logo */}
        <motion.div
          className={cn(
            "flex-shrink-0 flex items-center justify-center py-4 mb-4 mx-auto rounded-2xl px-3 shadow-lg transition-all duration-300",
            darkMode
              ? "bg-black border border-white/30 shadow-white/10"
              : "bg-gradient-to-br from-pink-100/50 to-pink-200/30 border border-pink-200/50 shadow-pink-500/20"
          )}
          layout
          transition={{ duration: 0.15 }}
        >
          <span
            className={cn(
              collapsed ? 'text-base' : 'text-lg',
              pacifico.className,
              darkMode
                ? "text-white"
                : "bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-pink-500"
            )}
          >
            {collapsed ? 'L' : 'Mirror Salon'}
          </span>
        </motion.div>

        {/* Navigation */}
        <div className="overflow-y-auto pr-1 flex-1 space-y-1 w-full">
          <nav className="flex flex-col space-y-1.5">
            {navItems.map(({ icon: Icon, label, href, subItems = [] }, index) => {
              const isActive = isMenuItemActive(href);
              const isOpen = openMenus.includes(href);

              return (
                <div key={index}>
                  <motion.div whileTap={{ scale: 0.97 }} transition={{ duration: 0.1 }}>
                    <motion.div
                      layout
                      transition={{ duration: 0.15 }}
                      onClick={() =>
                        subItems.length ? toggleSubmenu(href) : router.push(href)
                      }
                      suppressHydrationWarning
                      className={cn(
                        'flex items-center px-2.5 py-1.5 rounded-2xl cursor-pointer transition-all duration-300',
                        collapsed && 'justify-center',
                        isActive
                          ? darkMode
                            ? 'bg-white/10 text-white border border-white/30 shadow-white/10'
                            : 'bg-gradient-to-r from-pink-500/25 to-pink-400/20 text-pink-700 shadow-lg shadow-pink-500/25 border border-pink-300/40'
                          : darkMode
                            ? 'text-gray-300 hover:text-white hover:bg-white/5'
                            : 'hover:bg-gradient-to-r hover:from-pink-500/15 hover:to-pink-400/10 text-gray-600 hover:text-pink-600 hover:shadow-md hover:shadow-pink-500/15 hover:border-pink-200/30'
                      )}
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center justify-center">
                            <Icon
                              className={cn(
                                'w-3.5 h-3.5',
                                isActive
                                  ? darkMode ? 'text-white' : 'text-pink-700'
                                  : darkMode ? 'text-gray-300' : 'text-gray-600'
                              )}
                            />
                          </div>
                        </TooltipTrigger>
                        {collapsed && (
                          <TooltipContent
                            side="right"
                            className={cn(
                              "shadow-lg",
                              darkMode
                                ? "bg-black border border-white/30 text-white"
                                : "bg-white border border-pink-200/40"
                            )}
                          >
                            <span>{label}</span>
                          </TooltipContent>
                        )}
                      </Tooltip>

                      {!collapsed && (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center justify-between w-full ml-3"
                        >
                          <span
                            className={cn(
                              'text-[10px] font-medium',
                              isActive
                                ? darkMode ? "text-white" : "text-pink-700"
                                : darkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-pink-600"
                            )}
                          >
                            {label}
                          </span>

                          {subItems.length > 0 && (
                            <span>
                              {isOpen ? (
                                <ChevronDown size={14} className={darkMode ? "text-white" : "text-gray-600"} />
                              ) : (
                                <ChevronRight size={14} className={darkMode ? "text-white" : "text-gray-600"} />
                              )}
                            </span>
                          )}
                        </motion.div>
                      )}
                    </motion.div>
                  </motion.div>

                  {/* Submenu */}
                  <AnimatePresence>
                    {!collapsed && subItems.length > 0 && isOpen && (
                      <motion.ul
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="ml-8 mt-1 space-y-1 overflow-hidden"
                      >
                        {subItems.map((sub, i) => (
                          <li
                            key={i}
                            onClick={() => router.push(sub.href)}
                            className={cn(
                              'px-2 py-1 text-[10px] rounded-md cursor-pointer',
                              pathname === sub.href
                                ? darkMode
                                  ? 'bg-white/10 text-white'
                                  : 'bg-pink-500/20 text-pink-700'
                                : darkMode
                                  ? 'text-gray-300 hover:text-white hover:bg-white/5'
                                  : 'hover:bg-pink-500/10 text-gray-600 hover:text-pink-600'
                            )}
                          >
                            {sub.label}
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Decorative Element */}
        <motion.div layout className="mt-4 flex justify-center">
          <div
            className={cn(
              "w-12 h-0.5 rounded-full",
              darkMode
                ? "bg-white/30 shadow-sm shadow-white/10"
                : "bg-pink-300/40 shadow-sm shadow-pink-500/20"
            )}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
