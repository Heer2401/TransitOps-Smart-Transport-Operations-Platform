const StatusBadge = ({ status }) => {
  const map = {
    'Available': 'badge-available',
    'On Trip': 'badge-on-trip',
    'In Shop': 'badge-in-shop',
    'Retired': 'badge-retired',
    'Suspended': 'badge-suspended',
    'Off Duty': 'badge-off-duty',
    'Draft': 'badge-draft',
    'Dispatched': 'badge-dispatched',
    'Completed': 'badge-completed',
    'Cancelled': 'badge-cancelled',
    'Open': 'badge-open',
    'Closed': 'badge-closed',
  };

  return (
    <span className={`badge ${map[status] || 'badge-draft'}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
