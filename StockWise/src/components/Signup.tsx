import React, { useState } from 'react';
import { IonPage, IonContent, IonHeader, IonTitle, IonToolbar, IonInput, IonItem, IonLabel, IonButton } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../../firebaseConfig'; // Adjust the path as needed
import './Auth.css';

const Signup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // Add name state
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSignup = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // After creating the auth user, update their profile with the name
      await updateProfile(userCredential.user, {
        displayName: name
      });
      setError(null);
      navigate('/home');
    } catch (err: any) {
      setError(err.message);
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
          <IonLabel position="floating">Name</IonLabel>
          <IonInput
            type="text"
            value={name}
            onIonChange={(e) => setName(e.detail.value!)}
            required
          />
        </IonItem>

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
