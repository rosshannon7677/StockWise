import React, { useState, useEffect } from 'react';
import { 
  IonContent,
  IonItem,
  IonLabel,
  IonToggle,
  IonList,
  IonListHeader,
  IonSelect,
  IonSelectOption
} from '@ionic/react';
import { useTranslation } from 'react-i18next';
import '../i18n/config';  // Add this import
import './Settings.css';

const Settings: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const handleLanguageChange = (language: string) => {
    i18n.changeLanguage(language);
    localStorage.setItem('preferred-language', language);
  };

  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred-language');
    if (savedLanguage) {
      i18n.changeLanguage(savedLanguage);
    }
  }, [i18n]);

  const handleDarkModeToggle = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark', !darkMode);
  };

  return (
    <IonContent>
      <div className="settings-container">
        <h1 className="settings-title">{t('settings.title')}</h1>
        
        <IonList className="settings-list">
          <IonListHeader>{t('settings.appearance')}</IonListHeader>
          <IonItem>
            <IonLabel>{t('settings.darkMode')}</IonLabel>
            <IonToggle 
              checked={darkMode} 
              onIonChange={handleDarkModeToggle}
            />
          </IonItem>

          <IonItem>
            <IonLabel>{t('settings.notifications')}</IonLabel>
            <IonToggle 
              checked={notifications} 
              onIonChange={e => setNotifications(e.detail.checked)}
            />
          </IonItem>

          <IonItem>
            <IonLabel>{t('settings.language')}</IonLabel>
            <IonSelect 
              value={i18n.language}
              onIonChange={e => handleLanguageChange(e.detail.value)}
              interface="popover"
            >
              <IonSelectOption value="en">{t('settings.languages.en')}</IonSelectOption>
              <IonSelectOption value="es">{t('settings.languages.es')}</IonSelectOption>
              <IonSelectOption value="fr">{t('settings.languages.fr')}</IonSelectOption>
              <IonSelectOption value="ga">{t('settings.languages.ga')}</IonSelectOption>
            </IonSelect>
          </IonItem>
        </IonList>
      </div>
    </IonContent>
  );
};

export default Settings;