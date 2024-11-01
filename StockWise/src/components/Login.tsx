import React, { useState } from 'react';
import { IonPage, IonContent, IonHeader, IonTitle, IonToolbar, IonInput, IonItem, IonLabel, IonButton } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebaseConfig'; // Adjust the path as needed
import './Auth.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setError(null); // Clear any previous errors
      navigate('/home'); // Redirect to home on successful login
    } catch (err: any) {
      setError(err.message); // Display the error message if login fails
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Login</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="auth-content">
        <h2 className="auth-title">Welcome Back!</h2>
        <p className="auth-subtext">Please log in to continue.</p>

        <IonItem className="auth-item">
          <IonLabel position="floating">Email</IonLabel>
          <IonInput
            type="email"
            value={email}
            onIonChange={(e) => setEmail(e.detail.value!)}
            required
          />
        </IonItem>

        <IonItem className="auth-item">
          <IonLabel position="floating">Password</IonLabel>
          <IonInput
            type="password"
            value={password}
            onIonChange={(e) => setPassword(e.detail.value!)}
            required
          />
        </IonItem>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <IonButton expand="block" onClick={handleLogin} className="auth-button">
          Log In
        </IonButton>

        <IonButton expand="block" fill="clear" onClick={() => navigate('/signup')} className="auth-button">
          Don’t have an account? Sign Up
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Login;
