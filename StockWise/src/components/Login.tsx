import React, { useState } from 'react';
import { 
  IonPage, 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonInput, 
  IonItem, 
  IonLabel, 
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent
} from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  OAuthProvider,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { logoGoogle, logoApple } from 'ionicons/icons';
import './Auth.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleEmailLogin = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setError(null);
      navigate('/home');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSocialLogin = async (provider: GoogleAuthProvider | OAuthProvider) => {
    try {
      // Set persistence to LOCAL to maintain the session
      await setPersistence(auth, browserLocalPersistence);
      const result = await signInWithPopup(auth, provider);
      
      // Get the Google Access Token
      if (provider instanceof GoogleAuthProvider) {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential?.accessToken;
        // You can store the token if needed
      }
      
      setError(null);
      navigate('/home');
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup was closed before completion');
      } else {
        setError(err.message);
      }
      console.error('Social login error:', err);
    }
  };

  return (
    <IonPage>
      <IonContent className="auth-content" fullscreen>
        <div className="auth-container">
          <IonCard className="auth-card">
            <IonCardContent>
              <div className="social-login-buttons">
                <IonButton 
                  expand="block" 
                  onClick={() => handleSocialLogin(new GoogleAuthProvider())}
                  className="google-button"
                >
                  <IonIcon slot="start" icon={logoGoogle} />
                  Continue with Google
                </IonButton>

                <IonButton 
                  expand="block" 
                  onClick={() => handleSocialLogin(new OAuthProvider('apple'))}
                  className="apple-button"
                >
                  <IonIcon slot="start" icon={logoApple} />
                  Continue with Apple
                </IonButton>
              </div>

              <div className="separator">
                <span>or</span>
              </div>

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
                onClick={() => handleEmailLogin(email, password)} 
                className="auth-button"
              >
                Log In with Email
              </IonButton>

              <IonButton 
                expand="block" 
                fill="clear" 
                onClick={() => navigate('/signup')} 
                className="auth-button"
                color="medium"
              >
                Don't have an account? Sign Up
              </IonButton>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;