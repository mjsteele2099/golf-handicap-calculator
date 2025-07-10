// USGA Handicap Calculation Logic (ported from Python)

export function calculateDifferential(grossScore: number, courseRating: number, slopeRating: number): number {
  return ((grossScore - courseRating) * 113) / slopeRating;
}

export function calculateHandicapIndex(differentials: number[]): number | null {
  const numScores = differentials.length;
  if (numScores < 3) return null;
  const sorted = [...differentials].sort((a, b) => a - b);
  let bestScores: number[] = [];
  let adjustment = 0;
  if (numScores === 20) { bestScores = sorted.slice(0, 8); adjustment = 0; }
  else if (numScores === 19) { bestScores = sorted.slice(0, 7); adjustment = 0; }
  else if (numScores >= 17) { bestScores = sorted.slice(0, 6); adjustment = 0; }
  else if (numScores >= 15) { bestScores = sorted.slice(0, 5); adjustment = 0; }
  else if (numScores >= 12) { bestScores = sorted.slice(0, 4); adjustment = 0; }
  else if (numScores >= 9) { bestScores = sorted.slice(0, 3); adjustment = 0; }
  else if (numScores >= 7) { bestScores = sorted.slice(0, 2); adjustment = 0; }
  else if (numScores === 6) { bestScores = sorted.slice(0, 2); adjustment = -1.0; }
  else if (numScores === 5) { bestScores = sorted.slice(0, 1); adjustment = 0; }
  else if (numScores === 4) { bestScores = sorted.slice(0, 1); adjustment = -1.0; }
  else if (numScores === 3) { bestScores = sorted.slice(0, 1); adjustment = -2.0; }
  else { return null; }
  const avg = bestScores.reduce((a, b) => a + b, 0) / bestScores.length;
  return Math.round((avg + adjustment) * 10) / 10;
}

export function calculateCourseHandicap(handicapIndex: number | null, slopeRating: number, courseRating: number, par: number): number | null {
  if (handicapIndex === null) return null;
  return Math.round((handicapIndex * slopeRating / 113) + (courseRating - par));
}
