import { createServer } from 'node:http';
import { createReadStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const distPath = join(root, 'dist');
const dataPath = join(root, 'data');
const ordersPath = join(dataPath, 'orders.json');
const port = Number(process.env.PORT || 5174);
const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

mkdirSync(dataPath, { recursive: true });
if (!existsSync(ordersPath)) writeFileSync(ordersPath, '[]');

function readOrders() {
  return JSON.parse(readFileSync(ordersPath, 'utf8'));
}

function saveOrders(orders) {
  writeFileSync(ordersPath, JSON.stringify(orders, null, 2));
}

function sendJson(response, status, payload) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => { body += chunk; });
    request.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); } catch { reject(new Error('Invalid JSON')); }
    });
    request.on('error', reject);
  });
}

async function createRazorpayOrder(total, receipt) {
  if (!razorpayKeyId || !razorpaySecret) return null;
  const credentials = Buffer.from(`${razorpayKeyId}:${razorpaySecret}`).toString('base64');
  const result = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: Math.round(total * 100), currency: 'INR', receipt }),
  });
  if (!result.ok) throw new Error('Razorpay order creation failed');
  const razorpayOrder = await result.json();
  return razorpayOrder.id;
}

async function handleApi(request, response, pathname) {
  if (request.method === 'GET' && pathname === '/api/health') {
    sendJson(response, 200, { ok: true, paymentGateway: Boolean(razorpayKeyId && razorpaySecret) });
    return true;
  }

  if (request.method === 'POST' && pathname === '/api/orders') {
    try {
      const body = await readBody(request);
      if (!body.customer?.name || !body.customer?.phone || !body.customer?.address || !Array.isArray(body.items) || !body.items.length) {
        sendJson(response, 400, { error: 'Customer details and cart items are required' });
        return true;
      }
      const id = crypto.randomUUID();
      const orderNumber = `NF-${Date.now().toString().slice(-8)}`;
      const razorpayOrderId = await createRazorpayOrder(body.total, orderNumber);
      const order = { id, orderNumber, customer: body.customer, items: body.items, total: body.total, razorpayOrderId, status: 'created', createdAt: new Date().toISOString() };
      const orders = readOrders();
      orders.push(order);
      saveOrders(orders);
      sendJson(response, 201, order);
    } catch (error) {
      sendJson(response, 502, { error: error.message });
    }
    return true;
  }

  const paymentMatch = pathname.match(/^\/api\/orders\/([^/]+)\/payment$/);
  if (request.method === 'POST' && paymentMatch) {
    try {
      const body = await readBody(request);
      const orders = readOrders();
      const order = orders.find((item) => item.id === paymentMatch[1]);
      if (!order) { sendJson(response, 404, { error: 'Order not found' }); return true; }
      order.status = 'paid';
      order.paymentId = body.razorpay_payment_id || 'demo';
      order.paidAt = new Date().toISOString();
      saveOrders(orders);
      sendJson(response, 200, order);
    } catch (error) {
      sendJson(response, 400, { error: error.message });
    }
    return true;
  }

  return false;
}

function serveStatic(request, response, pathname) {
  const requested = pathname === '/' ? '/index.html' : pathname;
  const filePath = normalize(join(distPath, requested));
  if (!filePath.startsWith(distPath) || !existsSync(filePath)) {
    response.writeHead(404);
    response.end('Not found');
    return;
  }
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };
  response.writeHead(200, { 'Content-Type': types[extname(filePath)] || 'application/octet-stream' });
  createReadStream(filePath).pipe(response);
}

createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  if (!(await handleApi(request, response, url.pathname))) serveStatic(request, response, url.pathname);
}).listen(port, () => {
  console.log(`Naik Foods backend running at http://localhost:${port}`);
});
