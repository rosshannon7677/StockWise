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
import { auth } from '../../../firebaseConfig'; // Adjust the path as needed
import { setUserRole } from '../../firestoreService';
import './Auth.css';

const Signup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // Add name state
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null); // Add message state
  const navigate = useNavigate();

  const handleSignup = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with name
      await updateProfile(userCredential.user, {
        displayName: name
      });

      // Set initial user role as pending employee
      await setUserRole(userCredential.user.uid, {
        userId: userCredential.user.uid,
        email: email,
        name: name,
        role: 'employee',
        status: 'pending',
        metadata: {
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        }
      });

      // Sign out immediately after registration
      await auth.signOut();
      
      setMessage("Your account is pending admin approval. You will be notified when approved.");
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <IonPage>
      <IonContent className="auth-content" fullscreen>
        <div className="auth-container">
          {/* Add admin info banner */}
          <div className="admin-info-banner">
            <span>
              Admin Account: rosshannonty@gmail.com
              <span className="admin-badge">Primary Admin</span>
            </span>
          </div>

          <IonCard className="auth-card">
            <IonCardContent>
              <h2 className="auth-title">Create an Account</h2>
              <p className="auth-subtext">Account requires admin approval</p>

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
              {message && <p className="message">{message}</p>} {/* Add message display */}

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
