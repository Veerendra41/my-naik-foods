import React from 'react';

export default function ProductCard({ product, onAddToCart }) {
  return (
    <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px', width: '200px' }}>
      <img src={product.image} alt={product.name} style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
      <h3>{product.name}</h3>
      <p>₹{product.price}</p>
      <button onClick={() => onAddToCart(product)} style={{ padding: '0.5rem', cursor: 'pointer' }}>
        Add to Cart
      </button>
    </div>
  );
}