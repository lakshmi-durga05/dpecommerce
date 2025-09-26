# <div align="center">lakshmiworld</div>

### <div align="center">Enterprise-Grade E-commerce + ERP System</div><br>

Lakshmiworld is a full-stack e-commerce platform with backend ERP features for inventory, supply chain, and vendor management. It includes authentication, product catalog, cart and checkout, payments via Razorpay, invoicing with GST, inventory management, vendors, purchase orders, sales orders, and low-stock forecasting.

## Features 📃
- User Sign up / Sign in / Logout
- Browse and search products
- Profile with order history
- Cart with add/update/remove and buy-now
- Payments with Razorpay
- AI-ready recommendations service hook (to be enabled)

### ERP Modules
- Inventory management (SKU, stock, reorder point, lead time)
- Vendor management (GSTIN, payment terms)
- Purchase Orders (draft/placed/received)
- Sales Orders (pending/paid/shipped/completed)
- Invoices (issued/paid, GST line items)
- Tax configuration (default GST and HSN mappings)
- Low-stock forecasting endpoint

## Technology Used 💻
- Frontend: React.js
- Backend: Express.js (Node.js)
- Database: MongoDB (Mongoose)
- Payments: Razorpay

## Run Locally
Server
```shell
npm install
npm run start
```
The server runs at http://localhost:8000/

Client
```shell
cd client
npm install
npm start
```
The client runs at http://localhost:3000/

Set environment variables in a `.env` file at the project root:
```
DB_URL=mongodb+srv://...
SECRET_KEY=your_jwt_secret
RAZORPAY_KEY_ID=xxx
RAZORPAY_SECRET=yyy
NODE_ENV=development
```

Optionally set `client/.env`:
```
REACT_APP_API_BASE_URL=http://localhost:8000/api
```

