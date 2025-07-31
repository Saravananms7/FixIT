import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Filter, 
  Search, 
  AlertTriangle, 
  Clock, 
  User, 
  MessageSquare,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { issuesAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const Issues = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
    search: '',
  });

  useEffect(() => {
    fetchIssues();
  }, [filters]);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      // Exclude current user's issues from "All Issues" page
      const params = {
        ...filters,
        excludePostedBy: user?._id // This will exclude current user's issues
      };
      const response = await issuesAPI.getAll(params);
      setIssues(response.data.data);
    } catch (error) {
      console.error('Error fetching issues:', error);
      toast.error('Failed to load issues');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleDelete = async (issueId) => {
    if (!window.confirm('Are you sure you want to delete this issue? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(issueId);
      await issuesAPI.delete(issueId);
      toast.success('Issue deleted successfully');
      fetchIssues(); // Refresh the list
    } catch (error) {
      console.error('Error deleting issue:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete issue';
      toast.error(errorMessage);
    } finally {
      setDeleting(null);
    }
  };

  const canEditIssue = (issue) => {
    return user?._id === issue.postedBy?._id;
  };

  const canDeleteIssue = (issue) => {
    return user?._id === issue.postedBy?._id && 
           issue.status !== 'resolved' && 
           issue.status !== 'closed';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'badge-warning';
      case 'assigned': return 'badge-primary';
      case 'in_progress': return 'badge-primary';
      case 'resolved': return 'badge-success';
      case 'closed': return 'badge-secondary';
      default: return 'badge-secondary';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'badge-danger';
      case 'high': return 'badge-warning';
      case 'medium': return 'badge-primary';
      case 'low': return 'badge-success';
      default: return 'badge-secondary';
    }
  };

  const getStatusText = (status) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner w-8 h-8"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Issues</h1>
          <p className="text-gray-600">Manage and track all support issues</p>
        </div>
        <Link
          to="/issues/new"
          className="btn btn-primary btn-md mt-4 sm:mt-0"
        >
          <Plus size={16} className="mr-2" />
          New Issue
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search issues..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="input"
            >
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="input"
            >
              <option value="">All Priority</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="input"
            >
              <option value="">All Categories</option>
              <option value="hardware">Hardware</option>
              <option value="software">Software</option>
              <option value="network">Network</option>
              <option value="printer">Printer</option>
              <option value="email">Email</option>
              <option value="access">Access</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Issues List */}
      <div className="space-y-4">
        {issues.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No issues found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filters.search || filters.status || filters.priority || filters.category
                ? 'Try adjusting your filters'
                : 'Get started by creating a new issue'}
            </p>
            {!filters.search && !filters.status && !filters.priority && !filters.category && (
              <div className="mt-6">
                <Link
                  to="/issues/new"
                  className="btn btn-primary btn-md"
                >
                  <Plus size={16} className="mr-2" />
                  New Issue
                </Link>
              </div>
            )}
          </div>
        ) : (
          issues.map((issue) => (
            <div key={issue._id} className="card p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {issue.title}
                    </h3>
                    <span className={`badge ${getStatusColor(issue.status)}`}>
                      {getStatusText(issue.status)}
                    </span>
                    <span className={`badge ${getPriorityColor(issue.priority)}`}>
                      {issue.priority}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-3 line-clamp-2">
                    {issue.description}
                  </p>
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center">
                      <User size={16} className="mr-1" />
                      {issue.postedBy?.firstName} {issue.postedBy?.lastName}
                    </div>
                    <div className="flex items-center">
                      <Clock size={16} className="mr-1" />
                      {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}
                    </div>
                    {issue.comments?.length > 0 && (
                      <div className="flex items-center">
                        <MessageSquare size={16} className="mr-1" />
                        {issue.comments.length} comments
                      </div>
                    )}
                    {issue.assignedTo && (
                      <div className="flex items-center">
                        <span className="text-primary-600 font-medium">
                          Assigned to {issue.assignedTo.firstName} {issue.assignedTo.lastName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="ml-4 flex-shrink-0 flex space-x-2">
                  <Link
                    to={`/issues/${issue._id}`}
                    className="btn btn-secondary btn-sm"
                  >
                    <Eye size={16} className="mr-1" />
                    View
                  </Link>
                  
                  {canEditIssue(issue) && (
                    <Link
                      to={`/issues/${issue._id}/edit`}
                      className="btn btn-primary btn-sm"
                    >
                      <Edit size={16} className="mr-1" />
                      Edit
                    </Link>
                  )}
                  
                  {canDeleteIssue(issue) && (
                    <button
                      onClick={() => handleDelete(issue._id)}
                      disabled={deleting === issue._id}
                      className="btn btn-danger btn-sm"
                    >
                      {deleting === issue._id ? (
                        <div className="loading-spinner w-4 h-4"></div>
                      ) : (
                        <>
                          <Trash2 size={16} className="mr-1" />
                          Delete
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Issues; 