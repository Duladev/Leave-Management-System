import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ApplyLeave from './pages/ApplyLeave';
import MyLeaves from './pages/MyLeaves';
import PendingLeaves from './pages/PendingLeaves';
import TeamLeaves from './pages/TeamLeaves';
import ManageUsers from './pages/ManageUsers';
import ManageDepartments from './pages/ManageDepatments';
import ManageLeaveBalances from './pages/ManageLeaveBalances';
import RejectedLeaves from './pages/RejectedLeaves';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/apply-leave"
        element={
          <PrivateRoute>
            <ApplyLeave />
          </PrivateRoute>
        }
      />
      <Route
        path="/my-leaves"
        element={
          <PrivateRoute>
            <MyLeaves />
          </PrivateRoute>
        }
      />
      <Route
        path="/pending-leaves"
        element={
          <PrivateRoute>
            <PendingLeaves />
          </PrivateRoute>
        }
      />
      <Route
        path="/team-leaves"
        element={
          <PrivateRoute>
            <TeamLeaves />
          </PrivateRoute>
        }
      />
      <Route
        path="/manage-users"
        element={
          <PrivateRoute>
            <ManageUsers />
          </PrivateRoute>
        }
      />
      <Route
        path="/manage-departments"
        element={
          <PrivateRoute>
            <ManageDepartments />
          </PrivateRoute>
        }
      />,

      <Route
        path="/manage-leave-balances"
        element={
          <PrivateRoute>
            <ManageLeaveBalances />
          </PrivateRoute>
        }
      />
      <Route
        path="/rejected-leaves"
        element={
          <PrivateRoute>
            <RejectedLeaves />
          </PrivateRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;