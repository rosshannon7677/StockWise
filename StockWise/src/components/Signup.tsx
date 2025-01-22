import React, { useState } from 'react';
import { 
  IonPage, 
  IonContent,
  IonInput, 
  IonItem, 
  IonButton,
  IonCard,
  IonCardContent
} from '@ionic/react';
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
      <IonContent className="auth-content" fullscreen>
        <div className="auth-container">
          <IonCard className="auth-card">
            <IonCardContent>
              <h2 className="auth-title">Create an Account</h2>
              <p className="auth-subtext">Please fill out the form to sign up.</p>

              <IonItem className="auth-item">
                <IonInput
                  type="text"
                  value={name}
                  onIonChange={(e) => setName(e.detail.value!)}
                  required
                  label="Name"
                  labelPlacement="floating"
                  aria-label="Name"
                />
              </IonItem>

              <IonItem className="auth-item">
                <IonInput
                  type="email"
                  value={email}
                  onIonChange={(e) => setEmail(e.detail.value!)}
                  required
                  label="Email"
                  labelPlacement="floating"
                  aria-label="Email"
                />
              </IonItem>

              <IonItem className="auth-item">
                <IonInput
                  type="password"
                  value={password}
                  onIonChange={(e) => setPassword(e.detail.value!)}
                  required
                  label="Password"
                  labelPlacement="floating"
                  aria-label="Password"
                />
              </IonItem>

              {error && <p className="error-message">{error}</p>}

              <IonButton 
                expand="block" 
                onClick={handleSignup} 
                className="auth-button"
              >
                Sign Up
              </IonButton>

              <IonButton 
                expand="block" 
                fill="clear" 
                onClick={() => navigate('/login')} 
                className="auth-button"
                color="medium"
              >
                Already have an account? Log In
              </IonButton>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Signup;
