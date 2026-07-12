/**
 * EmptyState — Illustrated empty placeholder component
 * Used across all data tables when no records are found.
 */
const EmptyState = ({ image, title, description, action }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '56px 24px',
    textAlign: 'center',
    gap: '12px'
  }}>
    {image && (
      <img
        src={image}
        alt={title}
        style={{
          width: '180px',
          height: '180px',
          objectFit: 'contain',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '8px',
          opacity: 0.92,
          filter: 'drop-shadow(0 8px 20px rgba(167,139,250,0.15))'
        }}
      />
    )}
    <div style={{
      fontFamily: 'Space Grotesk, sans-serif',
      fontSize: '17px',
      fontWeight: 700,
      color: 'var(--text-primary)'
    }}>
      {title}
    </div>
    {description && (
      <div style={{
        fontSize: '13px',
        color: 'var(--text-muted)',
        maxWidth: '300px',
        lineHeight: 1.6
      }}>
        {description}
      </div>
    )}
    {action && (
      <div style={{ marginTop: '8px' }}>
        {action}
      </div>
    )}
  </div>
);

export default EmptyState;
