import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { Navbar } from './components/Navbar';
import Dashboard from './pages/Dashboard';
import ClaimEntry from './pages/ClaimEntry';
import PredictionResult from './pages/PredictionResult';
import FraudTrends from './pages/FraudTrends';
import ClaimsHistory from './pages/ClaimsHistory';
import AdminPanel from './pages/AdminPanel';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import { AuthProvider, AuthContext } from './context/AuthContext';
import './App.css';

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

const HomeRedirect = () => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/dashboard" replace />;
  return <Navigate to="/claim-entry" replace />;
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* User & Admin Routes */}
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/claim-entry" element={<ProtectedRoute><AppLayout><ClaimEntry /></AppLayout></ProtectedRoute>} />
          <Route path="/claims-history" element={<ProtectedRoute><AppLayout><ClaimsHistory /></AppLayout></ProtectedRoute>} />
          <Route path="/about" element={<ProtectedRoute><AppLayout><About /></AppLayout></ProtectedRoute>} />

          {/* Admin Only Routes */}
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
          <Route path="/prediction-result" element={<ProtectedRoute allowedRoles={['admin']}><AppLayout><PredictionResult /></AppLayout></ProtectedRoute>} />
          <Route path="/claims/:id" element={<ProtectedRoute allowedRoles={['admin']}><AppLayout><PredictionResult /></AppLayout></ProtectedRoute>} />
          <Route path="/fraud-trends" element={<ProtectedRoute allowedRoles={['admin']}><AppLayout><FraudTrends /></AppLayout></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AppLayout><AdminPanel /></AppLayout></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
