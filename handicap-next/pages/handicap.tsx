import { useEffect, useState } from 'react';
import { Select, Loader, Text } from '@mantine/core';

export default function Handicap() {
  const [golfers, setGolfers] = useState<any[]>([]);
  const [selectedGolfer, setSelectedGolfer] = useState('');
  const [handicapData, setHandicapData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/golfers')
      .then(res => res.json())
      .then(data => setGolfers(Array.isArray(data) ? data : []));
  }, []);

  const calculateHandicap = async (golferId: string) => {
    if (!golferId) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/handicap?golfer_id=${golferId}`);
      const data = await res.json();
      setHandicapData(data);
    } catch (error) {
      console.error('Error calculating handicap:', error);
      setHandicapData(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedGolfer) {
      calculateHandicap(selectedGolfer);
    } else {
      setHandicapData(null);
    }
  }, [selectedGolfer]);

  const selectedGolferData = golfers.find(g => g.id === Number(selectedGolfer));

  return (
    <div>
      {/* Golfer Selection */}
      <div className="card" style={{ marginBottom: '30px' }}>
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="bi bi-trophy" style={{ fontSize: '20px', color: '#667eea' }}></i>
          <h3 style={{ margin: 0, color: '#333', fontWeight: 600 }}>Calculate Handicap Index</h3>
        </div>
        <div style={{ maxWidth: '300px', display: 'flex', flexDirection: 'column', gap: '6px', padding: '4px 0' }}>
          <label style={{ fontWeight: 500 }}>Select Golfer</label>
          <select
            className="form-control"
            value={selectedGolfer}
            onChange={e => setSelectedGolfer(e.target.value)}
          >
            <option value="">Choose a golfer...</option>
            {golfers.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      {selectedGolfer && (
        <>
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Loader size="lg" />
              <Text style={{ marginTop: '20px', color: '#6c757d' }}>Calculating handicap...</Text>
            </div>
          )}

          {!loading && handicapData && (
            <>
              {/* Handicap Display */}
              <div className="handicap-display">
                <div style={{ marginBottom: '10px' }}>
                  <Text style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '5px' }}>
                    {selectedGolferData?.name}'s Handicap Index
                  </Text>
                </div>
                {handicapData.handicap_index !== null ? (
                  <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>
                    {handicapData.handicap_index.toFixed(1)}
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffc107' }}>
                      Not Established
                    </div>
                    <Text style={{ fontSize: '1rem', marginTop: '10px' }}>
                      {handicapData.status || 'Need more scores to establish handicap'}
                    </Text>
                  </div>
                )}
              </div>

              {/* USGA Compliance Notice */}
              <div className="card" style={{ marginBottom: '30px', background: '#f8f9ff', borderLeft: '4px solid #667eea' }}>
                <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="bi bi-info-circle" style={{ fontSize: '18px', color: '#667eea' }}></i>
                  <h4 style={{ margin: 0, color: '#667eea', fontWeight: 600 }}>USGA World Handicap System</h4>
                </div>
                <Text style={{ fontSize: '14px', color: '#5a6b7d', lineHeight: 1.5 }}>
                  This handicap calculation follows the official USGA World Handicap System rules. 
                  {handicapData.handicap_index !== null ? (
                    ` Using the lowest ${handicapData.scores_used} differential${handicapData.scores_used > 1 ? 's' : ''} from ${handicapData.total_scores} posted score${handicapData.total_scores > 1 ? 's' : ''}.`
                  ) : (
                    ` A minimum of 3 scores (54 holes) is required to establish a handicap index.`
                  )}
                </Text>
              </div>

              {/* Stats Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div className="stats-card">
                  <h3>{handicapData.total_scores || 0}</h3>
                  <p style={{ margin: 0 }}>Total Scores Posted</p>
                </div>
                <div className="stats-card">
                  <h3>{handicapData.scores_used || 0}</h3>
                  <p style={{ margin: 0 }}>Scores Used in Calculation</p>
                </div>
                <div className="stats-card" style={{
                  background: handicapData.handicap_index !== null 
                    ? 'linear-gradient(45deg, #28a745, #20c997)' 
                    : 'linear-gradient(45deg, #ffc107, #fd7e14)'
                }}>
                  <h3 style={{ fontSize: '1.8rem' }}>
                    {handicapData.handicap_index !== null ? 'ESTABLISHED' : `NEED ${handicapData.minimum_scores_needed || 0}`}
                  </h3>
                  <p style={{ margin: 0 }}>
                    {handicapData.handicap_index !== null ? 'Handicap Status' : 'More Scores'}
                  </p>
                </div>
              </div>

              {/* Score Details */}
              {handicapData.scores && handicapData.scores.length > 0 && (
                <div className="card">
                  <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="bi bi-list-check" style={{ fontSize: '20px', color: '#667eea' }}></i>
                      <h3 style={{ margin: 0, color: '#333', fontWeight: 600 }}>Score History</h3>
                    </div>
                    <Text style={{ fontSize: '12px', color: '#6c757d', fontWeight: 500 }}>
                      ✓ = Used in handicap calculation
                    </Text>
                  </div>

                  {handicapData.scores.map((score: any, index: number) => (
                    <div
                      key={index}
                      className="score-item"
                      style={{
                        borderLeft: score.used_in_calculation ? '4px solid #28a745' : '4px solid #667eea',
                        background: score.used_in_calculation ? '#f8fff9' : '#f8f9fa'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <Text style={{ fontWeight: 700, fontSize: '16px' }}>
                              {score.course_name}
                            </Text>
                            {score.used_in_calculation && (
                              <span style={{
                                background: '#28a745',
                                color: 'white',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '10px',
                                fontWeight: 600
                              }}>
                                COUNTED
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '8px' }}>
                            <div>
                              <Text style={{ fontSize: '12px', color: '#6c757d', fontWeight: 500 }}>GROSS SCORE</Text>
                              <Text style={{ fontSize: '14px', fontWeight: 600 }}>{score.gross_score}</Text>
                            </div>
                            <div>
                              <Text style={{ fontSize: '12px', color: '#6c757d', fontWeight: 500 }}>DIFFERENTIAL</Text>
                              <Text style={{ fontSize: '14px', fontWeight: 600 }}>{score.differential.toFixed(1)}</Text>
                            </div>
                            <div>
                              <Text style={{ fontSize: '12px', color: '#6c757d', fontWeight: 500 }}>DATE</Text>
                              <Text style={{ fontSize: '14px', fontWeight: 600 }}>
                                {new Date(score.date_played).toLocaleDateString()}
                              </Text>
                            </div>
                            <div>
                              <Text style={{ fontSize: '12px', color: '#6c757d', fontWeight: 500 }}>COURSE RATING</Text>
                              <Text style={{ fontSize: '14px', fontWeight: 600 }}>{score.course_rating}</Text>
                            </div>
                            <div>
                              <Text style={{ fontSize: '12px', color: '#6c757d', fontWeight: 500 }}>SLOPE</Text>
                              <Text style={{ fontSize: '14px', fontWeight: 600 }}>{score.slope_rating}</Text>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* No Scores Message */}
              {(!handicapData.scores || handicapData.scores.length === 0) && (
                <div className="alert alert-warning">
                  <h5 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="bi bi-exclamation-triangle"></i>
                    No Scores Found
                  </h5>
                  <p style={{ margin: 0 }}>
                    This golfer hasn't recorded any scores yet. Add some scores to calculate their handicap index.
                    According to USGA rules, a minimum of 3 scores (54 holes) is required to establish a handicap.
                  </p>
                </div>
              )}
            </>
          )}

          {!loading && !handicapData && (
            <div className="alert alert-warning">
              <h5 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="bi bi-exclamation-triangle"></i>
                Unable to Calculate Handicap
              </h5>
              <p style={{ margin: 0 }}>
                There was an error calculating the handicap for this golfer. Please try again.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
} 