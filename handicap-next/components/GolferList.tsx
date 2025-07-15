import React from 'react';

interface GolferAvatarProps {
  profile_picture?: string;
  name?: string;
  size?: number;
}

const GolferAvatar: React.FC<GolferAvatarProps> = ({ profile_picture, name, size = 32 }) => {
  const defaultSrc = '/default_profile.png';
  const [src, setSrc] = React.useState(profile_picture || defaultSrc);

  React.useEffect(() => {
    setSrc(profile_picture || defaultSrc);
  }, [profile_picture]);

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
      onError={() => setSrc(defaultSrc)}
    />
  );
};

export default GolferAvatar;
