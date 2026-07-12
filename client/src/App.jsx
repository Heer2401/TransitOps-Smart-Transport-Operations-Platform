import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import VehiclesPage from './pages/VehiclesPage';
import DriversPage from './pages/DriversPage';
import TripsPage from './pages/TripsPage';
import TripDetailPage from './pages/TripDetailPage';
import MaintenancePage from './pages/MaintenancePage';
import FuelExpensePage from './pages/FuelExpensePage';
import ReportsPage from './pages/ReportsPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/" element={
            <ProtectedRoute><DashboardPage /></ProtectedRoute>
          } />
          <Route path="/vehicles" element={
            <ProtectedRoute><VehiclesPage /></ProtectedRoute>
          } />
          <Route path="/drivers" element={
            <ProtectedRoute><DriversPage /></ProtectedRoute>
          } />
          <Route path="/trips" element={
            <ProtectedRoute><TripsPage /></ProtectedRoute>
          } />
          <Route path="/trips/:id" element={
            <ProtectedRoute><TripDetailPage /></ProtectedRoute>
          } />
          <Route path="/maintenance" element={
            <ProtectedRoute><MaintenancePage /></ProtectedRoute>
          } />
          <Route path="/fuel" element={
            <ProtectedRoute><FuelExpensePage /></ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute><ReportsPage /></ProtectedRoute>
          } />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          theme="dark"
          toastStyle={{
            background: '#111827',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
