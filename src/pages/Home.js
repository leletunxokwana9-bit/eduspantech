import React from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  return (
    <div style={{ 
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{ 
        maxWidth: '800px', 
        textAlign: 'center',
        backgroundColor: 'white',
        padding: '50px',
        borderRadius: '20px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ fontSize: '48px', marginBottom: '10px' }}>📚 EduSpantech</h1>
        <p style={{ fontSize: '24px', color: '#2c3e50', marginBottom: '20px' }}>
          Education for the love of your life ❤️
        </p>
        <p style={{ fontSize: '18px', color: '#7f8c8d', marginBottom: '30px' }}>
          Global mathematics tutoring platform for Grade 8 to 2nd-Year Tertiary
        </p>
        
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={() => navigate('/register')}
            style={{
              padding: '15px 40px',
              fontSize: '18px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background-color 0.3s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#2980b9'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#3498db'}
          >
            🚀 Get Started
          </button>
          <button 
            onClick={() => navigate('/login')}
            style={{
              padding: '15px 40px',
              fontSize: '18px',
              backgroundColor: 'transparent',
              color: '#3498db',
              border: '2px solid #3498db',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#3498db';
              e.target.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#3498db';
            }}
          >
            🔑 Login
          </button>
        </div>

        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginTop: '50px'
        }}>
          <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '10px' }}>
            <h3 style={{ fontSize: '30px' }}>🎯</h3>
            <h4>24/7 Learning</h4>
            <p style={{ color: '#7f8c8d' }}>Access tutors from anywhere</p>
          </div>
          <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '10px' }}>
            <h3 style={{ fontSize: '30px' }}>📐</h3>
            <h4>Interactive Whiteboard</h4>
            <p style={{ color: '#7f8c8d' }}>Real-time math solving</p>
          </div>
          <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '10px' }}>
            <h3 style={{ fontSize: '30px' }}>🌍</h3>
            <h4>Global Curriculum</h4>
            <p style={{ color: '#7f8c8d' }}>SA, US, UK, Australia & more</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;