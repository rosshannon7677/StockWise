import React, { useState } from "react";
import { 
  IonPage, 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon
} from '@ionic/react';
import { 
  logOutOutline 
} from 'ionicons/icons';
import './Home.css';
import { auth } from '../../firebaseConfig';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>     
          <IonButtons slot="end">  
            <IonButton onClick={handleSignOut}>
              <IonIcon slot="start" icon={logOutOutline} />
              Sign Out
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="home-content">
          <h2 className="home-title">Welcome to StockWise</h2>
          <p className="home-subtext">Your inventory management starts here.</p>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;
