import React, { useEffect, useState } from 'react';

interface Golfer {
  id: number;
  name: string;
}

interface Course {
  id: number;
  name: string;
}

const AddScoreForm: React.FC = () => {
  const [golfers, setGolfers] = useState<Golfer[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [formData, setFormData] = useState({
    golfer_id: '',
    course_id: '',
    gross_score: '',
    date_played: '',
    holes_played: '18',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch golfers
    fetch('/api/golfers')
      .then(res => res.json())
      .then(data => setGolfers(data))
      .catch(() => setGolfers([]));
    // Fetch courses
    fetch('/api/courses')
      .then(res => res.json())
      .then(data => setCourses(data))
      .catch(() => setCourses([]));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    // Validate
    if (!formData.golfer_id || !formData.course_id || !formData.gross_score || !formData.date_played || !formData.holes_played) {
      setError('All fields are required.');
      setLoading(false);
      return;
    }
    // Prepare payload
    const payload = {
      golfer_id: Number(formData.golfer_id),
      course_id: Number(formData.course_id),
      gross_score: Number(formData.gross_score),
      date_played: formData.date_played,
      holes_played: Number(formData.holes_played),
    };
    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Score added successfully!');
        setFormData({
          golfer_id: '',
          course_id: '',
          gross_score: '',
          date_played: '',
          holes_played: '18',
        });
      } else {
        setError(data.error || 'Failed to add score.');
      }
    } catch (err) {
      setError('Failed to add score.');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 500, margin: '0 auto', background: '#fff', padding: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
      <h2 style={{ textAlign: 'center', color: '#667eea' }}>Add Score</h2>
      {message && <div style={{ color: 'green', marginBottom: 12 }}>{message}</div>}
      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
      <div style={{ marginBottom: 16 }}>
        <label>Golfer:</label>
        <select name="golfer_id" value={formData.golfer_id} onChange={handleChange} className="form-control" required>
          <option value="">Select Golfer</option>
          {golfers.map(golfer => (
            <option key={golfer.id} value={golfer.id}>{golfer.name}</option>
          ))}
        </select>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label>Course:</label>
        <select name="course_id" value={formData.course_id} onChange={handleChange} className="form-control" required>
          <option value="">Select Course</option>
          {courses.map(course => (
            <option key={course.id} value={course.id}>{course.name}</option>
          ))}
        </select>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label>Gross Score:</label>
        <input type="number" name="gross_score" value={formData.gross_score} onChange={handleChange} className="form-control" min={1} required />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label>Date Played:</label>
        <input type="date" name="date_played" value={formData.date_played} onChange={handleChange} className="form-control" required />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label>Holes Played:</label>
        <select name="holes_played" value={formData.holes_played} onChange={handleChange} className="form-control" required>
          <option value="18">18</option>
          <option value="9">9</option>
        </select>
      </div>
      <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: 12, fontSize: 18 }}>
        {loading ? 'Submitting...' : 'Add Score'}
      </button>
    </form>
  );
};

export default AddScoreForm;
