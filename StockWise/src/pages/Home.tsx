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
        <h2 className="home-title">Hello, User!</h2>
        <p className="home-subtext">Your inventory management starts here.</p>
        <div>
      <h1>Inventory Management System</h1>
      <AddItem />
      {/* Additional home page content can go here */}
      <InventoryList items={items} />
    </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;
