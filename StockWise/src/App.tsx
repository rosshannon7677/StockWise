import React, { useEffect, useState } from 'react';
import './i18n/config';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import Layout from './components/Layout';

// Import pages
import Home from './pages/Home';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import InventoryManagement from './components/InventoryManagement';
import Restock from './pages/Restock';
import Suppliers from './pages/Suppliers';
import UserManagement from './components/UserManagement';

// Import components
import Login from './components/Login';
import Orders from './pages/Orders';
import Signup from './components/Signup';
import ProtectedRoute from './ProtectedRoute';

setupIonicReact();

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <IonApp>
      <Router>
        <IonRouterOutlet>
          <Routes>
            <Route path="/" element={<Navigate to="/home" />} />
            <Route
              path="/home"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <Layout>
                    <Home />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <Layout>
                    <InventoryManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <Layout>
                    <Reports />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <Layout>
                    <Settings />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/restock"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <Layout>
                    <Restock />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/suppliers"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <Layout>
                    <Suppliers />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <Layout>
                    <Orders />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <Layout>
                    <UserManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Routes>
        </IonRouterOutlet>
      </Router>
    </IonApp>
  );
};

export default App;
