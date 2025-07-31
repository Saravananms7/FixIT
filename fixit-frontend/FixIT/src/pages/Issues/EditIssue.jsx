import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { issuesAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const EditIssue = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    requiredSkills: ['general'],
    location: {
      building: '',
      floor: '',
      room: ''
    },
    tags: [],
    estimatedTime: ''
  });

  useEffect(() => {
    const fetchIssue = async () => {
      try {
        const response = await issuesAPI.getById(id);
        const issue = response.data.data;
        
        // Check if user owns this issue
        if (issue.postedBy._id !== user?._id) {
          toast.error('You can only edit your own issues');
          navigate('/issues');
          return;
        }

        // Check if issue can be edited
        if (issue.status === 'resolved' || issue.status === 'closed') {
          toast.error('Cannot edit resolved or closed issues');
          navigate('/issues');
          return;
        }

        setFormData({
          title: issue.title,
          description: issue.description,
          category: issue.category,
          priority: issue.priority,
          requiredSkills: issue.requiredSkills,
          location: issue.location || { building: '', floor: '', room: '' },
          tags: issue.tags || [],
          estimatedTime: issue.estimatedTime || ''
        });
      } catch (error) {
        console.error('Error fetching issue:', error);
        toast.error('Failed to load issue');
        navigate('/issues');
      } finally {
        setLoading(false);
      }
    };

    fetchIssue();
  }, [id, user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleLocationChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        [field]: value
      }
    }));
  };

  const handleSkillsChange = (e) => {
    const skills = e.target.value.split(',').map(skill => skill.trim()).filter(skill => skill);
    setFormData(prev => ({
      ...prev,
      requiredSkills: skills.length > 0 ? skills : ['general']
    }));
  };

  const handleTagsChange = (e) => {
    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData(prev => ({
      ...prev,
      tags
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const updateData = { ...formData };
      if (updateData.estimatedTime) {
        updateData.estimatedTime = parseInt(updateData.estimatedTime);
      }

      await issuesAPI.update(id, updateData);
      toast.success('Issue updated successfully!');
      navigate('/issues');
    } catch (error) {
      console.error('Error updating issue:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to update issue. Please try again.';
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading-spinner w-8 h-8"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Issue</h1>
        <p className="text-gray-600">Update your issue details</p>
      </div>
      
      <div className="card p-6">
        {error && (
          <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg">
            <p className="text-danger-700 font-medium">Error: {error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="input"
              placeholder="Brief description of the issue"
              disabled={saving}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              name="description"
              required
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="input"
              placeholder="Detailed description of the issue"
              disabled={saving}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                name="category"
                required
                value={formData.category}
                onChange={handleChange}
                className="input"
                disabled={saving}
              >
                <option value="">Select Category</option>
                <option value="hardware">Hardware</option>
                <option value="software">Software</option>
                <option value="network">Network</option>
                <option value="printer">Printer</option>
                <option value="email">Email</option>
                <option value="access">Access</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="input"
                disabled={saving}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Required Skills
            </label>
            <input
              type="text"
              value={formData.requiredSkills.join(', ')}
              onChange={handleSkillsChange}
              className="input"
              placeholder="Enter skills separated by commas (e.g., JavaScript, React, Node.js)"
              disabled={saving}
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the skills needed to resolve this issue
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Building
              </label>
              <input
                type="text"
                value={formData.location.building}
                onChange={(e) => handleLocationChange('building', e.target.value)}
                className="input"
                placeholder="Building name"
                disabled={saving}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Floor
              </label>
              <input
                type="text"
                value={formData.location.floor}
                onChange={(e) => handleLocationChange('floor', e.target.value)}
                className="input"
                placeholder="Floor number"
                disabled={saving}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Room
              </label>
              <input
                type="text"
                value={formData.location.room}
                onChange={(e) => handleLocationChange('room', e.target.value)}
                className="input"
                placeholder="Room number"
                disabled={saving}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <input
                type="text"
                value={formData.tags.join(', ')}
                onChange={handleTagsChange}
                className="input"
                placeholder="Enter tags separated by commas"
                disabled={saving}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Time (hours)
              </label>
              <input
                type="number"
                name="estimatedTime"
                value={formData.estimatedTime}
                onChange={handleChange}
                className="input"
                placeholder="Estimated time in hours"
                min="1"
                disabled={saving}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/issues')}
              className="btn btn-secondary btn-md"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary btn-md"
            >
              {saving ? (
                <>
                  <div className="loading-spinner w-4 h-4 mr-2"></div>
                  Updating...
                </>
              ) : (
                'Update Issue'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditIssue; 