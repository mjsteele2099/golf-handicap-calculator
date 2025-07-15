import AddScoreForm from '../components/AddScoreForm';
import { useEffect, useState } from 'react';

export default function Scores() {
  const [scores, setScores] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/scores')
      .then(res => res.json())
      .then(data => setScores(Array.isArray(data) ? data : []));
  }, []);

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
              <li key={score.id || idx} className="score-item">
                <strong>Golfer:</strong> {score.golfer_id} | <strong>Course:</strong> {score.course_id} | <strong>Gross:</strong> {score.gross_score} | <strong>Date:</strong> {score.date_played} | <strong>Holes:</strong> {score.holes_played || 18}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
