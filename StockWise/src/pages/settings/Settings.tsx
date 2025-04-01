import React, { useState, useEffect } from 'react';
import { 
  IonContent,
  IonItem,
  IonLabel,
  IonToggle,
  IonList,
  IonListHeader,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonIcon
} from '@ionic/react';
import { languageOutline } from 'ionicons/icons';
import './Settings.css';
import { useApp } from '../../contexts/AppContext';

const Settings: React.FC = () => {
  const { 
    defaultView, 
    setDefaultView, 
    itemsPerPage, 
    setItemsPerPage
  } = useApp();

  return (
    <IonContent>
      <div className="settings-container">
        <IonList className="settings-list">
          <IonListHeader>
            <IonIcon icon={languageOutline} />
            <IonLabel>Preferences</IonLabel>
          </IonListHeader>

          <IonItem>
            <IonLabel>Default View</IonLabel>
            <IonSelect
              value={defaultView}
              onIonChange={e => setDefaultView(e.detail.value)}
              interface="popover"
            >
              <IonSelectOption value="inventory">Inventory</IonSelectOption>
              <IonSelectOption value="orders">Orders</IonSelectOption>
              <IonSelectOption value="suppliers">Suppliers</IonSelectOption>
              <IonSelectOption value="restock">Restock</IonSelectOption>
            </IonSelect>
          </IonItem>

          <IonItem>
            <IonLabel>Items Per Page</IonLabel>
            <IonSelect
              value={String(itemsPerPage)}
              onIonChange={e => setItemsPerPage(parseInt(e.detail.value))}
              interface="popover"
            >
              <IonSelectOption value="5">5</IonSelectOption>
              <IonSelectOption value="10">10</IonSelectOption>
              <IonSelectOption value="20">20</IonSelectOption>
              <IonSelectOption value="50">50</IonSelectOption>
            </IonSelect>
          </IonItem>
        </IonList>
      </div>
    </IonContent>
  );
};

export default Settings;