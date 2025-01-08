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
  category?: string;
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

  const totalInventoryValue = inventoryItems.reduce((total, item) => {
    const itemPrice = Number(item.price) || 0;
    const itemQuantity = Number(item.quantity) || 0;
    return total + (itemPrice * itemQuantity);
  }, 0);

  const lowStockItems = inventoryItems.filter(item => Number(item.quantity) < 10);

  const topItems = [...inventoryItems]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <IonContent>
      <div className="dashboard-container">
        <h1 className="dashboard-title">Reports & Analytics</h1>
        
        <IonGrid>
          <IonRow>
            <IonCol sizeMd="6" sizeSm="12">
              <IonCard className="dashboard-card">
                <IonCardHeader>
                  <IonIcon icon={barChartOutline} className="card-icon" />
                  <IonCardTitle>Inventory Summary</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <div className="report-stats">
                    <p>Total Items: {inventoryItems.length}</p>
                    <p>Total Value: ${totalInventoryValue.toFixed(2)}</p>
                    <p>Average Item Value: ${(totalInventoryValue / (inventoryItems.length || 1)).toFixed(2)}</p>
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>

            <IonCol sizeMd="6" sizeSm="12">
              <IonCard className="dashboard-card">
                <IonCardHeader>
                  <IonIcon icon={alertCircleOutline} className="card-icon" />
                  <IonCardTitle>Low Stock Alerts</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <div className="report-list">
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
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol sizeMd="6" sizeSm="12">
              <IonCard className="dashboard-card">
                <IonCardHeader>
                  <IonIcon icon={trendingUpOutline} className="card-icon" />
                  <IonCardTitle>Top Items</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <div className="report-list">
                    {topItems.map(item => (
                      <div key={item.id} className="report-item">
                        <span>{item.name}</span>
                        <span>Qty: {item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>

            <IonCol sizeMd="6" sizeSm="12">
              <IonCard className="dashboard-card">
                <IonCardHeader>
                  <IonIcon icon={documentTextOutline} className="card-icon" />
                  <IonCardTitle>Monthly Overview</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <div className="report-stats">
                    <p>Total Categories: {new Set(inventoryItems.map(item => item.category || 'Uncategorized')).size}</p>
                    <p>Average Price: ${(inventoryItems.reduce((acc, item) => acc + item.price, 0) / inventoryItems.length || 0).toFixed(2)}</p>
                    <p>Total Items Tracked: {inventoryItems.length}</p>
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

export default Reports;