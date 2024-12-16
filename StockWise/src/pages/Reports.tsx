import React, { useState, useEffect } from 'react';
import { 
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon
} from '@ionic/react';
import { 
  barChartOutline,
  trendingUpOutline,
  alertCircleOutline,
  documentTextOutline 
} from 'ionicons/icons';
import './Reports.css';
import { getInventoryItems } from '../firestoreService';

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  description?: string;
}

const Reports: React.FC = () => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInventoryItems((items) => {
      setInventoryItems(items.map(item => ({
        ...item,
        quantity: Number(item.quantity) || 0,
        price: Number(item.price) || 0
      })));
      setLoading(false);
    });
  }, []);

  const lowStockItems = inventoryItems.filter(item => Number(item.quantity) < 10);
  const topItems = [...inventoryItems].sort((a, b) => b.quantity - a.quantity).slice(0, 5);

  const totalInventoryValue = inventoryItems.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <IonRow>
  <IonCol>
    <IonCard>
      <IonCardHeader>
        <IonIcon icon={alertCircleOutline} className="card-icon" />
        <IonCardTitle>Low Stock Alerts</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        {lowStockItems.length === 0 ? (
          <p>No items are low in stock</p>
        ) : (
          lowStockItems.map(item => (
            <div key={item.id} className="report-item">
              <span>{item.name}</span>
              <span className="quantity-alert">Qty: {item.quantity}</span>
            </div>
          ))
        )}
      </IonCardContent>
    </IonCard>
  </IonCol>
  <IonCol>
    <IonCard>
      <IonCardHeader>
        <IonIcon icon={trendingUpOutline} className="card-icon" />
        <IonCardTitle>Top Items</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        {topItems.map(item => (
          <div key={item.id} className="report-item">
            <span>{item.name}</span>
            <span>Qty: {item.quantity}</span>
          </div>
        ))}
      </IonCardContent>
    </IonCard>
  </IonCol>
</IonRow>
  );
};
  


export default Reports;