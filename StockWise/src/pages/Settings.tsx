import React, { useState } from 'react';
import { 
  IonContent,
  IonItem,
  IonLabel,
  IonToggle,
  IonList,
  IonListHeader,
  IonSelect,
  IonSelectOption,
  IonButton
} from '@ionic/react';
import './Settings.css';

const Settings: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState('en');

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

     
          </IonItem>

          <IonItem>
            <IonLabel>Language</IonLabel>
            <IonSelect 
              value={language}
              onIonChange={e => setLanguage(e.detail.value)}
            >
              <IonSelectOption value="en">English</IonSelectOption>
              <IonSelectOption value="es">Spanish</IonSelectOption>
              <IonSelectOption value="fr">French</IonSelectOption>
            </IonSelect>
          </IonItem>
        </IonList>

        <div className="settings-actions">
          <IonButton expand="block" color="primary">
            Save Changes
          </IonButton>
        </div>
      </div>
    </IonContent>
  );
};

export default Settings;