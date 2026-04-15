/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { Explorer } from './pages/Explorer';
import { Predictor } from './pages/Predictor';
import { Recommender } from './pages/Recommender';
import { Clusters } from './pages/Clusters';
import { Login } from './pages/Login';
import { ThemeProvider } from './components/theme-provider';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function AppContent() {
  const { isAuthenticated } = useAuth();
  
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {isAuthenticated && <Navbar />}
      <main className="flex-1 flex flex-col">
        <Routes>
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />} />
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/explore" element={<ProtectedRoute><Explorer /></ProtectedRoute>} />
          <Route path="/predict" element={<ProtectedRoute><Predictor /></ProtectedRoute>} />
          <Route path="/recommend" element={<ProtectedRoute><Recommender /></ProtectedRoute>} />
          <Route path="/clusters" element={<ProtectedRoute><Clusters /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
