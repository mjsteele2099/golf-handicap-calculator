import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabaseClient';
import { calculateDifferential, calculateHandicapIndex } from '../../lib/handicap';

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
      par: course.par,
      differential,
      used_in_calculation: false
    };
  });

  const differentials = scoresWithDifferentials.map(s => s.differential);

  const handicap_index = calculateHandicapIndex(differentials);

  let scores_used = 0;
  let average_differential = null;
  let status = '';
  let minimum_scores_needed = 0;

  if (handicap_index !== null) {
    // Determine scores_used from the same logic as calculateHandicapIndex
    const numScores = differentials.length;
    if (numScores === 20) scores_used = 8;
    else if (numScores === 19) scores_used = 7;
    else if (numScores >= 17) scores_used = 6;
    else if (numScores >= 15) scores_used = 5;
    else if (numScores >= 12) scores_used = 4;
    else if (numScores >= 9) scores_used = 3;
    else if (numScores >= 7) scores_used = 2;
    else if (numScores === 6) scores_used = 2;
    else if (numScores === 5) scores_used = 1;
    else if (numScores === 4) scores_used = 1;
    else if (numScores === 3) scores_used = 1;

    // Mark used scores
    const sortedByDiff = [...scoresWithDifferentials].sort((a, b) => a.differential - b.differential);
    for (let i = 0; i < scores_used; i++) {
      sortedByDiff[i].used_in_calculation = true;
    }

    average_differential = handicap_index; // Since it's already adjusted
    status = 'Handicap established';
  } else {
    minimum_scores_needed = 3 - differentials.length;
    status = differentials.length < 3 ? `Need ${minimum_scores_needed} more score(s) to establish handicap` : 'Insufficient scores';
  }

  return res.status(200).json({
    handicap_index,
    total_scores: scores.length,
    scores_used,
    average_differential,
    scores: scoresWithDifferentials,
    minimum_scores_needed,
    status
  });
}