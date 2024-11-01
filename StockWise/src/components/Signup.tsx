import React, { useState } from 'react';
import { IonPage, IonContent, IonHeader, IonTitle, IonToolbar, IonInput, IonItem, IonLabel, IonButton } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebaseConfig'; // Adjust the path as needed
import './Auth.css';

const Signup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSignup = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setError(null); // Clear any previous errors
      navigate('/home'); // Redirect to home on successful signup
    } catch (err: any) {
      setError(err.message); // Display the error message if signup fails
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Sign Up</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="auth-content">
        <h2 className="auth-title">Create an Account</h2>
        <p className="auth-subtext">Please fill out the form to sign up.</p>

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

        <IonButton expand="block" onClick={handleSignup} className="auth-button">
          Sign Up
        </IonButton>

        <IonButton expand="block" fill="clear" onClick={() => navigate('/login')} className="auth-button">
          Already have an account? Log In
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Signup;
