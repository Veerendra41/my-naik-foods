import { useState } from 'react';
import './App.css';

const apiBaseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const imageRoot = 'https://www.naikfoods.co.in';
const fallbackImage = `${imageRoot}/banners/home/banner-03.png`;
const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;

function handleImageError(event) {
  const image = event.currentTarget;
  if (!image.src.endsWith('/banner-03.png')) {
    image.src = fallbackImage;
  }
}

const categories = [
  { name: 'Snacks & Namkeen', count: 105, image: `${imageRoot}/featured-categories/snacks%26namkeen.jpg` },
  { name: 'Pickles & Condiments', count: 14, image: `${imageRoot}/products/pickles/pickle01.png` },
  { name: 'Sweets & Bakery', count: 25, image: `${imageRoot}/featured-categories/bakery.jpg` },
  { name: 'Spices & Masalas', count: 9, image: `${imageRoot}/featured-categories/spices.jpg` },
];

const products = [
  { id: 1, name: 'Banana Wefers', description: 'Golden slices, tropical crispy charm.', price: 190, category: 'Snacks', image: 'https://res.cloudinary.com/dskzfipt3/image/upload/v1780130812/medusa/1780130810786-pomelli_photoshoot-1%20%286%29.png.jpg' },
  { id: 2, name: 'Prawns Pickle', description: 'Authentic, spicy coastal flavor.', price: 450, category: 'Pickles', image: 'https://res.cloudinary.com/dskzfipt3/image/upload/v1780121990/medusa/1780121988900-pomelli_photoshoot_image_1_1_0529%20%287%29.png.jpg' },
  { id: 3, name: 'Tangy Tomato Rings', description: 'Crunchy, tangy, tomato rings.', price: 280, category: 'Snacks', image: 'https://res.cloudinary.com/dskzfipt3/image/upload/v1779971724/medusa/1779971722501-IMG_3863.JPG.jpeg.jpg' },
  { id: 4, name: 'Methi Thalipith Bhajni', description: 'Traditional, healthy, flavorful.', price: 100, category: 'Spices', image: 'https://res.cloudinary.com/dskzfipt3/image/upload/v1780058273/medusa/1780058271381-pomelli_photoshoot_image_1_1_0529%20%281%29.png.jpg' },
  { id: 5, name: 'Jowar Chivda', description: 'Crispy, nutritious, traditional flavor.', price: 90, category: 'Snacks', image: 'https://res.cloudinary.com/dskzfipt3/image/upload/v1780048465/medusa/1780048463645-IMG_3894.JPG.jpeg.jpg' },
  { id: 6, name: 'Ambadi Bhajiche Lonche', description: 'Traditional, tangy pickle delight.', price: 190, category: 'Pickles', image: 'https://res.cloudinary.com/dskzfipt3/image/upload/v1780057106/medusa/1780057104457-pomelli_photoshoot_image_1_1_0529%20%285%29.png.jpg' },
];

export default function App() {
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '' });

  const handleAddToCart = (product) => {
    setCart((currentCart) => [...currentCart, product]);
    setCartOpen(true);
  };

  const handleCheckout = () => {
    setCheckoutOpen(true);
  };

  const finishOrder = (paymentId = 'DEMO_PAYMENT') => {
    window.alert(`Order placed successfully! Payment ID: ${paymentId}`);
    setCart([]);
    setCartOpen(false);
    setCheckoutOpen(false);
    setCustomer({ name: '', phone: '', address: '' });
  };

  const handlePayment = async (event) => {
    event.preventDefault();
    if (!customer.name || !customer.phone || !customer.address) {
      window.alert('Please fill in your name, phone number, and delivery address.');
      return;
    }

    let order;
    try {
      const orderResponse = await fetch(`${apiBaseUrl}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer,
          items: cart.map(({ id, name, price }) => ({ id, name, price })),
          total,
        }),
      });
      if (!orderResponse.ok) throw new Error('Order service unavailable');
      order = await orderResponse.json();
    } catch {
      window.alert('We could not create your order. Please start the backend and try again.');
      return;
    }

    if (!razorpayKey) {
      window.alert('Demo payment mode: add VITE_RAZORPAY_KEY_ID to enable Razorpay checkout.');
      finishOrder(`${order.orderNumber}-DEMO`);
      return;
    }

    if (!window.Razorpay) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });
    }

    const payment = new window.Razorpay({
      key: razorpayKey,
      amount: Math.round(total * 100),
      currency: 'INR',
      name: 'Naik Foods',
      description: 'Authentic Maharashtra food order',
      prefill: { name: customer.name, contact: customer.phone },
      notes: { delivery_address: customer.address },
      order_id: order.razorpayOrderId || undefined,
      handler: async (response) => {
        await fetch(`${apiBaseUrl}/api/orders/${order.id}/payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(response),
        });
        finishOrder(response.razorpay_payment_id);
      },
      theme: { color: '#d66b2e' },
    });
    payment.open();
  };

  const total = cart.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="storefront">
      <div className="announcement">Free delivery on orders above ₹999 <span>•</span> Made with love in Maharashtra</div>
      <header className="site-header">
        <button className="menu-button" onClick={() => setMenuOpen(true)} aria-label="Open menu">☰</button>
        <a className="brand" href="#top" aria-label="Naik Foods home"><span>🌿</span> NAIK FOODS</a>
        <nav className="desktop-nav" aria-label="Primary navigation">
          <a href="#shop">Shop</a><a href="#story">Our Story</a><a href="#journal">Journal</a><a href="#visit">Visit Us</a>
        </nav>
        <div className="header-actions">
          <button aria-label="Search">⌕</button><button aria-label="Account">♙</button>
          <button className="cart-button" onClick={() => setCartOpen(true)} aria-label="Open shopping bag">Bag <b>{cart.length}</b></button>
        </div>
      </header>

      {menuOpen && <div className="menu-overlay" onClick={() => setMenuOpen(false)}><aside className="mobile-menu" onClick={(event) => event.stopPropagation()}><button className="close-button" onClick={() => setMenuOpen(false)} aria-label="Close menu">×</button><p className="eyebrow">Naik Foods</p><h2>Explore</h2><nav aria-label="Mobile navigation"><a href="#shop" onClick={() => setMenuOpen(false)}>Shop</a><a href="#story" onClick={() => setMenuOpen(false)}>Our Story</a><a href="#journal" onClick={() => setMenuOpen(false)}>Journal</a><a href="#visit" onClick={() => setMenuOpen(false)}>Visit Us</a></nav></aside></div>}

      <main id="top">
        <section className="hero">
          <div className="hero-copy"><p className="eyebrow">Naik Foods Original</p><h1>The heart of<br /><em>authentic</em> Maharashtra.</h1><p className="hero-text">From hand-pounded masalas to farm-fresh staples, bring the traditional flavors of Vidarbha to your kitchen.</p><a className="primary-button" href="#shop">Shop the collection <span>↗</span></a></div>
          <div className="hero-art"><img src={`${imageRoot}/banners/home/banner-01.png`} alt="A spread of Naik Foods snacks and pickles" onError={handleImageError} /><div className="hero-stamp">100%<br /><small>AUTHENTIC</small></div></div>
        </section>

        <section className="category-section" id="shop"><div className="section-heading"><div><p className="eyebrow">Curated for you</p><h2>Shop by category</h2></div><a href="#products">View all products ↗</a></div><div className="category-grid">{categories.map((category) => <a className="category-card" href="#products" key={category.name}><img src={category.image} alt={category.name} onError={handleImageError} /><div><h3>{category.name}</h3><p>{category.count} items <span>↗</span></p></div></a>)}</div></section>

        <section className="product-section" id="products"><div className="section-heading"><div><p className="eyebrow">From our kitchen</p><h2>Popular products</h2></div><a href="#products">Explore all ↗</a></div><div className="product-grid">{products.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />)}</div></section>

        <section className="story-section" id="story"><div className="story-image"><img src={`${imageRoot}/Images/spices01.png`} alt="Fresh spices prepared by Naik Foods" onError={handleImageError} /></div><div className="story-copy"><p className="eyebrow">Our kitchen to yours</p><h2>Real food.<br /><em>Real memories.</em></h2><p>Crunchy namkeen, tangy pickles, and traditional sweets made with the recipes we grew up with. Every batch carries a little piece of Maharashtra.</p><a className="text-link" href="#visit">Discover our story <span>↗</span></a></div></section>

        <section className="product-section best-sellers"><div className="section-heading"><div><p className="eyebrow">Loved by many</p><h2>Best sellers</h2></div><a href="#products">View collection ↗</a></div><div className="product-grid">{products.slice(2, 6).map((product) => <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />)}</div></section>

        <section className="visit-section" id="visit"><div><p className="eyebrow">Come say hello</p><h2>Visit our authentic<br /><em>food store.</em></h2><p>Experience the tradition in person. Visit our flagship store in Pune for the freshest batches and local specialties.</p><a className="primary-button" href="https://maps.google.com/?q=Naik+Foods+Pune">Get directions <span>↗</span></a></div><img src={`${imageRoot}/banners/home/banner-02.png`} alt="The Naik Foods storefront in Pune" onError={handleImageError} /></section>
      </main>

      <footer id="journal"><div className="footer-brand"><a className="brand" href="#top"><span>🌿</span> NAIK FOODS</a><p>Authentic flavors from Vidarbha<br />and Konkan, delivered with love.</p></div><div><h3>Shop</h3><a href="#shop">Snacks & Namkeen</a><a href="#shop">Pickles & Condiments</a><a href="#shop">Sweets & Bakery</a></div><div><h3>Explore</h3><a href="#story">Our story</a><a href="#journal">Journal</a><a href="#visit">Contact us</a></div><div><h3>Visit us</h3><p>Shukrawar Peth, Pune<br />9 AM – 10 PM daily</p><a href="tel:+919730046247">+91 97300 46247</a></div><p className="copyright">© 2026 Naik Foods. Made in Maharashtra.</p></footer>

      {cartOpen && <div className="cart-overlay" onClick={() => setCartOpen(false)}><aside className="cart-drawer" onClick={(event) => event.stopPropagation()}><button className="close-button" onClick={() => setCartOpen(false)} aria-label="Close shopping bag">×</button><p className="eyebrow">Your selection</p><h2>Shopping bag</h2>{cart.length === 0 ? <p className="empty-cart">Your bag is waiting for something delicious.</p> : <>{cart.map((item, index) => <div className="cart-line" key={`${item.id}-${index}`}><span>{item.name}</span><b>₹{item.price}</b></div>)}<div className="cart-total"><span>Total</span><b>₹{total}</b></div><button className="primary-button checkout" onClick={handleCheckout}>Proceed to checkout ↗</button></>}</aside></div>}

      {checkoutOpen && <div className="checkout-overlay"><form className="checkout-modal" onSubmit={handlePayment}><button type="button" className="close-button" onClick={() => setCheckoutOpen(false)} aria-label="Close checkout">×</button><p className="eyebrow">Secure checkout</p><h2>Where should we<br /><em>deliver?</em></h2><label>Name<input value={customer.name} onChange={(event) => setCustomer({ ...customer, name: event.target.value })} required /></label><label>Phone<input type="tel" value={customer.phone} onChange={(event) => setCustomer({ ...customer, phone: event.target.value })} required /></label><label>Delivery address<textarea value={customer.address} onChange={(event) => setCustomer({ ...customer, address: event.target.value })} required /></label><div className="payment-note"><span>Payment</span><strong>{razorpayKey ? 'Razorpay secure checkout' : 'Demo payment mode'}</strong></div><button className="primary-button checkout" type="submit">Pay ₹{total} securely <span>↗</span></button></form></div>}
    </div>
  );
}

function ProductCard({ product, onAddToCart }) {
  return <article className="product-card"><div className="product-image"><img src={product.image} alt={product.name} onError={handleImageError} /><span className="product-tag">{product.category}</span></div><div className="product-info"><div><h3>{product.name}</h3><p>{product.description}</p></div><strong>₹{product.price}</strong></div><button className="add-button" onClick={() => onAddToCart(product)}>Add to bag <span>+</span></button></article>;
}