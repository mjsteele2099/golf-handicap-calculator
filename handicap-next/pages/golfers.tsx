import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { TextInput, FileInput, Loader, Group, Avatar, Text } from '@mantine/core';
import { IconUserPlus, IconPhoto, IconEye, IconUsers, IconUpload } from '@tabler/icons-react';
import Link from 'next/link';

export default function Golfers() {
  const [golfers, setGolfers] = useState<any[]>([]);
  const [golfersWithHandicaps, setGolfersWithHandicaps] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editProfilePic, setEditProfilePic] = useState('');
  const [editFile, setEditFile] = useState<File | null>(null);

  useEffect(() => {
    fetchGolfers();
  }, []);

  const fetchGolfers = async () => {
    try {
      const res = await fetch('/api/golfers');
      const data = await res.json();
      const golfersArray = Array.isArray(data) ? data : [];
      setGolfers(golfersArray);
      
      // Fetch handicap status for each golfer
      const golfersWithHandicapData = await Promise.all(
        golfersArray.map(async (golfer) => {
          try {
            const handicapRes = await fetch(`/api/handicap?golfer_id=${golfer.id}`);
            const handicapData = await handicapRes.json();
            return {
              ...golfer,
              handicap_index: handicapData.handicap_index,
              total_scores: handicapData.total_scores || 0,
              scores_used: handicapData.scores_used || 0,
              status: handicapData.status || 'No scores posted'
            };
          } catch {
            return {
              ...golfer,
              handicap_index: null,
              total_scores: 0,
              scores_used: 0,
              status: 'No scores posted'
            };
          }
        })
      );
      
      setGolfersWithHandicaps(golfersWithHandicapData);
    } catch (error) {
      console.error('Error fetching golfers:', error);
      setGolfers([]);
      setGolfersWithHandicaps([]);
    }
  };

  const addGolfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    let profile_picture = null;
    if (file) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const { data, error } = await supabase.storage.from('profile-pics').upload(fileName, file);
      if (!error && data) {
        const { publicUrl } = supabase.storage.from('profile-pics').getPublicUrl(fileName).data;
        profile_picture = publicUrl;
      }
    }
    const res = await fetch('/api/golfers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, profile_picture })
    });
    if (res.ok) {
      setName('');
      setEmail('');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      // Refresh the golfers list to include handicap data
      await fetchGolfers();
    }
    setLoading(false);
  };

  const startEdit = (g: any) => {
    setEditId(g.id);
    setEditName(g.name);
    setEditEmail(g.email || '');
    setEditProfilePic(g.profile_picture || '');
    setEditFile(null);
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditName('');
    setEditEmail('');
    setEditProfilePic('');
    setEditFile(null);
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    let profile_picture = editProfilePic;
    if (editFile) {
      const fileExt = editFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const { data, error } = await supabase.storage.from('profile-pics').upload(fileName, editFile);
      if (!error && data) {
        const { publicUrl } = supabase.storage.from('profile-pics').getPublicUrl(fileName).data;
        profile_picture = publicUrl;
      }
    }
    const res = await fetch('/api/golfers', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editId, name: editName, email: editEmail, profile_picture })
    });
    if (res.ok) {
      cancelEdit();
      // Refresh the golfers list
      await fetchGolfers();
    }
    setLoading(false);
  };

  const deleteGolfer = async (id: number) => {
    setLoading(true);
    await fetch('/api/golfers', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    // Refresh the golfers list
    await fetchGolfers();
    setLoading(false);
  };

  const getHandicapStatusColor = (golfer: any) => {
    if (golfer.handicap_index !== null) return '#28a745'; // Green for established
    if (golfer.total_scores > 0) return '#ffc107'; // Yellow for in progress
    return '#6c757d'; // Gray for no scores
  };

  const getHandicapStatusText = (golfer: any) => {
    if (golfer.handicap_index !== null) {
      return `Index: ${golfer.handicap_index.toFixed(1)}`;
    }
    if (golfer.total_scores > 0) {
      return `${golfer.total_scores}/3 scores (need ${3 - golfer.total_scores} more)`;
    }
    return 'No scores posted';
  };

  // Helper to get the full Supabase public URL for profile pictures
  const getProfilePicUrl = (profile_picture: string | null | undefined) => {
    if (!profile_picture) return '/default_profile.png';
    if (profile_picture.startsWith('http')) return profile_picture;
    // Use your Supabase project and bucket name
    return `https://bfhlpicxwuftctjzqyhe.supabase.co/storage/v1/object/public/profile-pics/${profile_picture}`;
  };

  return (
    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
      {/* Add Golfer Form */}
      <div className="card" style={{ flex: '1', minWidth: '320px' }}>
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="bi bi-person-plus" style={{ fontSize: '20px', color: '#667eea' }}></i>
          <h3 style={{ margin: 0, color: '#333', fontWeight: 600 }}>Add New Golfer</h3>
        </div>
        <form onSubmit={addGolfer} style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '4px 0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontWeight: 500 }}>Name</label>
            <input
              type="text"
              className="form-control"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontWeight: 500 }}>Email (optional)</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
            <label style={{ fontWeight: 500 }}>Profile Picture</label>
            <label htmlFor="profile-upload" style={{
              height: 44,
              borderRadius: 10,
              fontSize: 14,
              border: 'none',
              boxSizing: 'border-box',
              width: 140,
              background: 'linear-gradient(45deg, #667eea, #764ba2)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontWeight: 600,
              padding: 0,
              gap: 8
            }}>
              <IconUpload size={20} style={{ marginRight: 4 }} /> Upload
              <FileInput
                id="profile-upload"
                className="custom-file-input"
                accept="image/*"
                onChange={setFile}
                radius={10}
                style={{
                  display: 'none'
                }}
                placeholder="Upload"
              />
            </label>
          </div>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%' }}
          >
            <i className="bi bi-plus-circle"></i>
            {loading ? 'Adding...' : 'Add Golfer'}
          </button>
        </form>
      </div>

      {/* Golfers List */}
      <div className="card" style={{ flex: '2', minWidth: '320px' }}>
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="bi bi-people" style={{ fontSize: '20px', color: '#667eea' }}></i>
          <h3 style={{ margin: 0, color: '#333', fontWeight: 600 }}>Golfers List</h3>
        </div>
        
        {loading && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Loader />
          </div>
        )}
        
        {golfersWithHandicaps.length === 0 && !loading && (
          <Text style={{ textAlign: 'center', color: '#6c757d', padding: '20px' }}>
            No golfers yet. Add your first golfer using the form on the left.
          </Text>
        )}
        
        {golfersWithHandicaps.map((g) => (
          <div key={g.id} className="score-item">
            <Group align="center" gap={12}>
              <img
                src={getProfilePicUrl(g.profile_picture)}
                alt="Profile"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  background: '#fff',
                  minWidth: 48,
                  maxWidth: 48,
                  overflow: 'hidden',
                  border: '1px solid #eee'
                }}
              />
              <Link href={`/golfers/${g.id}`} style={{ flex: 1, textDecoration: 'none', color: 'inherit' }}>
                <div style={{ cursor: 'pointer' }}>
                  <Text style={{ fontWeight: 700, marginBottom: '4px' }}>{g.name}</Text>
                  <Text style={{ fontSize: '14px', color: '#6c757d', marginBottom: '4px' }}>
                    {g.email || 'No email provided'}
                  </Text>
                  <Text 
                    style={{ 
                      fontSize: '13px', 
                      color: getHandicapStatusColor(g), 
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <i className={`bi ${g.handicap_index !== null ? 'bi-check-circle-fill' : g.total_scores > 0 ? 'bi-clock-fill' : 'bi-dash-circle'}`}></i>
                    {getHandicapStatusText(g)}
                  </Text>
                </div>
              </Link>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Link href={`/golfers/${g.id}`}>
                  <button 
                    className="btn-primary" 
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    <i className="bi bi-eye"></i>
                    View
                  </button>
                </Link>
                <button 
                  className="btn-primary" 
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                  onClick={() => startEdit(g)}
                >
                  <i className="bi bi-pencil"></i>
                  Edit
                </button>
                <button 
                  className="btn-primary" 
                  style={{ 
                    padding: '6px 12px', 
                    fontSize: '12px',
                    background: '#dc3545',
                    backgroundImage: 'none'
                  }}
                  onClick={() => deleteGolfer(g.id)}
                >
                  <i className="bi bi-trash"></i>
                  Delete
                </button>
              </div>
            </Group>
          </div>
        ))}
      </div>
      
      {/* Edit Modal - Simple inline form when editing */}
      {editId && (
        <div className="card" style={{ flex: '1', minWidth: '320px' }}>
          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="bi bi-pencil" style={{ fontSize: '20px', color: '#667eea' }}></i>
            <h3 style={{ margin: 0, color: '#333', fontWeight: 600 }}>Edit Golfer</h3>
          </div>
          <form onSubmit={saveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '4px 0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontWeight: 500 }}>Name</label>
              <input
                type="text"
                className="form-control"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                required
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontWeight: 500 }}>Email</label>
              <input
                type="email"
                className="form-control"
                value={editEmail}
                onChange={e => setEditEmail(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
              <label style={{ fontWeight: 500 }}>Profile Picture</label>
              <label htmlFor="profile-edit-upload" style={{
                height: 44,
                borderRadius: 10,
                fontSize: 14,
                border: 'none',
                boxSizing: 'border-box',
                width: 140,
                background: 'linear-gradient(45deg, #667eea, #764ba2)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontWeight: 600,
                padding: 0,
                gap: 8
              }}>
                <IconUpload size={20} style={{ marginRight: 4 }} /> Upload
                <FileInput
                  id="profile-edit-upload"
                  className="custom-file-input"
                  accept="image/*"
                  onChange={setEditFile}
                  radius={10}
                  style={{
                    display: 'none'
                  }}
                  placeholder="Upload"
                />
              </label>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{ flex: 1 }}
              >
                <i className="bi bi-check-circle"></i>
                {loading ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                style={{
                  flex: 1,
                  background: '#6c757d',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 20px',
                  color: 'white',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <i className="bi bi-x-circle"></i>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
} 