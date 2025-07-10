import { ReactNode } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Title, Text, Group } from '@mantine/core';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();

  const navTabs = [
    { label: 'Home', value: '/', icon: 'bi-house', description: 'Dashboard overview' },
    { label: 'Golfers', value: '/golfers', icon: 'bi-people', description: 'Manage golfers' },
    { label: 'Add Score', value: '/scores', icon: 'bi-calculator', description: 'Record scores' },
    { label: 'Courses', value: '/courses', icon: 'bi-geo', description: 'Manage courses' },
    { label: 'Calculate Handicap', value: '/handicap', icon: 'bi-trophy', description: 'View handicaps' },
  ];

  return (
    <>
      <style jsx global>{`
        body {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 0;
        }
        .main-container {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          margin: 20px auto;
          padding: 30px;
          max-width: 1200px;
        }
        .nav-tabs {
          display: flex;
          list-style: none;
          padding: 0;
          margin: 0 0 30px 0;
          border-bottom: none;
          flex-wrap: wrap;
        }
        .nav-item {
          margin-right: 10px;
          margin-bottom: 5px;
        }
        .nav-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 18px 32px;
          text-decoration: none;
          border: none;
          border-radius: 14px;
          color: #667eea;
          font-weight: 700;
          font-size: 1.25rem;
          transition: all 0.2s ease;
          background: transparent;
          cursor: pointer;
        }
        .nav-link i {
          font-size: 1.7em;
        }
        .nav-link:hover {
          background: rgba(102, 126, 234, 0.1);
          transform: translateY(-1px);
        }
        .nav-link.active {
          background: linear-gradient(45deg, #667eea, #764ba2);
          color: white;
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
        }
        .card {
          border: none;
          border-radius: 15px;
          box-shadow: 0 5px 15px rgba(0,0,0,0.08);
          transition: transform 0.2s ease;
          background: white;
          padding: 28px 28px 24px 28px;
          margin-bottom: 20px;
        }
        .card:hover {
          transform: translateY(-2px);
        }
        .btn-primary {
          background: linear-gradient(45deg, #667eea, #764ba2);
          border: none;
          border-radius: 10px;
          padding: 10px 20px;
          font-weight: 600;
          color: white;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: transform 0.2s ease;
          cursor: pointer;
        }
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
          color: white;
        }
        .form-control {
          border-radius: 10px;
          border: 2px solid #e9ecef;
          padding: 12px 15px;
          width: 100%;
          max-width: 100%;
          font-size: 14px;
          box-sizing: border-box;
        }
        .form-control:focus {
          border-color: #667eea;
          outline: none;
          box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
        }
        .score-item {
          background: #f8f9fa;
          border-radius: 10px;
          padding: 15px;
          margin: 10px 0;
          border-left: 4px solid #667eea;
          transition: transform 0.2s ease;
        }
        .score-item:hover {
          transform: translateX(5px);
          background: #e9ecef;
        }
        .handicap-display {
          font-size: 2.5rem;
          font-weight: bold;
          color: #667eea;
          text-align: center;
          padding: 20px;
          background: linear-gradient(45deg, #f8f9fa, #e9ecef);
          border-radius: 15px;
          margin: 20px 0;
        }
        .stats-card {
          background: linear-gradient(45deg, #667eea, #764ba2);
          color: white;
          border-radius: 15px;
          padding: 20px;
          text-align: center;
          margin-bottom: 20px;
        }
        .stats-card h3 {
          font-size: 2.5rem;
          margin-bottom: 5px;
          margin-top: 0;
        }
        .alert {
          border-radius: 10px;
          border: none;
          padding: 15px;
          margin: 15px 0;
        }
        .alert-warning {
          background: #fff3cd;
          color: #856404;
          border-left: 4px solid #ffc107;
        }
        .custom-file-input .mantine-FileInput-input,
        .custom-file-input .mantine-FileInput-label {
          height: 44px !important;
          min-width: 120px !important;
          max-width: 180px;
          font-size: 14px;
          border-radius: 10px;
          padding: 0 15px;
          border: 2px solid #e9ecef;
          box-sizing: border-box;
          background: #fff;
          display: flex;
          align-items: center;
        }
      `}</style>
      
      <div className="container-fluid">
        <div className="main-container">
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <Group justify="center" mb="sm">
              <i className="bi bi-trophy" style={{ fontSize: '48px', color: '#667eea' }}></i>
            </Group>
            <Title 
              order={1} 
              style={{ 
                color: '#667eea', 
                marginBottom: '8px',
                fontSize: '2.5rem',
                fontWeight: 700
              }}
            >
              Golf Handicap Calculator
            </Title>
            <Text 
              style={{ 
                color: '#6c757d',
                fontSize: '1.125rem',
                marginBottom: '0'
              }}
            >
              Track scores and calculate handicaps for your golf group
            </Text>
          </div>

          {/* Navigation Tabs */}
          <ul className="nav-tabs">
            {navTabs.map(tab => (
              <li key={tab.value} className="nav-item">
                <Link href={tab.value} legacyBehavior>
                  <a className={`nav-link ${router.pathname === tab.value ? 'active' : ''}`}>
                    <i className={`bi ${tab.icon}`}></i>
                    {tab.label}
                  </a>
                </Link>
              </li>
            ))}
          </ul>

          {/* Page Content */}
          {children}
        </div>
      </div>

      {/* Bootstrap Icons */}
      <link 
        rel="stylesheet" 
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.7.2/font/bootstrap-icons.css"
      />
    </>
  );
} 