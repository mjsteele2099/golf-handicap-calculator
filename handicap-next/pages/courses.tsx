import { useEffect, useState } from 'react';
import { TextInput, NumberInput, Loader, Text } from '@mantine/core';

export default function Courses() {
  const [courses, setCourses] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [par, setPar] = useState<number | string>(72);
  const [courseRating, setCourseRating] = useState<number | string>('');
  const [slopeRating, setSlopeRating] = useState<number | string>(113);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/courses')
      .then(res => res.json())
      .then(data => setCourses(Array.isArray(data) ? data : []));
  }, []);

  const addCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name, 
        par: Number(par), 
        course_rating: Number(courseRating), 
        slope_rating: Number(slopeRating) 
      })
    });
    if (res.ok) {
      const newCourse = await res.json();
      setCourses([...courses, newCourse]);
      setName('');
      setPar(72);
      setCourseRating('');
      setSlopeRating(113);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
      {/* Add Course Form */}
      <div className="card" style={{ flex: '1', minWidth: '320px' }}>
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="bi bi-geo" style={{ fontSize: '20px', color: '#667eea' }}></i>
          <h3 style={{ margin: 0, color: '#333', fontWeight: 600 }}>Add New Course</h3>
        </div>
        <form onSubmit={addCourse} style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '4px 0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontWeight: 500 }}>Course Name</label>
            <input
              type="text"
              className="form-control"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="Enter course name"
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontWeight: 500 }}>Par</label>
            <input
              type="number"
              className="form-control"
              value={par}
              onChange={e => setPar(e.target.value)}
              min={60}
              max={80}
              required
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontWeight: 500 }}>Course Rating</label>
            <input
              type="number"
              className="form-control"
              value={courseRating}
              onChange={e => setCourseRating(e.target.value)}
              step="0.1"
              min="50"
              max="80"
              required
              placeholder="e.g. 72.3"
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontWeight: 500 }}>Slope Rating</label>
            <input
              type="number"
              className="form-control"
              value={slopeRating}
              onChange={e => setSlopeRating(e.target.value)}
              min={55}
              max={155}
              required
            />
          </div>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%' }}
          >
            <i className="bi bi-plus-circle"></i>
            {loading ? 'Adding...' : 'Add Course'}
          </button>
        </form>
      </div>

      {/* Courses List */}
      <div className="card" style={{ flex: '2', minWidth: '320px' }}>
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="bi bi-list" style={{ fontSize: '20px', color: '#667eea' }}></i>
          <h3 style={{ margin: 0, color: '#333', fontWeight: 600 }}>Courses List</h3>
        </div>
        
        {loading && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Loader />
          </div>
        )}
        
        {courses.length === 0 && !loading && (
          <Text style={{ textAlign: 'center', color: '#6c757d', padding: '20px' }}>
            No courses yet. Add your first course using the form on the left.
          </Text>
        )}
        
        {courses.map((course) => (
          <div key={course.id} className="score-item">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <Text style={{ fontWeight: 700, marginBottom: '8px', fontSize: '16px' }}>
                  {course.name}
                </Text>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px' }}>
                  <div>
                    <Text style={{ fontSize: '12px', color: '#6c757d', fontWeight: 500 }}>PAR</Text>
                    <Text style={{ fontSize: '14px', fontWeight: 600 }}>{course.par}</Text>
                  </div>
                  <div>
                    <Text style={{ fontSize: '12px', color: '#6c757d', fontWeight: 500 }}>COURSE RATING</Text>
                    <Text style={{ fontSize: '14px', fontWeight: 600 }}>{course.course_rating}</Text>
                  </div>
                  <div>
                    <Text style={{ fontSize: '12px', color: '#6c757d', fontWeight: 500 }}>SLOPE RATING</Text>
                    <Text style={{ fontSize: '14px', fontWeight: 600 }}>{course.slope_rating}</Text>
                  </div>
                </div>
              </div>
              {/* Delete button removed */}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
