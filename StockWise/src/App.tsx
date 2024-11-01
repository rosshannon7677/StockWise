import React, { useEffect, useState } from 'react';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './../firebaseConfig';

import Home from './pages/Home';
import Login from './components/Login';
import Signup from './components/Signup';
import ProtectedRoute from './ProtectedRoute';

setupIonicReact();

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Listen for auth state changes and set isAuthenticated accordingly
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user); // Set to true if there's a user, false otherwise
      setLoading(false); // Loading is done once we know the auth state
    });

    return () => unsubscribe(); // Clean up the listener on component unmount
  }, []);

  if (loading) return <div>Loading...</div>; // Show loading state while checking auth

  return (
    <IonApp>
      <Router>
        <IonRouterOutlet>
          <Routes>
            <Route
              path="/home"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={<Navigate to="/home" />} />
          </Routes>
        </IonRouterOutlet>
      </Router>
    </IonApp>
  );
};

export default App;
