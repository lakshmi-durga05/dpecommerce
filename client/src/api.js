import axios from 'axios';

const baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

export const getRazorpayKey = () => api.get('/get-razorpay-key');
export const createOrder = (amount) => api.post('/create-order', { amount });
export const payOrder = (payload) => api.post('/pay-order', payload);
export const getAuthUser = () => api.get('/getAuthUser');
export const getProducts = () => api.get('/products');
export const getProduct = (id) => api.get(`/product/${id}`);
export const addToCartApi = (id, product) => api.post(`/addtocart/${id}`, { product });
export const deleteFromCart = (id) => api.delete(`/delete/${id}`);
export const logout = () => api.get('/logout');
// PayPal config
export const getPaypalConfig = () => api.get('/paypal/config');
export const paypalCreateOrder = (amount, currency='INR') => api.post('/paypal/create-order', { amount, currency });
export const paypalCaptureOrder = (orderID) => api.post('/paypal/capture-order', { orderID });
export const paypalSaveOrder = (payload) => api.post('/paypal/save-order', payload);

// Orders tracking
export const getOrderById = (id) => api.get(`/order/${id}`);
export const advanceOrder = (id) => api.post(`/order/${id}/advance`);
// Invoices
export const getInvoiceByOrderRef = (ref) => api.get(`/invoice/by-order/${encodeURIComponent(ref)}`);

// Cart
export const updateCartQty = (id, qty) => api.post('/cart/update-qty', { id, qty });

// Recommendations
export const getRecommendations = () => api.get('/recommendations');

// ERP base
const erp = axios.create({
  baseURL: (process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api') + '/erp',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

// ERP: Vendors
export const erpGetVendors = () => erp.get('/vendors');
export const erpCreateVendor = (data) => erp.post('/vendors', data);
export const erpUpdateVendor = (id, data) => erp.put(`/vendors/${id}`, data);
export const erpDeleteVendor = (id) => erp.delete(`/vendors/${id}`);

// ERP: Inventory
export const erpGetInventory = () => erp.get('/inventory');
export const erpCreateInventoryItem = (data) => erp.post('/inventory', data);
export const erpUpdateInventoryItem = (id, data) => erp.put(`/inventory/${id}`, data);
export const erpDeleteInventoryItem = (id) => erp.delete(`/inventory/${id}`);

// ERP: Purchase Orders
export const erpGetPOs = () => erp.get('/purchase-orders');
export const erpCreatePO = (data) => erp.post('/purchase-orders', data);
export const erpUpdatePO = (id, data) => erp.put(`/purchase-orders/${id}`, data);
export const erpDeletePO = (id) => erp.delete(`/purchase-orders/${id}`);

// ERP: Sales Orders & Invoices
export const erpGetSOs = () => erp.get('/sales-orders');
export const erpGetInvoices = () => erp.get('/invoices');
// ERP: Notifications & Forecast
export const erpGetNotifications = (vendorId) => erp.get(`/notifications${vendorId?`?vendorId=${vendorId}`:''}`);
export const erpMarkNotificationRead = (id) => erp.post(`/notifications/${id}/read`);
export const erpForecastShortage = () => erp.get('/forecast/shortage');
export const erpRunForecast = () => erp.post('/forecast/run');
export const erpCreateInvoice = (data) => erp.post('/invoices', data);

// ERP: Tax & Forecast
export const erpGetTaxConfig = () => erp.get('/tax-config');
export const erpSetTaxConfig = (data) => erp.post('/tax-config', data);
export const erpGetLowStock = () => erp.get('/forecast/low-stock');


