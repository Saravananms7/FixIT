import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Edit, 
  Trash2, 
  ArrowLeft, 
  User, 
  Clock, 
  AlertTriangle,
  MessageSquare,
  Tag,
  Send,
  CheckCircle,
  Star
} from 'lucide-react';
import { issuesAPI, usersAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { useSocket } from '../../contexts/SocketContext';

const IssueDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [addingComment, setAddingComment] = useState(false);
  const [helpersLoading, setHelpersLoading] = useState(false);
  const [helpers, setHelpers] = useState([]);
  const [assigningTo, setAssigningTo] = useState(null);
  const [offering, setOffering] = useState(false);
  const [showSolveModal, setShowSolveModal] = useState(false);
  const [solveData, setSolveData] = useState({
    solvedBy: '',
    solution: '',
    pointsAwarded: 10
  });
  const [solving, setSolving] = useState(false);

  useEffect(() => {
    fetchIssue();
  }, [id]);

  const fetchIssue = async () => {
    try {
      setLoading(true);
      const response = await issuesAPI.getById(id);
      setIssue(response.data.data);
    } catch (error) {
      console.error('Error fetching issue:', error);
      toast.error('Failed to load issue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!issue) return;
    // Only load helper suggestions if user is the submitter and issue is not closed
    if (user?._id === issue?.postedBy?._id && !['resolved','closed'].includes(issue.status)) {
      void fetchHelperSuggestions();
    }
  }, [issue, user]);

  const fetchHelperSuggestions = async () => {
    try {
      setHelpersLoading(true);
      const response = await issuesAPI.getHelperSuggestions(id);
      let list = response.data?.data?.helpers || [];
      
      // If no helpers found, get all users as fallback
      if (list.length === 0) {
        console.log('No helpers found, fetching all users...');
        const usersResponse = await usersAPI.getAll();
        list = usersResponse.data?.data || [];
        // Filter out the current user (issue owner)
        list = list.filter(user => user._id !== issue?.postedBy?._id);
      }
      
      console.log('Fetched helpers:', list); // Debug log
      setHelpers(list);
    } catch (error) {
      console.error('Error fetching helpers:', error);
    } finally {
      setHelpersLoading(false);
    }
  };

  const handleAssign = async (helperId) => {
    try {
      setAssigningTo(helperId);
      await issuesAPI.assign(id, helperId);
      toast.success('Issue assigned');
      await fetchIssue();
    } catch (error) {
      console.error('Error assigning issue:', error);
      const errorMessage = error.response?.data?.message || 'Failed to assign';
      toast.error(errorMessage);
    } finally {
      setAssigningTo(null);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    const content = commentContent.trim();
    if (!content) return;

    try {
      setAddingComment(true);
      const response = await issuesAPI.addComment(id, { content });
      const newComment = response.data.data;
      setIssue((prev) => ({
        ...prev,
        comments: [...(prev?.comments || []), newComment]
      }));
      setCommentContent('');
      toast.success('Comment added');
    } catch (error) {
      console.error('Error adding comment:', error);
      const errorMessage = error.response?.data?.message || 'Failed to add comment';
      toast.error(errorMessage);
    } finally {
      setAddingComment(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this issue? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(true);
      await issuesAPI.delete(id);
      toast.success('Issue deleted successfully');
      navigate('/issues');
    } catch (error) {
      console.error('Error deleting issue:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete issue';
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  const handleMarkAsSolved = async () => {
    if (!solveData.solvedBy) {
      toast.error('Please select a solver');
      return;
    }

    try {
      setSolving(true);
      await issuesAPI.markAsSolved(id, solveData);
      toast.success('Issue marked as solved! Points awarded to solver.');
      setShowSolveModal(false);
      setSolveData({ solvedBy: '', solution: '', pointsAwarded: 10 });
      await fetchIssue();
    } catch (error) {
      console.error('Error marking issue as solved:', error);
      const errorMessage = error.response?.data?.message || 'Failed to mark as solved';
      toast.error(errorMessage);
    } finally {
      setSolving(false);
    }
  };

  const canEditIssue = () => {
    return user?._id === issue?.postedBy?._id;
  };

  const canDeleteIssue = () => {
    return user?._id === issue?.postedBy?._id && 
           issue?.status !== 'resolved' && 
           issue?.status !== 'closed';
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

  const isOwner = user?._id === issue?.postedBy?._id;
  const isAssignedToMe = user?._id && issue?.assignedTo?._id === user._id;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner w-8 h-8"></div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Issue not found</h3>
        <p className="mt-1 text-sm text-gray-500">The issue you're looking for doesn't exist.</p>
        <div className="mt-6">
          <Link to="/issues" className="btn btn-primary btn-md">
            <ArrowLeft size={16} className="mr-2" />
            Back to Issues
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start space-x-4">
          <Link to="/issues" className="btn btn-secondary btn-sm mt-1">
            <ArrowLeft size={16} className="mr-2" />
            Back
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 leading-tight">{issue.title}</h1>
            <p className="text-gray-500 mt-1">Issue Details</p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          {canEditIssue() && (
            <Link
              to={`/issues/${issue._id}/edit`}
              className="btn btn-primary btn-md"
            >
              <Edit size={16} className="mr-2" />
              Edit
            </Link>
          )}
          
          {canDeleteIssue() && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="btn btn-danger btn-md"
            >
              {deleting ? (
                <div className="loading-spinner w-4 h-4"></div>
              ) : (
                <>
                  <Trash2 size={16} className="mr-2" />
                  Delete
                </>
              )}
            </button>
          )}
        </div>
      </div>
      
      {/* Issue Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{issue.description}</p>
            </div>
          </div>

          {/* Solution (if resolved) */}
          {issue.resolution?.solvedBy && (
            <div className="card p-6 border-l-4 border-green-500">
              <div className="flex items-center mb-4">
                <CheckCircle size={20} className="text-green-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Solution</h3>
              </div>
              {issue.resolution.solution && issue.resolution.solution.trim() ? (
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{issue.resolution.solution}</p>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-500 italic">No solution description provided</p>
                </div>
              )}
              {issue.resolution.pointsAwarded > 0 && (
                <div className="mt-4 flex items-center text-sm text-gray-600">
                  <Star size={16} className="text-yellow-500 mr-1" />
                  <span>{issue.resolution.pointsAwarded} points awarded</span>
                </div>
              )}
              {issue.resolution.pointsAwarded === 0 && issue.resolution.solvedBy._id === issue.postedBy._id && (
                <div className="mt-4 flex items-center text-sm text-gray-500">
                  <CheckCircle size={16} className="text-gray-400 mr-1" />
                  <span>Solved by issue owner (no points awarded)</span>
                </div>
              )}
            </div>
          )}

          {/* Comments Section */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Comments</h3>
            {/* Add comment form */}
            <form onSubmit={handleAddComment} className="mb-4">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                  <User size={16} className="text-primary-600" />
                </div>
                <div className="flex-1">
                  <textarea
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    placeholder="Write a comment..."
                    className="input min-h-[44px] h-11 resize-y"
                  />
                </div>
                <button
                  type="submit"
                  disabled={addingComment || !commentContent.trim()}
                  className="btn btn-primary btn-md flex-shrink-0"
                  title="Add comment"
                >
                  {addingComment ? (
                    <div className="loading-spinner w-4 h-4"></div>
                  ) : (
                    <>
                      <Send size={16} className="mr-2" />
                      Comment
                    </>
                  )}
                </button>
              </div>
            </form>
            {issue.comments && issue.comments.length > 0 ? (
              <div className="space-y-4">
                {issue.comments.map((comment, index) => (
                  <div key={index} className="border-l-4 border-primary-200 pl-4 py-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                        <User size={12} className="text-primary-600" />
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {(comment.user?.firstName || comment.postedBy?.firstName) || 'User'} {(comment.user?.lastName || comment.postedBy?.lastName) || ''}
                      </span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">{comment.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                <p className="text-gray-500 text-sm">No comments yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Offer to help (for non-owners) */}
          {!isOwner && !isAssignedToMe && !['resolved','closed'].includes(issue.status) && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Offer to Help</h3>
              <p className="text-sm text-gray-600 mb-3">Let the reporter know you're available to assist.</p>
              <button
                onClick={async () => {
                  try {
                    setOffering(true);
                    // Emit real-time help offer to the reporter
                    if (socket && issue?.postedBy?._id) {
                      socket.emit('message:send', {
                        recipientId: issue.postedBy._id,
                        message: "I'd like to help on this issue.",
                        issueId: issue._id,
                      });
                      toast.success('Offer sent');
                    } else {
                      toast.error('Not connected. Please try again.');
                    }
                  } catch (error) {
                    const msg = error.response?.data?.message || 'Failed to send offer';
                    toast.error(msg);
                  } finally {
                    setOffering(false);
                  }
                }}
                disabled={offering}
                className="btn btn-primary btn-md"
              >
                {offering ? 'Sending...' : 'Offer to Help'}
              </button>
            </div>
          )}

          {/* Recommended Helpers (for owner) */}
          {user?._id === issue?.postedBy?._id && !['resolved','closed'].includes(issue.status) && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommended Helpers</h3>
              {helpersLoading ? (
                <div className="flex items-center justify-center py-6"><div className="loading-spinner w-6 h-6"></div></div>
              ) : helpers.length > 0 ? (
                <div className="space-y-3">
                  {/* Best match */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-primary-50 to-white border border-primary-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center shadow-sm">
                          <span className="text-sm font-semibold text-primary-600">{helpers[0].firstName?.charAt(0)}</span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-semibold text-gray-900">{helpers[0].firstName} {helpers[0].lastName}</p>
                          <p className="text-xs text-gray-600">{helpers[0].department || '—'} • Score {(helpers[0].helperScore ?? 0).toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (!socket) return toast.error('Not connected');
                            socket.emit('help:ask', { recipientId: helpers[0]._id, issueId: issue._id });
                            toast.success('Help request sent');
                          }}
                          className="btn btn-primary btn-sm"
                        >
                          Ask Help
                        </button>
                      </div>
                    </div>
                    {/* Matching skills */}
                    {issue.requiredSkills?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {issue.requiredSkills.slice(0, 4).map((s, i) => (
                          <span key={i} className="badge badge-primary text-[10px] px-2 py-0.5">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Other candidates */}
                  {helpers.slice(1, 4).map((h) => (
                    <div key={h._id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center">
                        <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-xs font-semibold text-gray-600">{h.firstName?.charAt(0)}</span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{h.firstName} {h.lastName}</p>
                          <p className="text-xs text-gray-500">Score {(h.helperScore ?? 0).toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (!socket) return toast.error('Not connected');
                            socket.emit('help:ask', { recipientId: h._id, issueId: issue._id });
                            toast.success('Help request sent');
                          }}
                          className="btn btn-secondary btn-sm"
                        >
                          Ask Help
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No recommendations available.</p>
              )}
            </div>
          )}

          {/* Mark as Solved (for owner) */}
          {user?._id === issue?.postedBy?._id && !['resolved','closed'].includes(issue.status) && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Mark as Solved</h3>
              <p className="text-sm text-gray-600 mb-4">Award points to the person who solved this issue.</p>
              <button
                onClick={() => setShowSolveModal(true)}
                className="btn btn-success btn-md w-full"
              >
                <CheckCircle size={16} className="mr-2" />
                Mark as Solved
              </button>
            </div>
          )}
          {/* Status and Priority */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status & Priority</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Status</span>
                <span className={`badge ${getStatusColor(issue.status)} text-xs font-semibold px-3 py-1`}>
                  {getStatusText(issue.status)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Priority</span>
                <span className={`badge ${getPriorityColor(issue.priority)} text-xs font-semibold px-3 py-1`}>
                  {issue.priority}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Category</span>
                <span className="text-sm text-gray-900 capitalize font-medium">{issue.category}</span>
              </div>
            </div>
          </div>

          {/* Issue Info */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Issue Information</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <User size={14} className="text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {issue.postedBy?.firstName} {issue.postedBy?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{issue.postedBy?.employeeId}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock size={14} className="text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    Created {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}
                  </p>
                  {issue.updatedAt !== issue.createdAt && (
                    <p className="text-xs text-gray-500">
                      Updated {formatDistanceToNow(new Date(issue.updatedAt), { addSuffix: true })}
                    </p>
                  )}
                </div>
              </div>

              {issue.assignedTo && (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User size={14} className="text-success-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      Assigned to {issue.assignedTo.firstName} {issue.assignedTo.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{issue.assignedTo.employeeId}</p>
                  </div>
                </div>
              )}

              {issue.resolution?.solvedBy && (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle size={14} className="text-yellow-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {issue.resolution.solvedBy._id === issue.postedBy._id 
                        ? `Solved by ${issue.resolution.solvedBy.firstName} ${issue.resolution.solvedBy.lastName} (self)`
                        : `Solved by ${issue.resolution.solvedBy.firstName} ${issue.resolution.solvedBy.lastName}`
                      }
                    </p>
                    <p className="text-xs text-gray-500">
                      {issue.resolution.solvedBy.employeeId} 
                      {issue.resolution.pointsAwarded > 0 && ` • ${issue.resolution.pointsAwarded} points awarded`}
                    </p>
                    {issue.resolution.solvedAt && (
                      <p className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(issue.resolution.solvedAt), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Required Skills */}
          {issue.requiredSkills && issue.requiredSkills.length > 0 && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {issue.requiredSkills.map((skill, index) => (
                  <span key={index} className="badge badge-primary text-xs font-medium px-3 py-1">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {issue.tags && issue.tags.length > 0 && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {issue.tags.map((tag, index) => (
                  <span key={index} className="badge badge-secondary text-xs font-medium px-3 py-1">
                    <Tag size={12} className="mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Location */}
          {issue.location && (issue.location.building || issue.location.floor || issue.location.room) && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Location</h3>
              <div className="space-y-3">
                {issue.location.building && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Building</span>
                    <span className="text-sm text-gray-900 font-medium">{issue.location.building}</span>
                  </div>
                )}
                {issue.location.floor && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Floor</span>
                    <span className="text-sm text-gray-900 font-medium">{issue.location.floor}</span>
                  </div>
                )}
                {issue.location.room && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Room</span>
                    <span className="text-sm text-gray-900 font-medium">{issue.location.room}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mark as Solved Modal */}
      {showSolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowSolveModal(false)}></div>
          <div className="relative w-full max-w-md card p-6 z-51">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Mark Issue as Solved</h3>
            
            <div className="space-y-4">
              {/* Solver Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Who solved this issue?
                </label>
                <select
                  value={solveData.solvedBy}
                  onChange={(e) => {
                    const selectedValue = e.target.value;
                    setSolveData({ 
                      ...solveData, 
                      solvedBy: selectedValue,
                      pointsAwarded: selectedValue === 'self' ? 0 : solveData.pointsAwarded
                    });
                  }}
                  className="input w-full"
                  required
                >
                  <option value="">Select a solver...</option>
                  <option value="self">Solved myself (no points)</option>
                  {helpers.length > 0 ? (
                    helpers.map((helper) => (
                      <option key={helper._id} value={helper._id}>
                        {helper.firstName || 'Unknown'} {helper.lastName || 'User'} 
                        {helper.employeeId && ` (${helper.employeeId})`}
                        {helper.department && ` - ${helper.department}`}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No other users available</option>
                  )}
                </select>
                {helpers.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    No other users found. You can still mark as solved by yourself.
                  </p>
                )}
              </div>

              {/* Solution Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Solution Description
                </label>
                <textarea
                  value={solveData.solution}
                  onChange={(e) => setSolveData({ ...solveData, solution: e.target.value })}
                  placeholder="Describe how the issue was resolved... (optional)"
                  className="input w-full h-24 resize-none"
                />
              </div>

              {/* Points Awarded */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Points to Award
                </label>
                <div className="flex items-center space-x-2">
                  <Star size={16} className="text-yellow-500" />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={solveData.pointsAwarded}
                    onChange={(e) => setSolveData({ ...solveData, pointsAwarded: parseInt(e.target.value) || 0 })}
                    className={`input w-20 ${solveData.solvedBy === 'self' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    disabled={solveData.solvedBy === 'self'}
                  />
                  <span className="text-sm text-gray-500">points</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {solveData.solvedBy === 'self' 
                    ? 'No points awarded when solving your own issue'
                    : 'Higher points for more complex or urgent issues'
                  }
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowSolveModal(false)}
                className="btn btn-secondary btn-md"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkAsSolved}
                disabled={solving || !solveData.solvedBy}
                className="btn btn-success btn-md"
              >
                {solving ? (
                  <div className="loading-spinner w-4 h-4 mr-2"></div>
                ) : (
                  <CheckCircle size={16} className="mr-2" />
                )}
                {solving ? 'Marking...' : 'Mark as Solved'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueDetail; 