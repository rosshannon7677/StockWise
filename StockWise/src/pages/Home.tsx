import React from 'react';
import { IonPage, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/react';
import './Home.css';

const Home: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Welcome to StockWise</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="home-content">
        <h2 className="home-title">Hello, User!</h2>
        <p className="home-subtext">Your inventory management starts here.</p>
      </IonContent>
    </IonPage>
  );
};

export default Home;
