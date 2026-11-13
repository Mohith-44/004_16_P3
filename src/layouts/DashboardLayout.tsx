import React, { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  Bell,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FilePlus2,
  GitBranch,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  User as UserIcon,
  Wrench,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useNotifications } from '../context/NotificationContext.tsx';
import { formatRelativeTime, getInitials } from '../utils/formatters.ts';

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Submit Report', to: '/submit-report', icon: FilePlus2 },
  { label: 'All Reports', to: '/reports', icon: ClipboardList },
  { label: 'Track Report', to: '/track', icon: Search },
  {
    label: 'Handler Desk',
    to: '/handler-dashboard',
    icon: Wrench,
    roles: ['Handler', 'Admin', 'Routing Manager'],
  },
  {
    label: 'Routing Manager',
    to: '/routing',
    icon: GitBranch,
    roles: ['Admin', 'Routing Manager'],
  },
  { label: 'Analytics', to: '/analytics', icon: BarChart3 },
  { label: 'Notifications', to: '/notifications', icon: Bell },
  { label: 'Profile', to: '/profile', icon: UserIcon },
  { label: 'Settings', to: '/settings', icon: Settings },
];

function getPageTitle(pathname: string): string {
  if (pathname.startsWith('/submit-report')) return 'Report Submission';
  if (pathname.startsWith('/reports/')) return 'Report Details';
  if (pathname.startsWith('/reports')) return 'All Ward Reports';
  if (pathname.startsWith('/track')) return 'Track Report';
  if (pathname.startsWith('/handler-dashboard')) return 'Handler Dashboard';
  if (pathname.startsWith('/routing')) return 'Routing Management';
  if (pathname.startsWith('/analytics')) return 'Analytics & Trends';
  if (pathname.startsWith('/notifications')) return 'Notifications';
  if (pathname.startsWith('/profile')) return 'User Profile';
  if (pathname.startsWith('/settings')) return 'System Settings';
  return 'Clinical Dashboard';
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderNavLinks = (collapsed = false, onNavigate?: () => void) => (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      {visibleNavItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-[#0F2942] text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
            {!collapsed && item.to === '/notifications' && unreadCount > 0 && (
              <span className="ml-auto text-[11px] font-mono tabular-nums font-semibold px-1.5 py-0.5 rounded bg-red-600 text-white">
                {unreadCount}
              </span>
            )}
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-white border-r border-slate-200 sticky top-0 h-screen shrink-0 transition-all duration-200 ${
          sidebarCollapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        <div className="h-16 px-4 border-b border-slate-200 flex items-center justify-between gap-2">
          <Link to="/dashboard" className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#0F2942] text-white flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            {!sidebarCollapsed && (
              <span className="font-display font-bold text-sm text-slate-900 truncate">
                Ward Dispatcher
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setSidebarCollapsed((c) => !c)}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {renderNavLinks(sidebarCollapsed)}

        <div className="p-3 border-t border-slate-200">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-red-700 hover:bg-red-50 transition-colors whitespace-nowrap"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-64 max-w-[80vw] bg-white h-full flex flex-col border-r border-slate-200 z-10">
            <div className="h-16 px-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0F2942] text-white flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
                <span className="font-display font-bold text-sm text-slate-900">
                  Ward Dispatcher
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {renderNavLinks(false, () => setMobileMenuOpen(false))}
            <div className="p-3 border-t border-slate-200">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-700 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation Bar */}
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="hidden sm:inline">Hospital Ward Alert Dispatcher</span>
                <span className="hidden sm:inline" aria-hidden="true">
                  /
                </span>
                <span className="font-semibold text-slate-900 truncate">
                  {getPageTitle(location.pathname)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/submit-report"
              className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[#0F2942] rounded-lg hover:bg-[#163A5C] transition-colors whitespace-nowrap shrink-0"
            >
              <FilePlus2 className="w-3.5 h-3.5" />
              <span>Submit Report</span>
            </Link>

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotifDropdownOpen((o) => !o);
                  setUserDropdownOpen(false);
                }}
                className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                aria-label="Open notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-mono tabular-nums font-bold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-lg z-40 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900">Notifications</span>
                    <Link
                      to="/notifications"
                      onClick={() => setNotifDropdownOpen(false)}
                      className="text-xs font-medium text-[#0F2942] hover:underline"
                    >
                      View all
                    </Link>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.slice(0, 6).map((n) => (
                        <div
                          key={n._id}
                          onClick={() => {
                            if (!n.isRead) void markAsRead(n._id);
                            setNotifDropdownOpen(false);
                            if (n.reportRef) navigate(`/reports/${n.reportRef}`);
                            else if (n.reportId) navigate(`/track?id=${n.reportId}`);
                          }}
                          className={`px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors ${
                            !n.isRead ? 'bg-sky-50/40' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-900 truncate">
                              {n.title}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400 shrink-0">
                              {formatRelativeTime(n.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setUserDropdownOpen((o) => !o);
                  setNotifDropdownOpen(false);
                }}
                className="flex items-center gap-2.5 pl-2 pr-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <div className="w-7 h-7 rounded-md bg-[#0F2942] text-white text-xs font-semibold flex items-center justify-center shrink-0">
                  {getInitials(user?.name)}
                </div>
                <div className="hidden md:block text-left min-w-0">
                  <p className="text-xs font-semibold text-slate-900 truncate max-w-[130px]">
                    {user?.name || 'Clinical User'}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate max-w-[130px]">
                    {user?.role}
                  </p>
                </div>
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-40 py-1.5">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-900 truncate">{user?.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                    <div className="mt-1 flex items-center gap-1 text-[11px] text-[#0F2942] font-medium">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{user?.role}</span>
                    </div>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setUserDropdownOpen(false)}
                    className="block px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    User Profile
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setUserDropdownOpen(false)}
                    className="block px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    Preferences & Settings
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-xs text-red-700 hover:bg-red-50 border-t border-slate-100 mt-1"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
