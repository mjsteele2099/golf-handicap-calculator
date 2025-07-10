import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('scores').select('*');
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }
  if (req.method === 'POST') {
    const { golfer_id, course_id, gross_score, date_played } = req.body;
    if (!golfer_id || !course_id || !gross_score || !date_played) return res.status(400).json({ error: 'Missing required fields' });
    const { data, error } = await supabase.from('scores').insert([{ golfer_id, course_id, gross_score, date_played }]).select();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data?.[0]);
  }
  if (req.method === 'PUT') {
    const { id, golfer_id, course_id, gross_score, date_played } = req.body;
    if (!id) return res.status(400).json({ error: 'ID is required' });
    const { data, error } = await supabase.from('scores').update({ golfer_id, course_id, gross_score, date_played }).eq('id', id).select();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data?.[0]);
  }
  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'ID is required' });
    const { error } = await supabase.from('scores').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).end();
  }
  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
