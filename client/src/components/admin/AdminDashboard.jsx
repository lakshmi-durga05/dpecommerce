import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { erpGetInventory, erpGetVendors, erpGetPOs, erpGetInvoices } from '../../api';
import './admin.css';

const Section = ({ title, columns, rows, getKey }) => (
  <div className="admin-section">
    <h3>{title}</h3>
    <div className="admin-table">
      <div className="admin-thead">
        {columns.map((c) => (
          <div className="admin-th" key={c}>{c}</div>
        ))}
      </div>
      <div className="admin-tbody">
        {rows.map((row, i) => (
          <div className="admin-tr" key={getKey ? getKey(row) : i}>
            {columns.map((c) => (
              <div className="admin-td" key={c + '-' + (getKey ? getKey(row) : i)}>
                {String(row[c] ?? '')}
              </div>
            ))}
          </div>
        ))}
        {rows.length === 0 && <div className="admin-empty">No records</div>}
      </div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [inventory, setInventory] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [pos, setPOs] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAll() {
      try {
        const [invRes, venRes, poRes, invcRes] = await Promise.all([
          erpGetInventory(),
          erpGetVendors(),
          erpGetPOs(),
          erpGetInvoices(),
        ]);
        setInventory(invRes.data || []);
        setVendors(venRes.data || []);
        setPOs(poRes.data || []);
        setInvoices(invcRes.data || []);
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  if (loading) return <div className="admin-loading">Loading...</div>;

  return (
    <div className="admin-dashboard">
      <h2>ERP Admin Dashboard</h2>
      <div style={{marginBottom:'16px'}}>
        <NavLink to="/admin/vendors" className="btn btn-primary">Manage Vendors</NavLink>
      </div>

      <Section
        title="Inventory"
        columns={["sku", "name", "currentStock", "reorderPoint", "reorderQty", "leadTimeDays"]}
        rows={inventory}
        getKey={(r) => r._id}
      />

      <Section
        title="Vendors"
        columns={["name", "email", "phone", "gstin", "paymentTermsDays", "isActive"]}
        rows={vendors}
        getKey={(r) => r._id}
      />

      <Section
        title="Purchase Orders"
        columns={["status", "expectedDate", "notes"]}
        rows={pos}
        getKey={(r) => r._id}
      />

      <Section
        title="Invoices"
        columns={["subTotal", "taxAmount", "total", "status"]}
        rows={invoices}
        getKey={(r) => r._id}
      />
    </div>
  );
};

export default AdminDashboard;
