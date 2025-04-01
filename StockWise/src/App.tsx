import React, { useEffect, useState } from 'react';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import Layout from './components/layout/Layout';
import { AppProvider } from './contexts/AppContext';

// Import pages
import Home from './pages/home/Home';
import Reports from './pages/reports/Reports';
import Settings from './pages/settings/Settings';
import InventoryManagement from './components/inventory/InventoryManagement';
import Restock from './pages/restock/Restock';
import Suppliers from './pages/suppliers/Suppliers';
import UserManagement from './users/UserManagement';

// Import components
import Login from './components/auth/Login';
import Orders from './pages/orders/Orders';
import Signup from './components/auth/Signup';
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
    <AppProvider>
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
    </AppProvider>
  );
};

export default App;
