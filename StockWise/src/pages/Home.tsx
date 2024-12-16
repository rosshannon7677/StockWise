import React from "react";
import { 
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
  IonButton
} from '@ionic/react';
import { 
  logOutOutline,
  cubeOutline,
  statsChartOutline,
  settingsOutline 
} from 'ionicons/icons';
import './Home.css';
import { auth } from '../../firebaseConfig';
import { useIonRouter } from '@ionic/react';

const Home: React.FC = () => {
  const navigation = useIonRouter();

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      navigation.push('/login', 'root', 'replace');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <IonContent>
      <div className="dashboard-container">
        <h1 className="dashboard-title">Welcome to StockWise</h1>
        
        <IonGrid>
          <IonRow>
            <IonCol sizeMd="4" sizeSm="6" size="12">
              <IonCard className="dashboard-card" onClick={() => navigation.push('/inventory')}>
                <IonCardHeader>
                  <IonIcon icon={cubeOutline} className="card-icon" />
                  <IonCardTitle>Inventory</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  Manage your inventory items and stock levels
                </IonCardContent>
              </IonCard>
            </IonCol>

            <IonCol sizeMd="4" sizeSm="6" size="12">
              <IonCard className="dashboard-card" onClick={() => navigation.push('/reports')}>
                <IonCardHeader>
                  <IonIcon icon={statsChartOutline} className="card-icon" />
                  <IonCardTitle>Reports</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  View analytics and generate reports
                </IonCardContent>
              </IonCard>
            </IonCol>

            <IonCol sizeMd="4" sizeSm="6" size="12">
              <IonCard className="dashboard-card" onClick={() => navigation.push('/settings')}>
                <IonCardHeader>
                  <IonIcon icon={settingsOutline} className="card-icon" />
                  <IonCardTitle>Settings</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  Configure your application preferences
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>

       
      </div>
    </IonContent>
  );
};

export default Home;