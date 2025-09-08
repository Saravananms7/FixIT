import { useState } from 'react';
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

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Issues', href: '/issues', icon: AlertTriangle },
    { name: 'My Issues', href: '/my-issues', icon: FileText },
    { name: 'Users', href: '/users', icon: Users },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 relative">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-white to-gray-50 shadow-2xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
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
      <div className="lg:pl-72 relative">
        {/* Header */}
        <header className="glass-effect border-b border-gray-200/50">
          <div className="flex items-center justify-between h-20 px-6 lg:px-8">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors mr-4"
              >
                <Menu size={20} />
              </button>
              
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
              <button className="relative p-3 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200">
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-3 h-3 bg-danger-500 rounded-full pulse-glow"></span>
              </button>

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
        <main className="p-6 lg:p-8 min-h-screen">
          <div className="fade-in max-w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout; 