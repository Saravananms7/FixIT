import { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users, 
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Award,
  Target,
  AlertCircle,
  Sparkles,
  Star,
  ArrowUpRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { issuesAPI, usersAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalIssues: 0,
    openIssues: 0,
    resolvedIssues: 0,
    totalUsers: 0,
    avgResolutionTime: 0,
  });
  const [recentIssues, setRecentIssues] = useState([]);
  const [topContributors, setTopContributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [animateStats, setAnimateStats] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    // Trigger stats animation after data loads
    if (!loading && !error) {
      setTimeout(() => setAnimateStats(true), 300);
    }
  }, [loading, error]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch issues (excluding current user's issues for "All Issues" view)
      const issuesResponse = await issuesAPI.getAll({ 
        limit: 100,
        excludePostedBy: user?._id 
      });
      const issues = issuesResponse.data.data || [];
      
      // Fetch users
      const usersResponse = await usersAPI.getAll({ limit: 100 });
      const users = usersResponse.data.data || [];
      
      // Fetch top contributors
      let contributors = [];
      try {
        const contributorsResponse = await usersAPI.getTopContributors({ limit: 5 });
        contributors = contributorsResponse.data.data?.topResolvers || [];
      } catch (contributorError) {
        console.warn('Could not fetch top contributors:', contributorError);
      }
      
      // Calculate statistics
      const totalIssues = issues.length;
      const openIssues = issues.filter(issue => ['open', 'assigned', 'in_progress'].includes(issue.status)).length;
      const resolvedIssues = issues.filter(issue => issue.status === 'resolved').length;
      const totalUsers = users.length;
      
      // Calculate average resolution time
      const resolvedIssuesWithTime = issues.filter(issue => issue.resolution?.timeSpent);
      const avgResolutionTime = resolvedIssuesWithTime.length > 0 
        ? Math.round(resolvedIssuesWithTime.reduce((sum, issue) => sum + (issue.resolution.timeSpent || 0), 0) / resolvedIssuesWithTime.length)
        : 0;

      setStats({
        totalIssues,
        openIssues,
        resolvedIssues,
        totalUsers,
        avgResolutionTime,
      });
      
      setRecentIssues(issues.slice(0, 5));
      setTopContributors(contributors);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const chartData = [
    { name: 'Open', value: stats.openIssues, color: '#f59e0b' },
    { name: 'In Progress', value: Math.max(0, stats.totalIssues - stats.openIssues - stats.resolvedIssues), color: '#3b82f6' },
    { name: 'Resolved', value: stats.resolvedIssues, color: '#22c55e' },
  ].filter(item => item.value > 0);

  const categoryData = recentIssues.reduce((acc, issue) => {
    const category = issue.category || 'other';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  const categoryChartData = Object.entries(categoryData).map(([category, count]) => ({
    name: category.charAt(0).toUpperCase() + category.slice(1),
    count,
  }));

  const StatCard = ({ title, value, icon: Icon, color, trend, trendValue, delay = 0 }) => (
    <div 
      className={`stats-card p-6 transform transition-all duration-1000 ease-out ${
        animateStats ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="relative overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-white opacity-80"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-500/5 to-transparent animate-shimmer"></div>
        
        <div className="relative flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <div className="flex items-baseline space-x-2">
              <p className="text-3xl font-bold text-gray-900">{value}</p>
              {trend && (
                <div className="flex items-center">
                  {trend === 'up' ? (
                    <TrendingUp className="w-4 h-4 text-success-500 mr-1 animate-pulse" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-danger-500 mr-1 animate-pulse" />
                  )}
                  <span className={`text-xs font-medium ${trend === 'up' ? 'text-success-600' : 'text-danger-600'}`}>
                    {trendValue}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className={`p-3 rounded-xl bg-gradient-to-br ${color} flex-shrink-0 ml-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="loading-spinner w-12 h-12"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full animate-pulse opacity-20"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-gray-400 animate-bounce" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Dashboard Error</h3>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
        <button 
          onClick={fetchDashboardData}
          className="mt-4 btn btn-primary btn-md hover:scale-105 transition-transform duration-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with enhanced animations */}
      <div className="slide-up-fade">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg animate-pulse">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.firstName}! 👋</h1>
            <p className="text-gray-600 text-lg">Here's what's happening with FixIT today.</p>
          </div>
        </div>
      </div>

      {/* Stats Cards with staggered animations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Open Issues"
          value={stats.openIssues}
          icon={AlertTriangle}
          color="from-warning-500 to-warning-600"
          trend="up"
          trendValue="+12%"
          delay={0}
        />
        <StatCard
          title="Resolved"
          value={stats.resolvedIssues}
          icon={CheckCircle}
          color="from-success-500 to-success-600"
          trend="up"
          trendValue="+8%"
          delay={100}
        />
        <StatCard
          title="Team Members"
          value={stats.totalUsers}
          icon={Users}
          color="from-primary-500 to-primary-600"
          delay={200}
        />
        <StatCard
          title="Avg Resolution"
          value={`${stats.avgResolutionTime}m`}
          icon={Clock}
          color="from-gray-500 to-gray-600"
          trend="down"
          trendValue="-5%"
          delay={300}
        />
      </div>

      {/* Charts Section with enhanced animations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Issue Status Chart */}
        <div className="card p-6 slide-up-fade" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Issue Status Distribution</h3>
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-primary-500 animate-pulse" />
              <span className="text-sm text-gray-500">Real-time</span>
            </div>
          </div>
          {chartData.length > 0 ? (
            <div className="h-80 chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    animationDuration={2000}
                    animationBegin={600}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                      backdropFilter: 'blur(10px)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-6 flex flex-wrap justify-center gap-4">
                {chartData.map((item, index) => (
                  <div 
                    key={item.name} 
                    className="flex items-center animate-fade-in-up"
                    style={{ animationDelay: `${800 + index * 100}ms` }}
                  >
                    <div 
                      className="w-3 h-3 rounded-full mr-2 shadow-sm"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sm text-gray-600 font-medium">{item.name}: {item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center">
              <div className="text-center animate-fade-in">
                <Activity className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">No issues data available</p>
              </div>
            </div>
          )}
        </div>

        {/* Category Chart */}
        <div className="card p-6 slide-up-fade" style={{ animationDelay: '500ms' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Issues by Category</h3>
            <Target className="w-5 h-5 text-primary-500 animate-pulse" />
          </div>
          {categoryChartData.length > 0 ? (
            <div className="h-80 chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                      backdropFilter: 'blur(10px)'
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#3b82f6" 
                    radius={[4, 4, 0, 0]}
                    animationDuration={2000}
                    animationBegin={700}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center">
              <div className="text-center animate-fade-in">
                <Target className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">No category data available</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity & Top Contributors with enhanced animations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Issues */}
        <div className="card p-6 slide-up-fade" style={{ animationDelay: '600ms' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Issues</h3>
            <Zap className="w-5 h-5 text-primary-500 animate-pulse" />
          </div>
          <div className="space-y-4">
            {recentIssues.length > 0 ? (
              recentIssues.map((issue, index) => (
                <div 
                  key={issue._id || index} 
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-fade-in-up"
                  style={{ animationDelay: `${700 + index * 100}ms` }}
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">{issue.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {issue.postedBy?.firstName} {issue.postedBy?.lastName} • {issue.category || 'Other'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                    <span className={`badge ${
                      issue.priority === 'urgent' ? 'badge-danger' :
                      issue.priority === 'high' ? 'badge-warning' :
                      issue.priority === 'medium' ? 'badge-primary' : 'badge-success'
                    }`}>
                      {issue.priority || 'medium'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 animate-fade-in">
                <Zap className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">No recent issues</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Contributors */}
        <div className="card p-6 slide-up-fade" style={{ animationDelay: '700ms' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Top Contributors</h3>
            <Award className="w-5 h-5 text-primary-500 animate-pulse" />
          </div>
          <div className="space-y-4">
            {topContributors.length > 0 ? (
              topContributors.map((contributor, index) => (
                <div 
                  key={contributor._id || index} 
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-fade-in-up"
                  style={{ animationDelay: `${800 + index * 100}ms` }}
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 hover:scale-110 transition-transform duration-200">
                      <span className="text-sm font-semibold text-primary-600">
                        {contributor.firstName?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div className="ml-4 flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {contributor.firstName} {contributor.lastName}
                      </p>
                      <p className="text-sm text-gray-600 truncate">{contributor.department || 'Department'}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="font-semibold text-gray-900">
                      {contributor.contributions?.issuesResolved || 0} resolved
                    </p>
                    <div className="flex items-center mt-1">
                      <Star className="w-4 h-4 text-yellow-500 animate-pulse" />
                      <span className="text-sm text-gray-600 ml-1">
                        {(contributor.rating?.average || 0).toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 animate-fade-in">
                <Award className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">No contributor data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 