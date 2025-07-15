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
      holes_played,
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
  // We'll build a list of 18-hole differentials, using the 2024 USGA method for 9-hole scores
  let handicap_index: number | null = null;
  let scoresWithDifferentials: any[] = [];
  let eighteenHoleDifferentials: { id: number, differential: number, holes_played: number, is_nine_hole: boolean, details: any }[] = [];

  // First, calculate differentials for all scores
  scoresWithDifferentials = scores.map(score => {
    const course = Array.isArray(score.courses) ? score.courses[0] : score.courses;
    let courseRating = score.holes_played === 9 ? course.course_rating / 2 : course.course_rating;
    let slopeRating = course.slope_rating; // usually the same for 9/18, but check your data
    const differential = calculateDifferential(score.gross_score, courseRating, slopeRating);
    return {
      ...score,
      course_name: course.name,
      course_rating: course.course_rating,
      slope_rating: course.slope_rating,
      differential,
      used_in_calculation: false,
      is_nine_hole: score.holes_played === 9
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

  // Build the list of 18-hole differentials, using the expected method for 9-hole scores
  // We need to recalculate the handicap index after each 9-hole score, so we process in chronological order (oldest to newest)
  const chronologicalScores = [...scoresWithDifferentials].sort((a, b) => new Date(a.date_played).getTime() - new Date(b.date_played).getTime());
  let runningDifferentials: number[] = [];
  let runningEighteenHoleDifferentials: { id: number, differential: number, holes_played: number, is_nine_hole: boolean, details: any }[] = [];
  let runningHandicapIndex: number | null = null;

  for (let i = 0; i < chronologicalScores.length; i++) {
    const score = chronologicalScores[i];
    if (score.holes_played === 18) {
      // 18-hole score, use as-is
      runningEighteenHoleDifferentials.push({
        id: score.id,
        differential: score.differential,
        holes_played: 18,
        is_nine_hole: false,
        details: score
      });
      runningDifferentials.push(score.differential);
    } else if (score.holes_played === 9) {
      // 9-hole score, use expected method
      // Use the current runningHandicapIndex (or 0 if not established yet)
      let expected_nine_hole = (runningHandicapIndex !== null) ? runningHandicapIndex / 2 : 0;
      // 18-hole differential = 9-hole differential + expected 9-hole differential
      let combined_differential = score.differential + expected_nine_hole;
      runningEighteenHoleDifferentials.push({
        id: score.id,
        differential: combined_differential,
        holes_played: 9,
        is_nine_hole: true,
        details: { ...score, expected_nine_hole, combined_differential }
      });
      runningDifferentials.push(combined_differential);
    }
    // After each score, recalculate the running handicap index (if at least 3 scores)
    if (runningDifferentials.length >= 3) {
      const sorted = [...runningDifferentials].sort((a, b) => a - b);
      const used = getUSGAScoresUsed(sorted.length);
      const lowest = sorted.slice(0, used);
      runningHandicapIndex = Math.round((lowest.reduce((sum, d) => sum + d, 0) / used) * 10) / 10;
    }
  }

  // Now, use the most recent runningHandicapIndex as the player's current index
  handicap_index = runningHandicapIndex;

  // Sort by differential (best first) for handicap calculation
  const sortedByDifferential = [...runningEighteenHoleDifferentials].sort((a, b) => a.differential - b.differential);
  const scoresUsed = getUSGAScoresUsed(sortedByDifferential.length);

  // Mark which scores are used in calculation
  let usedIds = new Set(sortedByDifferential.slice(0, scoresUsed).map(s => s.id));
  scoresWithDifferentials = scoresWithDifferentials.map(s => ({
    ...s,
    used_in_calculation: usedIds.has(s.id)
  }));

  // Calculate handicap index (average of lowest differentials)
  const lowestDifferentials = sortedByDifferential.slice(0, scoresUsed);
  const averageDifferential = lowestDifferentials.reduce((sum, score) => sum + score.differential, 0) / scoresUsed;
  handicap_index = Math.round(averageDifferential * 10) / 10; // Round to 1 decimal place

  return res.status(200).json({
    handicap_index,
    total_scores: sortedByDifferential.length,
    scores_used: scoresUsed,
    average_differential: handicap_index,
    scores: scoresWithDifferentials,
    minimum_scores_needed: 0,
    status: 'Handicap established',
    details: {
      differentials: sortedByDifferential,
      lowest_differentials: lowestDifferentials
    }
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
