import { useState, useEffect } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import emptyMaintenanceImg from '../assets/empty_maintenance.png';
import { toast } from 'react-toastify';

const maintenanceTypes = ['Oil Change', 'Tire Replacement', 'Brake Service', 'Engine Repair', 'Transmission', 'Electrical', 'Body Work', 'Annual Service', 'Inspection', 'Other'];

const emptyForm = {
  vehicle: '', type: 'Oil Change', description: '', cost: '',
  startDate: new Date().toISOString().slice(0, 10),
  mechanicName: '', workshopName: '', odometer: '', notes: ''
};

const MaintenancePage = () => {
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [closeForm, setCloseForm] = useState({ endDate: new Date().toISOString().slice(0, 10), cost: '' });
  const [filterStatus, setFilterStatus] = useState('');
  const [filterVehicle, setFilterVehicle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAll();
  }, [filterStatus, filterVehicle]);

  const fetchAll = async () => {
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterVehicle) params.vehicle = filterVehicle;
      const [logsRes, vehiclesRes] = await Promise.all([
        api.get('/maintenance', { params }),
        api.get('/vehicles')
      ]);
      setLogs(logsRes.data);
      setVehicles(vehiclesRes.data);
    } catch {
      toast.error('Failed to load maintenance logs', { theme: 'dark' });
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => { setForm(emptyForm); setError(''); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/maintenance', form);
      toast.success('Maintenance record created! Vehicle status set to In Shop.', { theme: 'dark' });
      setShowModal(false);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating record');
    } finally { setSubmitting(false); }
  };

  const openClose = (log) => {
    setSelectedLog(log);
    setCloseForm({ endDate: new Date().toISOString().slice(0, 10), cost: log.cost || '' });
    setShowCloseModal(true);
  };

  const handleClose = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.patch(`/maintenance/${selectedLog._id}/close`, closeForm);
      toast.success('Maintenance closed! Vehicle restored to Available.', { theme: 'dark' });
      setShowCloseModal(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Close failed', { theme: 'dark' });
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this maintenance record?')) return;
    try {
      await api.delete(`/maintenance/${id}`);
      toast.success('Deleted', { theme: 'dark' });
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete', { theme: 'dark' });
    }
  };

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const fmt = (n) => new Intl.NumberFormat('en-IN').format(n || 0);

  return (
    <div className="app-layout">
      <Navbar />
      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <h1>🔧 Maintenance</h1>
            <p>{logs.filter(l => l.status === 'Open').length} open records</p>
          </div>
          <div className="topbar-right">
            <button className="topbar-btn btn-primary" onClick={openAdd}>+ Add Record</button>
          </div>
        </div>

        <div className="page-container">
          <div className="table-container">
            <div className="table-header">
              <div className="table-title">Maintenance Logs</div>
              <div className="table-toolbar">
                <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="">All Status</option>
                  <option>Open</option>
                  <option>Closed</option>
                </select>
                <select className="filter-select" value={filterVehicle} onChange={e => setFilterVehicle(e.target.value)}>
                  <option value="">All Vehicles</option>
                  {vehicles.map(v => <option key={v._id} value={v._id}>{v.registrationNumber} — {v.name}</option>)}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="loading-spinner"><div className="spinner"></div></div>
            ) : logs.length === 0 ? (
              <EmptyState
                image={emptyMaintenanceImg}
                title="No maintenance records"
                description="All vehicles are in great shape! Add a maintenance record when a vehicle needs attention."
              />
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Cost</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Mechanic</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(l => (
                    <tr key={l._id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '12px' }}>{l.vehicle?.registrationNumber}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{l.vehicle?.name}</div>
                      </td>
                      <td>
                        <span style={{ background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.15)', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', color: 'var(--accent)' }}>
                          {l.type}
                        </span>
                      </td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.description}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₹{fmt(l.cost)}</td>
                      <td style={{ fontSize: '12px' }}>{new Date(l.startDate).toLocaleDateString('en-IN')}</td>
                      <td style={{ fontSize: '12px' }}>{l.endDate ? new Date(l.endDate).toLocaleDateString('en-IN') : '—'}</td>
                      <td>{l.mechanicName || '—'}</td>
                      <td><StatusBadge status={l.status} /></td>
                      <td>
                        <div className="action-btns">
                          {l.status === 'Open' && (
                            <button className="topbar-btn btn-success btn-sm" onClick={() => openClose(l)}>✅ Close</button>
                          )}
                          <button className="topbar-btn btn-danger btn-sm" onClick={() => handleDelete(l._id)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Add Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title">🔧 Add Maintenance Record</div>
                <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
              </div>
              {error && <div className="alert alert-error">⚠️ {error}</div>}
              <div className="alert alert-warning">⚠️ Creating a record will automatically set the vehicle status to <strong>In Shop</strong>.</div>
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Vehicle *</label>
                    <select name="vehicle" value={form.vehicle} onChange={onChange} required>
                      <option value="">Select vehicle</option>
                      {vehicles.filter(v => v.status !== 'On Trip').map(v => (
                        <option key={v._id} value={v._id}>{v.registrationNumber} — {v.name} ({v.status})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Maintenance Type *</label>
                    <select name="type" value={form.type} onChange={onChange}>
                      {maintenanceTypes.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group full-width">
                    <label>Description *</label>
                    <textarea name="description" value={form.description} onChange={onChange} placeholder="Describe the maintenance work..." required />
                  </div>
                  <div className="form-group">
                    <label>Estimated Cost (₹) *</label>
                    <input type="number" name="cost" value={form.cost} onChange={onChange} placeholder="e.g. 5000" required min="0" />
                  </div>
                  <div className="form-group">
                    <label>Start Date</label>
                    <input type="date" name="startDate" value={form.startDate} onChange={onChange} />
                  </div>
                  <div className="form-group">
                    <label>Mechanic Name</label>
                    <input name="mechanicName" value={form.mechanicName} onChange={onChange} placeholder="e.g. Ramesh Kumar" />
                  </div>
                  <div className="form-group">
                    <label>Workshop Name</label>
                    <input name="workshopName" value={form.workshopName} onChange={onChange} placeholder="e.g. Auto Service Hub" />
                  </div>
                  <div className="form-group">
                    <label>Odometer Reading</label>
                    <input type="number" name="odometer" value={form.odometer} onChange={onChange} placeholder="km" />
                  </div>
                </div>
                <div className="form-footer">
                  <button type="button" className="topbar-btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="topbar-btn btn-primary" disabled={submitting}>
                    {submitting ? '⏳ Saving...' : '✅ Create Record'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Close Modal */}
        {showCloseModal && (
          <div className="modal-overlay" onClick={() => setShowCloseModal(false)}>
            <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title">✅ Close Maintenance Record</div>
                <button className="modal-close" onClick={() => setShowCloseModal(false)}>✕</button>
              </div>
              <div style={{ background: 'rgba(6,214,160,0.07)', border: '1px solid rgba(6,214,160,0.15)', borderRadius: '8px', padding: '12px', marginBottom: '20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                {selectedLog?.vehicle?.registrationNumber} — {selectedLog?.type}<br />
                Closing this record will restore the vehicle to <strong style={{ color: 'var(--success)' }}>Available</strong>.
              </div>
              <form onSubmit={handleClose}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="form-group">
                    <label>Completion Date</label>
                    <input type="date" value={closeForm.endDate} onChange={e => setCloseForm({ ...closeForm, endDate: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Final Cost (₹)</label>
                    <input type="number" value={closeForm.cost} onChange={e => setCloseForm({ ...closeForm, cost: e.target.value })} />
                  </div>
                </div>
                <div className="form-footer">
                  <button type="button" className="topbar-btn btn-secondary" onClick={() => setShowCloseModal(false)}>Cancel</button>
                  <button type="submit" className="topbar-btn btn-success" disabled={submitting}>
                    {submitting ? '⏳...' : '✅ Close Record'}
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

export default MaintenancePage;
