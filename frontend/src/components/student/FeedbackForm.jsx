import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, MessageSquare, X, Send } from 'lucide-react';
import { studentAPI } from '../../services/api';

export default function FeedbackForm({ studentId, showNotification, onClose }) {
  const navigate = useNavigate();
  const [selectedItem, setSelectedItem] = useState('');
  const [courses, setCourses] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  
  const [rating, setRating] = useState({
    overall: 0,
    contentQuality: 0,
    teacherPerformance: 0,
    materialRelevance: 0,
    difficulty: 0
  });
  const [comments, setComments] = useState('');
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');
  const [suggestions, setSuggestions] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false); // Changed from true to false
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (studentId) {
      loadCoursesAndModules();
    }
  }, [studentId]);

  const loadCoursesAndModules = async () => {
    try {
      setLoadingData(true);
      const coursesRes = await studentAPI.getEnrollments(studentId);
      // Map enrollments to extract course information
      const enrolledCourses = (coursesRes.data.data || []).map(enrollment => ({
        _id: enrollment.courseId._id,
        name: enrollment.courseId.name,
        code: enrollment.courseId.code
      }));
      setCourses(enrolledCourses);
      setLoadingData(false);
    } catch (err) {
      console.error('Error loading data:', err);
      showNotification('Failed to load courses', 'error');
      setLoadingData(false);
    }
  };

  const handleRatingChange = (category, value) => {
    setRating(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating.overall === 0) {
      showNotification('Please provide an overall rating', 'error');
      return;
    }

    if (!selectedItem) {
      showNotification('Please select a course', 'error');
      return;
    }

    try {
      setLoading(true);
      await studentAPI.submitFeedback({
        studentId,
        courseId: selectedItem,
        type: 'course',
        rating,
        comments,
        strengths: strengths ? strengths.split(',').map(s => s.trim()).filter(Boolean) : [],
        areasForImprovement: improvements ? improvements.split(',').map(i => i.trim()).filter(Boolean) : [],
        suggestions,
        isAnonymous
      });

      showNotification('Feedback submitted successfully!', 'success');
      // Reset form
      setRating({ overall: 0, contentQuality: 0, teacherPerformance: 0, materialRelevance: 0, difficulty: 0 });
      setComments('');
      setStrengths('');
      setImprovements('');
      setSuggestions('');
      setSelectedItem('');
      // Auto-close after successful submission
      setTimeout(() => {
        if (onClose) {
          onClose();
        } else {
          navigate('/student');
        }
      }, 500);
    } catch (err) {
      console.error('Error submitting feedback:', err);
      showNotification(err.response?.data?.message || 'Failed to submit feedback', 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (category) => {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-slate-600 w-32">{category}:</span>
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              onClick={() => handleRatingChange(category.toLowerCase().replace(/\s+/g, ''), star)}
              className="focus:outline-none transition-transform hover:scale-110"
            >
              <Star
                size={24}
                className={`${
                  star <= (rating[category.toLowerCase().replace(/\s+/g, '')] || 0)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-slate-300'
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    );
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/student');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full p-2 transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Share Your Feedback</h2>
            <p className="text-slate-600 mt-2">Help us improve by sharing your experience</p>
          </div>

          {loadingData ? (
            <div className="text-center py-8">Loading courses...</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Course Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Select Course *
                </label>
                <select
                  value={selectedItem}
                  onChange={(e) => setSelectedItem(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">-- Choose a course --</option>
                  {courses.map(course => (
                    <option key={course._id} value={course._id}>
                      {course.code ? `${course.code} - ${course.name}` : course.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Overall Rating */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Overall Rating *
              </label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingChange('overall', star)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      size={32}
                      className={`${
                        star <= rating.overall
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {rating.overall > 0 && `Rating: ${rating.overall}/5`}
              </p>
            </div>

            {/* Detailed Ratings */}
            <div className="bg-slate-50 p-4 rounded-lg space-y-4">
              {renderStars('ContentQuality')}
              {renderStars('TeacherPerformance')}
              {renderStars('MaterialRelevance')}
              {renderStars('Difficulty')}
            </div>

            {/* Comments */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Comments
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Share your detailed thoughts..."
                rows="3"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Strengths */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                What went well? (comma-separated)
              </label>
              <input
                type="text"
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                placeholder="e.g., Clear explanations, Good resources, Interactive"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Areas for Improvement */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Areas for improvement (comma-separated)
              </label>
              <input
                type="text"
                value={improvements}
                onChange={(e) => setImprovements(e.target.value)}
                placeholder="e.g., More examples, Better organization, More practice"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Suggestions */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Suggestions for future improvements
              </label>
              <textarea
                value={suggestions}
                onChange={(e) => setSuggestions(e.target.value)}
                placeholder="Your ideas to make this better..."
                rows="2"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Anonymous */}
            <label className="flex items-center space-x-2 p-3 bg-slate-50 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded"
              />
              <span className="text-sm text-slate-700">Keep my feedback anonymous</span>
            </label>

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !selectedItem || rating.overall === 0}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>{loading ? 'Submitting...' : 'Submit Feedback'}</span>
              </button>
            </div>
          </form>
          )}
        </div>
      </div>
    </div>
  );
}
