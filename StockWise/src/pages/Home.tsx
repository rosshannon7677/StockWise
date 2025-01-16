import React, { useState, useEffect } from "react";
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
  checkmarkCircleOutline,
  receiptOutline,
  cartOutline,
  trendingUpOutline,
  statsChartOutline,
  settingsOutline 
} from 'ionicons/icons';
import './Home.css';
import { auth } from '../../firebaseConfig';
import { useIonRouter } from '@ionic/react';
import { getInventoryItems } from '../firestoreService';
import { InventoryItem } from '../firestoreService';

const Home: React.FC = () => {
  const navigation = useIonRouter();
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);

  useEffect(() => {
    getInventoryItems((items) => {
      setInventoryItems(items);
    });
  }, []);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      navigation.push('/login', 'root', 'replace');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const cardComponent = [
    {
      icon: cubeOutline,
      title: "Total Items",
      subTitle: inventoryItems.length.toString(),
      color: "primary"
    },
    {
      icon: checkmarkCircleOutline,
      title: "In Stock",
      subTitle: inventoryItems.filter(item => item.quantity > 0).length.toString(),
      color: "success"
    },
    {
      icon: cartOutline,
      title: "Low Stock",
      subTitle: inventoryItems.filter(item => item.quantity < 10).length.toString(),
      color: "warning"
    },
    {
      icon: receiptOutline,
      title: "Total Value",
      subTitle: `€${inventoryItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}`,
      color: "tertiary"
    }
  ];

  // Get top selling products
  const topProducts = [...inventoryItems]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  return (
    <IonContent>
      <div className="dashboard-container">
        <h1 className="dashboard-title">Dashboard Overview</h1>
        
        <IonGrid>
          {/* Info Cards */}
          <IonRow>
            {cardComponent.map((card, index) => (
              <IonCol sizeMd="3" sizeSm="6" size="12" key={index}>
                <IonCard className="dashboard-card">
                  <IonCardHeader>
                    <IonIcon icon={card.icon} className="card-icon" color={card.color} />
                    <IonCardTitle>{card.title}</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <h2 className="metric-value">{card.subTitle}</h2>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            ))}
          </IonRow>

          {/* Charts and Tables */}
          <IonRow>
            <IonCol sizeMd="8" sizeSm="12">
              <IonCard className="dashboard-card">
                <IonCardHeader>
                  <IonIcon icon={trendingUpOutline} className="card-icon" />
                  <IonCardTitle>Inventory Overview</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <div className="overview-stats">
                    <p>Total Categories: {new Set(inventoryItems.map(item => item.category)).size}</p>
                    <p>Average Stock Level: {(inventoryItems.reduce((sum, item) => sum + item.quantity, 0) / inventoryItems.length || 0).toFixed(0)} units</p>
                    <p>Average Item Value: €{(inventoryItems.reduce((sum, item) => sum + item.price, 0) / inventoryItems.length || 0).toFixed(2)}</p>
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>

            <IonCol sizeMd="4" sizeSm="12">
              <IonCard className="dashboard-card">
                <IonCardHeader>
                  <IonCardTitle>Top Products</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <div className="top-products">
                    {topProducts.map((product, index) => (
                      <div key={index} className="product-item">
                        <span className="product-name">{product.name}</span>
                        <span className="product-quantity">Qty: {product.quantity}</span>
                        <span className="product-price">€{product.price}</span>
                      </div>
                    ))}
                  </div>
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