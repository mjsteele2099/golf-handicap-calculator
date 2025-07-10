import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  
  const { golfer_id } = req.query;
  if (!golfer_id) return res.status(400).json({ error: 'golfer_id required' });

  // Get all scores for golfer with course information
  const { data: scores, error: scoreError } = await supabase
    .from('scores')
    .select(`
      id,
      gross_score, 
      date_played,
      courses!inner (
        id,
        name,
        course_rating,
        slope_rating,
        par
      )
    `)
    .eq('golfer_id', golfer_id)
    .order('date_played', { ascending: false });

  if (scoreError) return res.status(500).json({ error: scoreError.message });
  if (!scores || scores.length === 0) {
    return res.status(200).json({
      handicap_index: null,
      total_scores: 0,
      scores_used: 0,
      average_differential: null,
      scores: [],
      minimum_scores_needed: 3,
      status: 'No scores posted yet'
    });
  }

  // Calculate differentials for each score
  const scoresWithDifferentials = scores.map(score => {
    const course = Array.isArray(score.courses) ? score.courses[0] : score.courses;
    const differential = calculateDifferential(
      score.gross_score, 
      course.course_rating, 
      course.slope_rating
    );
    
    return {
      ...score,
      course_name: course.name,
      course_rating: course.course_rating,
      slope_rating: course.slope_rating,
      differential,
      used_in_calculation: false
    };
  });

  // Check minimum scores requirement (USGA: minimum 3 scores for establishment)
  if (scores.length < 3) {
    return res.status(200).json({
      handicap_index: null,
      total_scores: scores.length,
      scores_used: 0,
      average_differential: null,
      scores: scoresWithDifferentials,
      minimum_scores_needed: 3 - scores.length,
      status: `Need ${3 - scores.length} more score(s) to establish handicap`
    });
  }

  // Sort by differential (best first) for handicap calculation
  const sortedByDifferential = [...scoresWithDifferentials].sort((a, b) => a.differential - b.differential);
  
  // Determine how many scores to use based on USGA World Handicap System rules
  const scoresUsed = getUSGAScoresUsed(scores.length);
  
  // Mark which scores are used in calculation
  for (let i = 0; i < scoresUsed; i++) {
    const scoreId = sortedByDifferential[i].id;
    const scoreIndex = scoresWithDifferentials.findIndex(s => s.id === scoreId);
    if (scoreIndex >= 0) {
      scoresWithDifferentials[scoreIndex].used_in_calculation = true;
    }
  }

  // Calculate handicap index (average of lowest differentials)
  const lowestDifferentials = sortedByDifferential.slice(0, scoresUsed);
  const averageDifferential = lowestDifferentials.reduce((sum, score) => sum + score.differential, 0) / scoresUsed;
  const handicap_index = Math.round(averageDifferential * 10) / 10; // Round to 1 decimal place

  return res.status(200).json({
    handicap_index,
    total_scores: scores.length,
    scores_used: scoresUsed,
    average_differential: handicap_index,
    scores: scoresWithDifferentials,
    minimum_scores_needed: 0,
    status: 'Handicap established'
  });
}

// Get number of scores to use according to USGA World Handicap System
function getUSGAScoresUsed(totalScores: number): number {
  if (totalScores >= 20) return 8;
  if (totalScores === 19) return 7;
  if (totalScores >= 17) return 6;
  if (totalScores >= 15) return 5;
  if (totalScores >= 12) return 4;
  if (totalScores >= 9) return 3;
  if (totalScores >= 6) return 2;
  if (totalScores >= 3) return 1;
  return 0; // Should not reach here with proper validation
}

// Calculate differential according to USGA formula
function calculateDifferential(grossScore: number, courseRating: number, slopeRating: number): number {
  return ((grossScore - courseRating) * 113) / slopeRating;
}
