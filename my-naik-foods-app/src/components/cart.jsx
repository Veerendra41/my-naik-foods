import React from 'react';

export default function Cart({ cartItems, onCheckout }) {
  const total = cartItems.reduce((acc, item) => acc + item.price, 0);

  return (
    <div style={{ padding: '1rem', border: '1px solid #ddd', marginTop: '1rem' }}>
      <h2>Your Cart</h2>
      {cartItems.length === 0 ? (
        <p>Cart is empty</p>
      ) : (
        <>
          <ul>
            {cartItems.map((item, index) => (
              <li key={index}>{item.name} - ₹{item.price}</li>
            ))}
          </ul>
          <h3>Total: ₹{total}</h3>
          <button onClick={onCheckout} style={{ background: 'green', color: '#fff', padding: '0.5rem 1rem' }}>
            Proceed to Checkout
          </button>
        </>
      )}
    </div>
  );
}