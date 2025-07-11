import { useEffect, useState } from 'react';
import { Text } from '@mantine/core';
import Link from 'next/link';

export default function Home() {
  const [stats, setStats] = useState({
    totalGolfers: 0,
    totalCourses: 0,
    totalScores: 0,
    recentScores: [] as any[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/golfers').then(res => res.json()),
      fetch('/api/courses').then(res => res.json()),
      fetch('/api/scores').then(res => res.json())
    ]).then(([golfers, courses, scores]) => {
      const golferMap = golfers.reduce((map: Record<number, string>, golfer: { id: number; name: string }) => {
        map[golfer.id] = golfer.name;
        return map;
      }, {});
      setStats({
        totalGolfers: Array.isArray(golfers) ? golfers.length : 0,
        totalCourses: Array.isArray(courses) ? courses.length : 0,
        totalScores: Array.isArray(scores) ? scores.length : 0,
        recentScores: Array.isArray(scores) ? scores.slice(-5).reverse().map(score => ({
          ...score,
          golfer_name: golferMap[score.golfer_id] || 'Unknown Golfer'
        })) : []
      });
      setLoading(false);
    });
  }, []);

  return (
    <div>
      {/* Welcome Message */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <Text style={{ fontSize: '1.25rem', color: '#6c757d', marginBottom: '20px' }}>
          Welcome to your Golf Handicap Calculator! Track your progress and calculate accurate handicap indexes.
        </Text>
      </div>

      {/* Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div className="stats-card">
          <h3>{stats.totalGolfers}</h3>
          <p style={{ margin: 0 }}>Registered Golfers</p>
        </div>
        <div className="stats-card">
          <h3>{stats.totalCourses}</h3>
          <p style={{ margin: 0 }}>Golf Courses</p>
        </div>
        <div className="stats-card">
          <h3>{stats.totalScores}</h3>
          <p style={{ margin: 0 }}>Total Scores</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginBottom: '30px' }}>
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="bi bi-lightning" style={{ fontSize: '20px', color: '#667eea' }}></i>
          <h3 style={{ margin: 0, color: '#333', fontWeight: 600 }}>Quick Actions</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <Link href="/golfers" style={{ textDecoration: 'none' }}>
            <div 
              className="btn-primary" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                padding: '15px',
                width: '100%',
                cursor: 'pointer'
              }}
            >
              <i className="bi bi-person-plus" style={{ marginRight: '8px' }}></i>
              Add New Golfer
            </div>
          </Link>
          <Link href="/courses" style={{ textDecoration: 'none' }}>
            <div 
              className="btn-primary" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                padding: '15px',
                width: '100%',
                cursor: 'pointer'
              }}
            >
              <i className="bi bi-geo" style={{ marginRight: '8px' }}></i>
              Add New Course
            </div>
          </Link>
          <Link href="/scores" style={{ textDecoration: 'none' }}>
            <div 
              className="btn-primary" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                padding: '15px',
                width: '100%',
                cursor: 'pointer'
              }}
            >
              <i className="bi bi-plus-circle" style={{ marginRight: '8px' }}></i>
              Record New Score
            </div>
          </Link>
          <Link href="/handicap" style={{ textDecoration: 'none' }}>
            <div 
              className="btn-primary" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                padding: '15px',
                width: '100%',
                cursor: 'pointer'
              }}
            >
              <i className="bi bi-trophy" style={{ marginRight: '8px' }}></i>
              Calculate Handicap
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      {stats.recentScores.length > 0 && (
        <div className="card">
          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="bi bi-clock-history" style={{ fontSize: '20px', color: '#667eea' }}></i>
            <h3 style={{ margin: 0, color: '#333', fontWeight: 600 }}>Recent Activity</h3>
          </div>
          <Text style={{ color: '#6c757d', marginBottom: '15px' }}>
            Latest scores added to the system
          </Text>
          {stats.recentScores.map((score: any, index) => (
            <div key={index} className="score-item" style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text style={{ fontWeight: 600, marginBottom: '4px' }}>
                    {score.golfer_name} recorded a score
                  </Text>
                  <Text style={{ fontSize: '14px', color: '#6c757d' }}>
                    Score: {score.gross_score} • {new Date(score.date_played).toLocaleDateString()}
                  </Text>
                </div>
                <i className="bi bi-activity" style={{ color: '#667eea', fontSize: '20px' }}></i>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Getting Started */}
      {stats.totalGolfers === 0 && (
        <div className="alert alert-warning">
          <h5 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="bi bi-info-circle"></i>
            Getting Started
          </h5>
          <p style={{ margin: '0 0 15px 0' }}>
            Welcome! To get started with your handicap calculator:
          </p>
          <ol style={{ margin: 0, paddingLeft: '20px' }}>
            <li>Add golfers to the system</li>
            <li>Add golf courses you play</li>
            <li>Record scores for each round</li>
            <li>Calculate handicap indexes</li>
          </ol>
        </div>
      )}
    </div>
  );
} 