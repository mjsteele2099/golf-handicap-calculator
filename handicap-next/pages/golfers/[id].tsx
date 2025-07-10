import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Avatar, Loader, Text } from '@mantine/core';
import Link from 'next/link';

interface Score {
  id: number;
  course_name: string;
  score: number;
  date_played: string;
  course_rating: number;
  slope_rating: number;
  par: number;
}

interface GolferProfile {
  id: number;
  name: string;
  email: string;
  profile_picture: string;
  handicap_index: number | null;
  total_scores: number;
  scores_used: number;
  status: string;
  scores: Score[];
}

export default function GolferProfile() {
  const router = useRouter();
  const { id } = router.query;
  const [golfer, setGolfer] = useState<GolferProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchGolferProfile();
    }
  }, [id]);

  const fetchGolferProfile = async () => {
    try {
      setLoading(true);
      
      // Fetch golfer basic info
      const golferRes = await fetch('/api/golfers');
      if (!golferRes.ok) {
        throw new Error(`Failed to fetch golfers: ${golferRes.status}`);
      }
      const golfers = await golferRes.json();
      const currentGolfer = golfers.find((g: any) => g.id === parseInt(id as string));
      
      if (!currentGolfer) {
        setError('Golfer not found');
        setLoading(false);
        return;
      }

      // Fetch handicap info
      const handicapRes = await fetch(`/api/handicap?golfer_id=${id}`);
      if (!handicapRes.ok) {
        throw new Error(`Failed to fetch handicap: ${handicapRes.status}`);
      }
      const handicapData = await handicapRes.json();
      
      // Fetch scores with course information
      const scoresRes = await fetch('/api/scores');
      if (!scoresRes.ok) {
        throw new Error(`Failed to fetch scores: ${scoresRes.status}`);
      }
      const allScores = await scoresRes.json();
      const rawGolferScores = Array.isArray(allScores) 
        ? allScores.filter((score: any) => score.golfer_id === parseInt(id as string))
        : [];

      // Fetch courses to join with scores
      const coursesRes = await fetch('/api/courses');
      if (!coursesRes.ok) {
        throw new Error(`Failed to fetch courses: ${coursesRes.status}`);
      }
      const courses = await coursesRes.json();
      const coursesMap = Array.isArray(courses) 
        ? courses.reduce((map: any, course: any) => {
            map[course.id] = course;
            return map;
          }, {})
        : {};

      // Join scores with course information
      const golferScores = rawGolferScores.map((score: any) => {
        const course = coursesMap[score.course_id] || {};
        return {
          ...score,
          course_name: course.name || 'Unknown Course',
          course_rating: course.course_rating || 72,
          slope_rating: course.slope_rating || 113,
          par: course.par || 72,
          score: score.gross_score || score.score || 0
        };
      });

      // Sort scores by date (newest first)
      golferScores.sort((a: any, b: any) => new Date(b.date_played).getTime() - new Date(a.date_played).getTime());

      setGolfer({
        ...currentGolfer,
        handicap_index: handicapData.handicap_index,
        total_scores: handicapData.total_scores || 0,
        scores_used: handicapData.scores_used || 0,
        status: handicapData.status || 'No scores posted',
        scores: golferScores
      });
      
    } catch (error) {
      console.error('Error fetching golfer profile:', error);
      setError('Failed to load golfer profile');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateStats = () => {
    if (!golfer?.scores || golfer.scores.length === 0) return null;
    
    const scores = golfer.scores.map(s => s.score);
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const bestScore = Math.min(...scores);
    const worstScore = Math.max(...scores);
    
    return {
      average: avgScore.toFixed(1),
      best: bestScore,
      worst: worstScore,
      total: scores.length
    };
  };

  const getHandicapStatusColor = () => {
    if (golfer?.handicap_index !== null) return '#28a745';
    if (golfer?.total_scores > 0) return '#ffc107';
    return '#6c757d';
  };

  // Helper to get the full Supabase public URL for profile pictures
  const getProfilePicUrl = (profile_picture: string | null | undefined) => {
    if (!profile_picture) return '/default_profile.png';
    if (profile_picture.startsWith('http')) return profile_picture;
    // Use your Supabase project and bucket name
    return `https://bfhlpicxwuftctjzqyhe.supabase.co/storage/v1/object/public/profile-pics/${profile_picture}`;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Loader />
        <Text style={{ marginTop: '20px' }}>Loading golfer profile...</Text>
      </div>
    );
  }

  if (error || !golfer) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '50px' }}>
        <i className="bi bi-exclamation-triangle" style={{ fontSize: '48px', color: '#dc3545', marginBottom: '20px' }}></i>
        <Text style={{ fontSize: '18px', marginBottom: '20px' }}>{error || 'Golfer not found'}</Text>
        <Link href="/golfers">
          <button className="btn-primary">
            <i className="bi bi-arrow-left"></i>
            Back to Golfers
          </button>
        </Link>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header with back button */}
      <div style={{ marginBottom: '20px' }}>
        <Link href="/golfers">
          <button className="btn-primary" style={{ marginBottom: '20px' }}>
            <i className="bi bi-arrow-left"></i>
            Back to Golfers
          </button>
        </Link>
      </div>

      {/* Profile Header */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <img
            src={getProfilePicUrl(golfer.profile_picture)}
            alt="Profile"
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              objectFit: 'cover',
              background: '#fff',
              minWidth: 80,
              maxWidth: 80,
              overflow: 'hidden',
              border: '1px solid #eee'
            }}
          />
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, marginBottom: '8px', color: '#333' }}>{golfer.name}</h1>
            <Text style={{ fontSize: '16px', color: '#6c757d', marginBottom: '8px' }}>
              {golfer.email || 'No email provided'}
            </Text>
            <Text 
              style={{ 
                fontSize: '16px', 
                color: getHandicapStatusColor(), 
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <i className={`bi ${golfer.handicap_index !== null ? 'bi-check-circle-fill' : golfer.total_scores > 0 ? 'bi-clock-fill' : 'bi-dash-circle'}`}></i>
              {golfer.handicap_index !== null ? `Handicap Index: ${golfer.handicap_index.toFixed(1)}` : golfer.status}
            </Text>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {/* Statistics Card */}
        {stats && (
          <div className="card">
            <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="bi bi-graph-up" style={{ fontSize: '20px', color: '#667eea' }}></i>
              <h3 style={{ margin: 0, color: '#333', fontWeight: 600 }}>Statistics</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '10px' }}>
                <Text style={{ fontSize: '24px', fontWeight: 700, color: '#667eea' }}>{stats.total}</Text>
                <Text style={{ fontSize: '14px', color: '#6c757d' }}>Total Rounds</Text>
              </div>
              <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '10px' }}>
                <Text style={{ fontSize: '24px', fontWeight: 700, color: '#28a745' }}>{stats.average}</Text>
                <Text style={{ fontSize: '14px', color: '#6c757d' }}>Average Score</Text>
              </div>
              <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '10px' }}>
                <Text style={{ fontSize: '24px', fontWeight: 700, color: '#17a2b8' }}>{stats.best}</Text>
                <Text style={{ fontSize: '14px', color: '#6c757d' }}>Best Round</Text>
              </div>
              <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '10px' }}>
                <Text style={{ fontSize: '24px', fontWeight: 700, color: '#dc3545' }}>{stats.worst}</Text>
                <Text style={{ fontSize: '14px', color: '#6c757d' }}>Worst Round</Text>
              </div>
            </div>
          </div>
        )}

        {/* USGA Status Card */}
        <div className="card">
          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="bi bi-award" style={{ fontSize: '20px', color: '#667eea' }}></i>
            <h3 style={{ margin: 0, color: '#333', fontWeight: 600 }}>USGA Handicap Status</h3>
          </div>
          <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '10px' }}>
            {golfer.handicap_index !== null ? (
              <div>
                <Text style={{ fontSize: '18px', fontWeight: 600, color: '#28a745', marginBottom: '8px' }}>
                  <i className="bi bi-check-circle-fill"></i> Handicap Established
                </Text>
                <Text style={{ fontSize: '16px', marginBottom: '8px' }}>
                  <strong>Index:</strong> {golfer.handicap_index.toFixed(1)}
                </Text>
                <Text style={{ fontSize: '14px', color: '#6c757d' }}>
                  Based on {golfer.scores_used} of {golfer.total_scores} scores
                </Text>
              </div>
            ) : golfer.total_scores > 0 ? (
              <div>
                <Text style={{ fontSize: '18px', fontWeight: 600, color: '#ffc107', marginBottom: '8px' }}>
                  <i className="bi bi-clock-fill"></i> In Progress
                </Text>
                <Text style={{ fontSize: '14px', color: '#6c757d' }}>
                  {golfer.total_scores}/3 scores posted<br/>
                  Need {3 - golfer.total_scores} more score{3 - golfer.total_scores !== 1 ? 's' : ''} to establish handicap
                </Text>
              </div>
            ) : (
              <div>
                <Text style={{ fontSize: '18px', fontWeight: 600, color: '#6c757d', marginBottom: '8px' }}>
                  <i className="bi bi-dash-circle"></i> No Scores Posted
                </Text>
                <Text style={{ fontSize: '14px', color: '#6c757d' }}>
                  Post 3 scores (54 holes) to establish handicap index
                </Text>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scores History */}
      <div className="card" style={{ marginTop: '20px' }}>
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="bi bi-list-ol" style={{ fontSize: '20px', color: '#667eea' }}></i>
          <h3 style={{ margin: 0, color: '#333', fontWeight: 600 }}>Score History</h3>
        </div>
        
        {golfer.scores.length === 0 ? (
          <Text style={{ textAlign: 'center', color: '#6c757d', padding: '40px' }}>
            No scores posted yet. Start tracking your golf rounds!
          </Text>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Date</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Course</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Score</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Par</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>+/-</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Rating</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Slope</th>
                </tr>
              </thead>
              <tbody>
                {golfer.scores.map((score, index) => (
                  <tr key={score.id} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa' }}>
                    <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                      {formatDate(score.date_played)}
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6', fontWeight: 600 }}>
                      {score.course_name}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #dee2e6', fontWeight: 700, fontSize: '16px' }}>
                      {score.score}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>
                      {score.par}
                    </td>
                    <td style={{ 
                      padding: '12px', 
                      textAlign: 'center', 
                      borderBottom: '1px solid #dee2e6',
                      color: score.score - score.par === 0 ? '#28a745' : score.score - score.par < 0 ? '#17a2b8' : '#dc3545',
                      fontWeight: 600
                    }}>
                      {score.score - score.par > 0 ? '+' : ''}{score.score - score.par}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>
                      {score.course_rating.toFixed(1)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>
                      {score.slope_rating}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 