import React, { useState } from 'react';
import { 
  IonContent,
  IonItem,
  IonLabel,
  IonToggle,
  IonList,
  IonListHeader
} from '@ionic/react';
import './Settings.css';

const Settings: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const handleDarkModeToggle = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark', !darkMode);
  };

  return (
    <IonContent>
      <div className="settings-container">
        <h1 className="settings-title">Settings</h1>
        
        <IonList className="settings-list">
          <IonListHeader>Appearance</IonListHeader>
          <IonItem>
            <IonLabel>Dark Mode</IonLabel>
            <IonToggle 
              checked={darkMode} 
              onIonChange={handleDarkModeToggle}
            />
          </IonItem>

          <IonItem>
            <IonLabel>Notifications</IonLabel>
            <IonToggle 
              checked={notifications} 
              onIonChange={e => setNotifications(e.detail.checked)}
            />
          </IonItem>
        </IonList>
      </div>
    </IonContent>
  );
};

export default Settings;