import { useEffect, useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { 
  Home, 
  AlertTriangle, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Bell,
  User,
  Search,
  Plus,
  TrendingUp,
  Activity,
  FileText
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationsContext';
import { issuesAPI } from '../../services/api';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { notifications, unread, markAllRead } = useNotifications();
  const [showNotif, setShowNotif] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [loadingIssue, setLoadingIssue] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Issues', href: '/issues', icon: AlertTriangle },
    { name: 'My Issues', href: '/my-issues', icon: FileText },
    { name: 'Users', href: '/users', icon: Users },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const isActive = (path) => location.pathname === path;

  // Load issue details when a notification with issueId is opened
  useEffect(() => {
    const loadIssue = async () => {
      if (!selectedNotif?.data?.issueId) {
        setSelectedIssue(null);
        return;
      }
      try {
        setLoadingIssue(true);
        const res = await issuesAPI.getById(selectedNotif.data.issueId);
        setSelectedIssue(res.data.data);
      } catch (_) {
        setSelectedIssue(null);
      } finally {
        setLoadingIssue(false);
      }
    };
    loadIssue();
  }, [selectedNotif]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 relative">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-white to-gray-50 shadow-2xl transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-20 px-8 border-b border-gray-200/50">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">F</span>
            </div>
            <div className="ml-4">
              <span className="text-2xl font-bold text-gradient">FixIT</span>
              <p className="text-xs text-gray-500">Support Platform</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="mt-8 px-6">
          <div className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`sidebar-item group ${
                    isActive(item.href)
                      ? 'sidebar-item-active'
                      : 'sidebar-item-inactive'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon 
                    size={20} 
                    className={`mr-3 ${
                      isActive(item.href) ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User section */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200/50 bg-white/50 backdrop-blur-sm">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center shadow-sm">
              <User size={20} className="text-primary-600" />
            </div>
            <div className="ml-4 flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.position}</p>
            </div>
            <button
              onClick={logout}
              className="ml-3 p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      {/* Remove bottom-28 and p to reduce the gap */}
      <div className="relative">
        {/* Header */}
        <header className="glass-effect border-b border-gray-200/50 relative z-[200]">
          <div className="flex items-center justify-between h-20 px-6 lg:px-8">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors mr-4"
              >
                <Menu size={20} />
              </button>
              
              {/* Inline brand: logo and tagline */}
              <Link to="/dashboard" className="flex items-center mr-4 hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-lg">F</span>
                </div>
                <div className="ml-2 hidden sm:block leading-tight">
                  <span className="text-base font-bold text-gradient">FixIT</span>
                  <p className="text-[11px] text-gray-500">Support Platform</p>
                </div>
              </Link>
              
              {/* Search bar */}
              <div className="flex-1 max-w-lg">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search issues, users..."
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Quick actions */}
              <Link
                to="/issues/new"
                className="btn btn-primary btn-md shadow-lg hover:shadow-xl"
              >
                <Plus size={16} className="mr-2" />
                New Issue
              </Link>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => { setShowNotif((s) => !s); markAllRead(); }}
                  className="relative p-3 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
                >
                  <Bell size={20} />
                  {unread > 0 && <span className="absolute top-2 right-2 min-w-[14px] h-[14px] px-1 text-[10px] leading-[14px] text-white bg-danger-500 rounded-full text-center">{unread}</span>}
                </button>
                {showNotif && (
                  <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-auto card p-2 z-[400]">
                    <div className="px-2 py-1 text-xs font-semibold text-gray-500">Notifications</div>
                    <div className="divide-y">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-sm text-gray-500">No notifications</div>
                      ) : notifications.map((n) => (
                        <button 
                          key={n.id} 
                          className="block w-full text-left p-3 hover:bg-gray-50"
                          onClick={() => { setSelectedNotif(n); setShowNotif(false); }}
                        >
                          <p className="text-sm font-medium text-gray-900">{n.title}</p>
                          <p className="text-xs text-gray-600">{n.message}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* User menu */}
              <div className="relative">
                <button className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-100 transition-all duration-200">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center shadow-sm">
                    <User size={18} className="text-primary-600" />
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700">
                    {user?.firstName}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6 min-h-screen">
          <div className="fade-in max-w-full">
            <Outlet />
          </div>
        </main>

        {/* Notification detail modal */}
        {selectedNotif && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedNotif(null)}></div>
            <div className="relative w-full max-w-md card p-6 z-[61]">
              <button 
                className="absolute top-3 right-3 p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                onClick={() => setSelectedNotif(null)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
              <div className="mb-2 text-xs text-gray-500">{new Date(selectedNotif.createdAt).toLocaleString()}</div>
              <h3 className="text-lg font-semibold text-gray-900">{selectedNotif.title}</h3>
              <p className="text-sm text-gray-700 mt-2">{selectedNotif.message}</p>

              {/* Issue reference */}
              {selectedNotif?.data?.issueId && (
                <div className="mt-4 p-3 rounded-lg bg-gray-50 border">
                  <p className="text-xs font-medium text-gray-600">Issue</p>
                  {loadingIssue ? (
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm text-gray-500">Loading issue…</span>
                    </div>
                  ) : (
                    <>
                      <div className="mt-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">{selectedIssue?.title || `#${selectedNotif.data.issueId}`}</p>
                        {selectedIssue && (
                          <div className="mt-1 flex items-center gap-2">
                            <span className="badge text-xs px-2 py-0.5 bg-gray-100">{selectedIssue.category}</span>
                            <span className="badge text-xs px-2 py-0.5 bg-gray-100">{selectedIssue.priority}</span>
                            <span className="badge text-xs px-2 py-0.5 bg-gray-100">{selectedIssue.status?.replace('_',' ')}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">ID: {selectedNotif.data.issueId}</span>
                        <Link 
                          to={`/issues/${selectedNotif.data.issueId}`} 
                          className="btn btn-primary btn-sm"
                          onClick={() => setSelectedNotif(null)}
                        >
                          View issue
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Sender details */}
              {selectedNotif?.data?.sender && (
                <div className="mt-3 p-3 rounded-lg bg-white border">
                  <p className="text-xs font-medium text-gray-600">From</p>
                  <div className="mt-1">
                    <p className="text-sm font-semibold text-gray-900">{selectedNotif.data.sender.name}</p>
                    <p className="text-xs text-gray-600">Employee ID: {selectedNotif.data.sender.employeeId || '—'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardLayout; 