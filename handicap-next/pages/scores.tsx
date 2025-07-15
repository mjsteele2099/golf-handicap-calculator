import AddScoreForm from '../components/AddScoreForm';
import { useEffect, useState } from 'react';
import GolferAvatar from '../components/GolferList';

export default function Scores() {
  const [scores, setScores] = useState<any[]>([]);
  const [golfers, setGolfers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/scores')
      .then(res => res.json())
      .then(data => setScores(Array.isArray(data) ? data : []));
    fetch('/api/golfers')
      .then(res => res.json())
      .then(data => setGolfers(Array.isArray(data) ? data : []));
    fetch('/api/courses')
      .then(res => res.json())
      .then(data => setCourses(Array.isArray(data) ? data : []));
  }, []);

  const getGolfer = (id: number) => golfers.find((g: any) => g.id === id);
  const getGolferName = (id: number) => {
    const golfer = getGolfer(id);
    return golfer ? golfer.name : id;
  };
  const getGolferProfilePic = (id: number) => {
    const golfer = getGolfer(id);
    return golfer ? golfer.profile_picture : undefined;
  };
  const getCourseName = (id: number) => {
    const course = courses.find((c: any) => c.id === id);
    return course ? course.name : id;
  };

  return (
    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
      {/* Add Score Form */}
      <div className="card" style={{ flex: '1', minWidth: '350px' }}>
        <AddScoreForm />
      </div>
      {/* Recent Scores */}
      <div className="card" style={{ flex: '2', minWidth: '350px' }}>
        <h3 style={{ color: '#333', fontWeight: 600 }}>Recent Scores</h3>
        {scores.length === 0 ? (
          <p>No scores yet. Add your first score using the form on the left.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {scores.map((score, idx) => (
              <li key={score.id || idx} className="score-item" style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
                <GolferAvatar profile_picture={getGolferProfilePic(score.golfer_id)} name={getGolferName(score.golfer_id)} size={32} />
                <span style={{ fontWeight: 600, marginRight: 8 }}>{getGolferName(score.golfer_id)}</span>
                <span style={{ color: '#888', marginRight: 8 }}>|</span>
                <strong>Course:</strong> {getCourseName(score.course_id)} <span style={{ color: '#888', margin: '0 8px' }}>|</span>
                <strong>Gross:</strong> {score.gross_score} <span style={{ color: '#888', margin: '0 8px' }}>|</span>
                <strong>Date:</strong> {score.date_played} <span style={{ color: '#888', margin: '0 8px' }}>|</span>
                <strong>Holes:</strong> {score.holes_played || 18}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
