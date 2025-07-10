import { useEffect, useState } from 'react';
import { Select, Loader, Text } from '@mantine/core';

export default function Scores() {
  const [golfers, setGolfers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  const [selectedGolfer, setSelectedGolfer] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [grossScore, setGrossScore] = useState('');
  const [datePlayed, setDatePlayed] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [courseMethod, setCourseMethod] = useState('existing');
  const [manualCourseName, setManualCourseName] = useState('');
  const [manualPar, setManualPar] = useState('72');
  const [manualCourseRating, setManualCourseRating] = useState('');
  const [manualSlopeRating, setManualSlopeRating] = useState('113');

  useEffect(() => {
    Promise.all([
      fetch('/api/golfers').then(res => res.json()),
      fetch('/api/courses').then(res => res.json()),
      fetch('/api/scores').then(res => res.json())
    ]).then(([golfersData, coursesData, scoresData]) => {
      setGolfers(Array.isArray(golfersData) ? golfersData : []);
      setCourses(Array.isArray(coursesData) ? coursesData : []);
      setScores(Array.isArray(scoresData) ? scoresData : []);
    });
  }, []);

  const addScore = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let courseData;
    if (courseMethod === 'existing') {
      const course = courses.find(c => c.id === Number(selectedCourse));
      if (!course) {
        setLoading(false);
        return;
      }
      courseData = course;
    } else {
      // Create new course first
      const courseRes = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: manualCourseName,
          par: Number(manualPar),
          course_rating: Number(manualCourseRating),
          slope_rating: Number(manualSlopeRating)
        })
      });
      if (!courseRes.ok) {
        setLoading(false);
        return;
      }
      courseData = await courseRes.json();
      setCourses([...courses, courseData]);
    }

    const res = await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        golfer_id: Number(selectedGolfer),
        course_id: courseData.id,
        gross_score: Number(grossScore),
        date_played: datePlayed
      })
    });

    if (res.ok) {
      const newScore = await res.json();
      setScores([...scores, newScore]);
      setSelectedGolfer('');
      setSelectedCourse('');
      setGrossScore('');
      setDatePlayed(new Date().toISOString().split('T')[0]);
      setManualCourseName('');
      setManualCourseRating('');
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
      {/* Add Score Form */}
      <div className="card" style={{ flex: '1', minWidth: '350px' }}>
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="bi bi-plus-circle" style={{ fontSize: '20px', color: '#667eea' }}></i>
          <h3 style={{ margin: 0, color: '#333', fontWeight: 600 }}>Add New Score</h3>
        </div>
        <form onSubmit={addScore} style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '4px 0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontWeight: 500 }}>Golfer</label>
            <select
              className="form-control"
              value={selectedGolfer}
              onChange={e => setSelectedGolfer(e.target.value)}
              required
            >
              <option value="">Select Golfer</option>
              {golfers.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          {/* Course Entry Method Toggle */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>Course Entry Method</label>
            <div style={{ display: 'flex', gap: '5px' }}>
              <button
                type="button"
                className={courseMethod === 'existing' ? 'btn-primary' : ''}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: courseMethod === 'existing' ? 'none' : '2px solid #e9ecef',
                  borderRadius: '10px',
                  background: courseMethod === 'existing' ? undefined : '#f8f9fa',
                  color: courseMethod === 'existing' ? undefined : '#667eea',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                onClick={() => setCourseMethod('existing')}
              >
                Select Existing Course
              </button>
              <button
                type="button"
                className={courseMethod === 'manual' ? 'btn-primary' : ''}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: courseMethod === 'manual' ? 'none' : '2px solid #e9ecef',
                  borderRadius: '10px',
                  background: courseMethod === 'manual' ? undefined : '#f8f9fa',
                  color: courseMethod === 'manual' ? undefined : '#667eea',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                onClick={() => setCourseMethod('manual')}
              >
                Enter Course Details
              </button>
            </div>
          </div>

          {/* Existing Course Selection */}
          {courseMethod === 'existing' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontWeight: 500 }}>Course</label>
              <select
                className="form-control"
                value={selectedCourse}
                onChange={e => setSelectedCourse(e.target.value)}
                required
              >
                <option value="">Select Course</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Manual Course Entry */}
          {courseMethod === 'manual' && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontWeight: 500 }}>Course Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={manualCourseName}
                  onChange={e => setManualCourseName(e.target.value)}
                  required
                  placeholder="Enter course name"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontWeight: 500 }}>Par</label>
                  <input
                    type="number"
                    className="form-control"
                    value={manualPar}
                    onChange={e => setManualPar(e.target.value)}
                    min="60"
                    max="80"
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontWeight: 500 }}>Slope</label>
                  <input
                    type="number"
                    className="form-control"
                    value={manualSlopeRating}
                    onChange={e => setManualSlopeRating(e.target.value)}
                    min="55"
                    max="155"
                    required
                  />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontWeight: 500 }}>Course Rating</label>
                <input
                  type="number"
                  className="form-control"
                  value={manualCourseRating}
                  onChange={e => setManualCourseRating(e.target.value)}
                  step="0.1"
                  min="50"
                  max="80"
                  required
                  placeholder="e.g. 72.3"
                />
              </div>
            </>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontWeight: 500 }}>Gross Score</label>
            <input
              type="number"
              className="form-control"
              value={grossScore}
              onChange={e => setGrossScore(e.target.value)}
              min="40"
              max="150"
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontWeight: 500 }}>Date Played</label>
            <input
              type="date"
              className="form-control"
              value={datePlayed}
              onChange={e => setDatePlayed(e.target.value)}
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
            {loading ? 'Adding...' : 'Add Score'}
          </button>
        </form>
      </div>

      {/* Scores List */}
      <div className="card" style={{ flex: '2', minWidth: '400px' }}>
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="bi bi-list" style={{ fontSize: '20px', color: '#667eea' }}></i>
          <h3 style={{ margin: 0, color: '#333', fontWeight: 600 }}>Recent Scores</h3>
        </div>
        
        {loading && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Loader />
          </div>
        )}
        
        {scores.length === 0 && !loading && (
          <Text style={{ textAlign: 'center', color: '#6c757d', padding: '20px' }}>
            No scores yet. Add your first score using the form on the left.
          </Text>
        )}
        
        {scores.slice().reverse().map((score) => {
          const golfer = golfers.find(g => g.id === score.golfer_id);
          const course = courses.find(c => c.id === score.course_id);
          
          return (
            <div key={score.id} className="score-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <Text style={{ fontWeight: 700, marginBottom: '4px', fontSize: '16px' }}>
                    {golfer?.name || 'Unknown Golfer'}
                  </Text>
                  <Text style={{ fontWeight: 600, color: '#667eea', marginBottom: '8px' }}>
                    {course?.name || 'Unknown Course'}
                  </Text>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '8px' }}>
                    <div>
                      <Text style={{ fontSize: '12px', color: '#6c757d', fontWeight: 500 }}>GROSS SCORE</Text>
                      <Text style={{ fontSize: '14px', fontWeight: 600 }}>{score.gross_score}</Text>
                    </div>
                    <div>
                      <Text style={{ fontSize: '12px', color: '#6c757d', fontWeight: 500 }}>DIFFERENTIAL</Text>
                      <Text style={{ fontSize: '14px', fontWeight: 600 }}>
                        {score.differential ? score.differential.toFixed(1) : 'N/A'}
                      </Text>
                    </div>
                    <div>
                      <Text style={{ fontSize: '12px', color: '#6c757d', fontWeight: 500 }}>DATE</Text>
                      <Text style={{ fontSize: '14px', fontWeight: 600 }}>
                        {new Date(score.date_played).toLocaleDateString()}
                      </Text>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
