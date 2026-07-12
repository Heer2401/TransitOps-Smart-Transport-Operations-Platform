import { useState, useEffect } from 'react';
import api from '../api/axios';
import Sidebar from '../components/Sidebar';
import StatusBadge from '../components/StatusBadge';
import { toast } from 'react-toastify';

const vehicleTypes = ['Truck', 'Van', 'Bus', 'Car', 'Motorcycle', 'Heavy Equipment'];
const statuses = ['Available', 'On Trip', 'In Shop', 'Retired'];
const fuelTypes = ['Diesel', 'Petrol', 'Electric', 'Hybrid', 'CNG'];

const emptyForm = {
  registrationNumber: '', name: '', model: '', type: 'Truck',
  maxLoadCapacity: '', odometer: 0, acquisitionCost: '',
  region: '', year: '', fuelType: 'Diesel', notes: '', status: 'Available'
};

const VehiclesPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchVehicles(); }, [search, filterStatus, filterType]);

  const fetchVehicles = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      if (filterType) params.type = filterType;
      const res = await api.get('/vehicles', { params });
      setVehicles(res.data);
    } catch (err) {
      toast.error('Failed to load vehicles', { theme: 'dark' });
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => { setForm(emptyForm); setEditing(null); setError(''); setShowModal(true); };
  const openEdit = (v) => { setForm({ ...v }); setEditing(v._id); setError(''); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (editing) {
        await api.put(`/vehicles/${editing}`, form);
        toast.success('Vehicle updated!', { theme: 'dark' });
      } else {
        await api.post('/vehicles', form);
        toast.success('Vehicle added!', { theme: 'dark' });
      }
      setShowModal(false);
      fetchVehicles();
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving vehicle');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, reg) => {
    if (!confirm(`Delete vehicle ${reg}?`)) return;
    try {
      await api.delete(`/vehicles/${id}`);
      toast.success('Vehicle deleted', { theme: 'dark' });
      fetchVehicles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete', { theme: 'dark' });
    }
  };

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const fmt = (n) => new Intl.NumberFormat('en-IN').format(n || 0);

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <h1>🚛 Vehicle Registry</h1>
            <p>{vehicles.length} vehicles in fleet</p>
          </div>
          <div className="topbar-right">
            <button className="topbar-btn btn-primary" onClick={openAdd}>+ Add Vehicle</button>
          </div>
        </div>

        <div className="page-container">
          <div className="table-container">
            <div className="table-header">
              <div className="table-title">All Vehicles</div>
              <div className="table-toolbar">
                <div className="search-wrapper">
                  <span className="search-icon">🔍</span>
                  <input className="search-input" placeholder="Search vehicles..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="">All Status</option>
                  {statuses.map(s => <option key={s}>{s}</option>)}
                </select>
                <select className="filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
                  <option value="">All Types</option>
                  {vehicleTypes.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="loading-spinner"><div className="spinner"></div></div>
            ) : vehicles.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🚛</div>
                <div className="empty-title">No vehicles found</div>
                <div className="empty-text">Add your first vehicle to get started</div>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Registration</th>
                    <th>Name / Model</th>
                    <th>Type</th>
                    <th>Capacity</th>
                    <th>Odometer</th>
                    <th>Acq. Cost</th>
                    <th>Region</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map(v => (
                    <tr key={v._id}>
                      <td><strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{v.registrationNumber}</strong></td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{v.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{v.model} {v.year && `· ${v.year}`}</div>
                      </td>
                      <td>{v.type}</td>
                      <td>{fmt(v.maxLoadCapacity)} kg</td>
                      <td>{fmt(v.odometer)} km</td>
                      <td>₹{fmt(v.acquisitionCost)}</td>
                      <td>{v.region || '—'}</td>
                      <td><StatusBadge status={v.status} /></td>
                      <td>
                        <div className="action-btns">
                          <button className="topbar-btn btn-secondary btn-sm" onClick={() => openEdit(v)}>✏️</button>
                          <button className="topbar-btn btn-danger btn-sm" onClick={() => handleDelete(v._id, v.registrationNumber)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title">{editing ? '✏️ Edit Vehicle' : '🚛 Add New Vehicle'}</div>
                <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
              </div>

              {error && <div className="alert alert-error">⚠️ {error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Registration Number *</label>
                    <input name="registrationNumber" value={form.registrationNumber} onChange={onChange} placeholder="e.g. MH04AB1234" required />
                  </div>
                  <div className="form-group">
                    <label>Vehicle Name *</label>
                    <input name="name" value={form.name} onChange={onChange} placeholder="e.g. Van-05" required />
                  </div>
                  <div className="form-group">
                    <label>Model *</label>
                    <input name="model" value={form.model} onChange={onChange} placeholder="e.g. Tata Ace" required />
                  </div>
                  <div className="form-group">
                    <label>Type *</label>
                    <select name="type" value={form.type} onChange={onChange}>
                      {vehicleTypes.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Max Load Capacity (kg) *</label>
                    <input type="number" name="maxLoadCapacity" value={form.maxLoadCapacity} onChange={onChange} placeholder="500" required min="0" />
                  </div>
                  <div className="form-group">
                    <label>Odometer (km)</label>
                    <input type="number" name="odometer" value={form.odometer} onChange={onChange} placeholder="0" min="0" />
                  </div>
                  <div className="form-group">
                    <label>Acquisition Cost (₹) *</label>
                    <input type="number" name="acquisitionCost" value={form.acquisitionCost} onChange={onChange} placeholder="500000" required min="0" />
                  </div>
                  <div className="form-group">
                    <label>Year</label>
                    <input type="number" name="year" value={form.year} onChange={onChange} placeholder="2022" min="1990" max="2030" />
                  </div>
                  <div className="form-group">
                    <label>Fuel Type</label>
                    <select name="fuelType" value={form.fuelType} onChange={onChange}>
                      {fuelTypes.map(f => <option key={f}>{f}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Region</label>
                    <input name="region" value={form.region} onChange={onChange} placeholder="e.g. Mumbai North" />
                  </div>
                  {editing && (
                    <div className="form-group">
                      <label>Status</label>
                      <select name="status" value={form.status} onChange={onChange}>
                        {statuses.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                  )}
                  <div className="form-group full-width">
                    <label>Notes</label>
                    <textarea name="notes" value={form.notes} onChange={onChange} placeholder="Additional information..." />
                  </div>
                </div>

                <div className="form-footer">
                  <button type="button" className="topbar-btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="topbar-btn btn-primary" disabled={submitting}>
                    {submitting ? '⏳ Saving...' : editing ? '💾 Update' : '✅ Add Vehicle'}
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

export default VehiclesPage;
