# Naik Foods E-Commerce Project Report

## 1. Project Overview

Naik Foods is a web-based food ordering application. Customers can browse food products, add products to a shopping bag, enter delivery details, and place an order through the website.

The project has two main parts:

- **Frontend:** React application built with Vite and deployed on Netlify.
- **Backend:** Node.js HTTP server deployed on Render.

The frontend and backend communicate through REST API requests over HTTPS.

## 2. Technologies Used

### Frontend

- React 19
- Vite
- JavaScript JSX
- HTML and CSS
- Netlify for deployment

### Backend

- Node.js
- Native Node.js HTTP server
- REST-style API endpoints
- Render for deployment

### Storage

- Orders are stored in `data/orders.json`.
- This approach was selected because it does not require a separate database setup for the current version.

### Payment

- Razorpay integration is supported.
- If Razorpay credentials are not configured, the application uses demo payment mode.

## 3. Frontend Implementation

The frontend source code is located in `my-naik-foods-app/src`.

Important frontend files:

- `App.jsx`: Main application logic, product list, cart handling, checkout, and API calls.
- `App.css`: Main application styles.
- `index.css`: Global styles.
- `components/navbar.jsx`: Navigation bar.
- `components/productcard.jsx`: Product display card.
- `components/cart.jsx`: Shopping bag and checkout interface.

### Main Frontend Features

1. Displays food categories and products.
2. Allows users to add products to the cart.
3. Shows the number of products in the shopping bag.
4. Collects customer name, phone number, and delivery address.
5. Calculates the order total.
6. Sends order details to the backend.
7. Supports Razorpay checkout when configured.
8. Shows a success message after the order is completed.

### Frontend API Configuration

The frontend reads the backend URL from the Vite environment variable:

```text
VITE_API_URL=https://naik-foods-djay.onrender.com
```

The code uses this variable when making requests:

```javascript
fetch(`${apiBaseUrl}/api/orders`, requestOptions)
```

During local development, if `VITE_API_URL` is not provided, the frontend uses the current host. In production, the variable must point to the Render backend.

## 4. Backend Implementation

The backend source code is located at:

```text
my-naik-foods-app/server/index.js
```

The server uses Node.js built-in modules to:

- Start an HTTP server.
- Parse incoming request URLs.
- Read JSON request bodies.
- Return JSON API responses.
- Serve the built frontend files from the `dist` folder.
- Store and update orders.

The server reads the Render-provided `PORT` variable. If no port is provided locally, it uses port `5174`.

## 5. Backend API Endpoints

### Health Check

```http
GET /api/health
```

Example response:

```json
{
  "ok": true,
  "paymentGateway": false
}
```

This endpoint confirms that the backend is running.

### Create Order

```http
POST /api/orders
```

The frontend sends customer details, cart items, and the total amount.

Example request:

```json
{
  "customer": {
    "name": "Customer Name",
    "phone": "9876543210",
    "address": "Delivery address"
  },
  "items": [
    {
      "id": 1,
      "name": "Banana Wefers",
      "price": 190
    }
  ],
  "total": 190
}
```

The backend validates the customer details and cart items, creates an order ID and order number, optionally creates a Razorpay order, and stores the order in `data/orders.json`.

### Update Payment Status

```http
POST /api/orders/:id/payment
```

After payment, the frontend sends the payment response. The backend finds the order, updates its status to `paid`, stores the payment ID, and records the payment time.

## 6. Order Data Flow

The complete order flow is:

1. User opens the Netlify website.
2. User selects products.
3. Products are added to the React cart state.
4. User enters name, phone number, and address.
5. Frontend sends a `POST /api/orders` request to Render.
6. Render backend validates the request.
7. Backend creates an order number such as `NF-12345678`.
8. Backend stores the order in `data/orders.json`.
9. If Razorpay is configured, the backend creates a Razorpay order.
10. Frontend completes payment or uses demo payment mode.
11. Frontend sends payment details to `POST /api/orders/:id/payment`.
12. Backend marks the order as paid.
13. Frontend clears the cart and displays a success message.

## 7. How Frontend and Backend Were Connected

The frontend and backend are deployed separately.

### Frontend Deployment

The React/Vite frontend is deployed on Netlify. Netlify runs the frontend build command:

```bash
npm run build
```

The generated `dist` folder is published as the website.

### Backend Deployment

The Node.js backend is deployed on Render using:

```text
Root Directory: my-naik-foods-app
Build Command: npm install
Start Command: npm run server
```

The live backend URL is:

```text
https://naik-foods-djay.onrender.com
```

### Environment Variable Connection

Netlify receives the backend URL through:

```text
VITE_API_URL=https://naik-foods-djay.onrender.com
```

When the frontend is built, Vite makes this variable available to the React application. The frontend then sends API calls to Render instead of sending them to Netlify.

The backend allows cross-origin requests using the `FRONTEND_URL` setting. This enables the Netlify website to communicate with the Render server.

## 8. Deployment Architecture

```text
Customer Browser
       |
       | HTTPS
       v
Netlify Frontend
(React + Vite)
       |
       | REST API requests
       | VITE_API_URL
       v
Render Backend
(Node.js HTTP server)
       |
       v
orders.json
(JSON order storage)
       |
       v
Optional Razorpay API
```

## 9. Deployment Verification

The Render backend was verified using its health endpoint:

```text
https://naik-foods-djay.onrender.com/api/health
```

The successful response was:

```json
{
  "ok": true,
  "paymentGateway": false
}
```

This confirms that:

- The Render service is live.
- The Node.js server started successfully.
- The health API is reachable from the internet.
- Razorpay is currently not configured, so demo payment mode is active.

The project was also checked using:

```bash
npm run build
npm run lint
```

Both checks completed successfully.

## 10. Current Limitations

1. Orders are stored in a JSON file rather than a production database.
2. JSON file data can be lost when the Render service restarts or redeploys.
3. Razorpay real payment mode requires `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` environment variables.
4. Authentication and an admin order dashboard are not currently implemented.
5. Payment verification can be strengthened with server-side Razorpay signature verification.

## 11. Future Improvements

- Move order storage to PostgreSQL, Supabase, or another persistent database.
- Add a secure admin dashboard for viewing and updating orders.
- Add user authentication.
- Add stock management and product administration.
- Add server-side Razorpay signature verification.
- Add automated frontend and backend tests.
- Add logging and monitoring for production errors.

## 12. Conclusion

The Naik Foods application uses a React/Vite frontend and a Node.js backend. The frontend provides the shopping and checkout experience, while the backend validates requests, creates orders, updates payment status, and stores order data. Netlify hosts the frontend and Render hosts the backend. The two services are connected through the `VITE_API_URL` environment variable and REST API calls.

The current deployment is functional in demo payment mode, and the backend health endpoint confirms that the Render service is live.
