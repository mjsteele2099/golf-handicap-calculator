import React from 'react';

interface GolferAvatarProps {
  profile_picture?: string;
  name?: string;
  size?: number;
}

const GolferAvatar: React.FC<GolferAvatarProps> = ({ profile_picture, name, size = 32 }) => {
  const src = profile_picture || '/default_profile.png';
  return (
    <img
      src={src}
      alt={name || 'Golfer'}
      title={name}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        objectFit: 'cover',
        border: '1.5px solid #e9ecef',
        background: '#f8f9fa',
        marginRight: 8,
        verticalAlign: 'middle',
      }}
    />
  );
};

export default GolferAvatar;
