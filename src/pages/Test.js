import React from 'react';

const Test = () => {
  const handleClick = () => {
    alert('Button works!');
  };

  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>Test Page</h1>
      <button 
        onClick={handleClick}
        style={{
          padding: '20px 40px',
          fontSize: '20px',
          background: '#4f46e5',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        Click Me
      </button>
    </div>
  );
};

export default Test;