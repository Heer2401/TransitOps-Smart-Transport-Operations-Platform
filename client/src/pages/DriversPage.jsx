import { useState, useEffect } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import { toast } from 'react-toastify';

const licenseCategories = ['A', 'B', 'C', 'D', 'E', 'LMV', 'HMV', 'HGMV'];
const driverStatuses = ['Available', 'On Trip', 'Off Duty', 'Suspended'];

const emptyForm = {
  name: '', licenseNumber: '', licenseCategory: 'LMV',
  licenseExpiryDate: '', contactNumber: '', email: '',
  address: '', safetyScore: 100, experience: 0,
  status: 'Available', notes: ''
};

const DriversPage = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchDrivers(); }, [search, filterStatus]);

  const fetchDrivers = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      const res = await api.get('/drivers', { params });
      setDrivers(res.data);
    } catch {
      toast.error('Failed to load drivers', { theme: 'dark' });
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => { setForm(emptyForm); setEditing(null); setError(''); setShowModal(true); };
  const openEdit = (d) => {
    setForm({ ...d, licenseExpiryDate: d.licenseExpiryDate?.slice(0, 10) || '' });
    setEditing(d._id);
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (editing) {
        await api.put(`/drivers/${editing}`, form);
        toast.success('Driver updated!', { theme: 'dark' });
      } else {
        await api.post('/drivers', form);
        toast.success('Driver added!', { theme: 'dark' });
      }
      setShowModal(false);
      fetchDrivers();
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving driver');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete driver ${name}?`)) return;
    try {
      await api.delete(`/drivers/${id}`);
      toast.success('Driver deleted', { theme: 'dark' });
      fetchDrivers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete', { theme: 'dark' });
    }
  };

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const isExpiringSoon = (date) => {
    const exp = new Date(date);
    const now = new Date();
    const diff = (exp - now) / (1000 * 60 * 60 * 24);
    return diff <= 30 && diff > 0;
  };

  const isExpired = (date) => new Date(date) < new Date();

  const getScoreColor = (score) => {
    if (score >= 80) return 'var(--success)';
    if (score >= 60) return 'var(--warning)';
    return 'var(--danger)';
  };

  return (
    <div className="app-layout">
      <Navbar />
      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <h1>👤 Driver Management</h1>
            <p>{drivers.length} drivers registered</p>
          </div>
          <div className="topbar-right">
            <button className="topbar-btn btn-primary" onClick={openAdd}>+ Add Driver</button>
          </div>
        </div>

        <div className="page-container">
          <div className="table-container">
            <div className="table-header">
              <div className="table-title">All Drivers</div>
              <div className="table-toolbar">
                <div className="search-wrapper">
                  <span className="search-icon">🔍</span>
                  <input className="search-input" placeholder="Search drivers..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="">All Status</option>
                  {driverStatuses.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="loading-spinner"><div className="spinner"></div></div>
            ) : drivers.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👤</div>
                <div className="empty-title">No drivers found</div>
                <div className="empty-text">Add your first driver to get started</div>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Driver</th>
                    <th>License No.</th>
                    <th>Category</th>
                    <th>License Expiry</th>
                    <th>Contact</th>
                    <th>Safety Score</th>
                    <th>Experience</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {drivers.map(d => (
                    <tr key={d._id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{d.email || '—'}</div>
                      </td>
                      <td><span style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{d.licenseNumber}</span></td>
                      <td>
                        <span style={{ background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: '4px', padding: '2px 8px', fontSize: '12px', fontWeight: 600, color: 'var(--primary-light)' }}>
                          {d.licenseCategory}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: isExpired(d.licenseExpiryDate) ? 'var(--danger)' : isExpiringSoon(d.licenseExpiryDate) ? 'var(--warning)' : 'var(--text-secondary)', fontWeight: isExpired(d.licenseExpiryDate) || isExpiringSoon(d.licenseExpiryDate) ? 700 : 400 }}>
                          {new Date(d.licenseExpiryDate).toLocaleDateString('en-IN')}
                          {isExpired(d.licenseExpiryDate) && ' ⚠️ EXPIRED'}
                          {isExpiringSoon(d.licenseExpiryDate) && ' ⚡ Soon'}
                        </span>
                      </td>
                      <td>{d.contactNumber}</td>
                      <td>
                        <span style={{ color: getScoreColor(d.safetyScore), fontWeight: 700 }}>{d.safetyScore}/100</span>
                      </td>
                      <td>{d.experience} yrs</td>
                      <td><StatusBadge status={d.status} /></td>
                      <td>
                        <div className="action-btns">
                          <button className="topbar-btn btn-secondary btn-sm" onClick={() => openEdit(d)}>✏️</button>
                          <button className="topbar-btn btn-danger btn-sm" onClick={() => handleDelete(d._id, d.name)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title">{editing ? '✏️ Edit Driver' : '👤 Add New Driver'}</div>
                <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
              </div>

              {error && <div className="alert alert-error">⚠️ {error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input name="name" value={form.name} onChange={onChange} placeholder="e.g. Alex Kumar" required />
                  </div>
                  <div className="form-group">
                    <label>License Number *</label>
                    <input name="licenseNumber" value={form.licenseNumber} onChange={onChange} placeholder="e.g. DL0420230001234" required />
                  </div>
                  <div className="form-group">
                    <label>License Category *</label>
                    <select name="licenseCategory" value={form.licenseCategory} onChange={onChange}>
                      {licenseCategories.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>License Expiry Date *</label>
                    <input type="date" name="licenseExpiryDate" value={form.licenseExpiryDate} onChange={onChange} required />
                  </div>
                  <div className="form-group">
                    <label>Contact Number *</label>
                    <input name="contactNumber" value={form.contactNumber} onChange={onChange} placeholder="+91 9876543210" required />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" name="email" value={form.email} onChange={onChange} placeholder="driver@example.com" />
                  </div>
                  <div className="form-group">
                    <label>Safety Score (0-100)</label>
                    <input type="number" name="safetyScore" value={form.safetyScore} onChange={onChange} min="0" max="100" />
                  </div>
                  <div className="form-group">
                    <label>Experience (years)</label>
                    <input type="number" name="experience" value={form.experience} onChange={onChange} min="0" />
                  </div>
                  {editing && (
                    <div className="form-group">
                      <label>Status</label>
                      <select name="status" value={form.status} onChange={onChange}>
                        {driverStatuses.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                  )}
                  <div className="form-group full-width">
                    <label>Address</label>
                    <textarea name="address" value={form.address} onChange={onChange} placeholder="Driver address..." />
                  </div>
                </div>

                <div className="form-footer">
                  <button type="button" className="topbar-btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="topbar-btn btn-primary" disabled={submitting}>
                    {submitting ? '⏳ Saving...' : editing ? '💾 Update' : '✅ Add Driver'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriversPage;
