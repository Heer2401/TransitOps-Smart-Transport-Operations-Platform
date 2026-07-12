import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return (
    <div className="loading-spinner" style={{ minHeight: '100vh' }}>
      <div className="spinner"></div>
      <p className="loading-text">Loading TransitOps...</p>
    </div>
  );
  
  return user ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
