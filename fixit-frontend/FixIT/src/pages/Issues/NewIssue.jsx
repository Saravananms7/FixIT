import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { issuesAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const NewIssue = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    requiredSkills: ['general'],
  });
  const [loading, setLoading] = useState(false);
  const [skillsInput, setSkillsInput] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Normalize and validate requiredSkills: array of strings, min length 2
      const normalizedSkills = (Array.isArray(formData.requiredSkills)
        ? formData.requiredSkills
        : String(formData.requiredSkills || '')
            .split(/[\n,]+/)
            .map(s => s.trim())
      )
        .filter(Boolean)
        .map(s => s.toLowerCase())
        .filter(s => s.length >= 2);

      if (normalizedSkills.length === 0) {
        setError('Please add at least one required skill (min 2 characters each).');
        toast.error('Please add at least one valid required skill.');
        setLoading(false);
        return;
      }

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        priority: formData.priority,
        requiredSkills: normalizedSkills,
      };

      const response = await issuesAPI.create(payload);
      toast.success('Issue created successfully!');
      navigate('/issues');
    } catch (error) {
      console.error('Error creating issue:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to create issue. Please try again.';
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create New Issue</h1>
        <p className="text-gray-600">Report a new support issue</p>
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
              disabled={loading}
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
              disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
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
            <textarea
              name="requiredSkills"
              value={skillsInput}
              onChange={(e) => {
                const raw = e.target.value;
                setSkillsInput(raw);
                const skills = raw
                  .split(/[\n,]+/)
                  .map(s => s.trim())
                  .filter(Boolean);
                setFormData({
                  ...formData,
                  requiredSkills: skills.length > 0 ? skills : []
                });
              }}
              rows={2}
              className="input"
              placeholder="Comma or line separated (e.g., JavaScript, React, Node.js)"
              disabled={loading}
            />
            {formData.requiredSkills.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.requiredSkills.map((s, i) => (
                  <span key={`${s}-${i}`} className="badge badge-primary text-xs px-2 py-0.5">{s}</span>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">Press comma or Enter to separate skills</p>
          </div>
          
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/issues')}
              className="btn btn-secondary btn-md"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-md"
            >
              {loading ? (
                <>
                  <div className="loading-spinner w-4 h-4 mr-2"></div>
                  Creating...
                </>
              ) : (
                'Create Issue'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewIssue; 