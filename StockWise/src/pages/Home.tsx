import React, { useState, useEffect } from "react";
import { IonPage, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/react';
import './Home.css';
import InventoryList from "../components/InventoryList";
import { getInventoryItems } from "../firestoreService";

import AddItem from '../components/AddItem';


const Home: React.FC = () => {

  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    getInventoryItems((fetchedItems) => {
      setItems(fetchedItems); // Ensure `setItems` updates your state
    });
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Welcome to StockWise</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="home-content">
        <h2 className="home-title">Welcome to StockWise</h2>
        <p className="home-subtext">Your inventory management starts here.</p>
        
        <div className="inventory-container">
          <div className="add-item-section">
            <AddItem />
          </div>
          
          <div className="inventory-section">
            <h2>Current Inventory</h2>
            <InventoryList items={items} />
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;
