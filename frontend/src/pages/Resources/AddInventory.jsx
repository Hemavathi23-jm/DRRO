// src/pages/Resources/AddInventory.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../../components/layout/PageWrapper';

const CENTERS   = ['Calicut Relief Hub','Kochi Central Depot','Thrissur Relief Store','Wayanad Mobile Unit'];
const RESOURCES = ['Rice (25kg bag)','Drinking Water','First Aid Kit','Oral Rehydration','Tarpaulin Sheet','Life Jacket','Rescue Rope'];

export default function AddInventory() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ center:'', resource:'', qty:'', minStock:'', expiryDate:'' });
  const [saved, setSaved] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleSubmit = e => {
    e.preventDefault();
    setSaved(true);
    setTimeout(()=>navigate('/resources/inventory'), 1200);
  };

  return (
    <PageWrapper>
      <div className="flex-between page-header">
        <div><h2 className="page-title">Add Inventory</h2><p className="page-sub">Add or update stock at a resource center</p></div>
        <button className="btn btn-secondary" onClick={()=>navigate('/resources/inventory')}>← Back</button>
      </div>
      <div style={{maxWidth:560}}>
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Resource Center *</label>
              <select className="form-select" value={form.center} onChange={e=>set('center',e.target.value)} required>
                <option value="">Select center…</option>
                {CENTERS.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Resource Type *</label>
              <select className="form-select" value={form.resource} onChange={e=>set('resource',e.target.value)} required>
                <option value="">Select resource…</option>
                {RESOURCES.map(r=><option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Available Quantity *</label>
                <input className="form-input" type="number" min={0} value={form.qty} onChange={e=>set('qty',e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Min Stock Level</label>
                <input className="form-input" type="number" min={0} value={form.minStock} onChange={e=>set('minStock',e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Expiry Date (if perishable)</label>
              <input className="form-input" type="date" value={form.expiryDate} onChange={e=>set('expiryDate',e.target.value)} />
            </div>
            {saved && <p className="form-success" style={{ marginBottom: 12 }}>Inventory updated. Redirecting…</p>}
            <div style={{display:'flex',gap:10}}>
              <button className="btn btn-primary" type="submit">Save Stock</button>
              <button className="btn btn-secondary" type="button" onClick={()=>navigate('/resources/inventory')}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </PageWrapper>
  );
}
