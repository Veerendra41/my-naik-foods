import React from 'react';

export default function Navbar({ cartCount }) {
  return (
    <nav
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 1.5rem',
        background: '#1f2937',
        color: '#fff',
      }}
    >
      <h2 style={{ margin: 0 }}>My Naik Foods</h2>
      <div style={{ fontWeight: '600' }}>Cart ({cartCount})</div>
    </nav>
  );
}