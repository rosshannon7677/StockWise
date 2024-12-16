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

  const totalInventoryValue = inventoryItems.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <IonContent>
      <div className="dashboard-container">
        <h1 className="dashboard-title">Reports & Analytics</h1>
        <IonGrid>
          <IonRow>
            <IonCol>
              <IonCard>
                <IonCardHeader>
                  <IonIcon icon={barChartOutline} className="card-icon" />
                  <IonCardTitle>Inventory Summary</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <p>Total Items: {inventoryItems.length}</p>
                  <p>Total Value: ${totalInventoryValue.toFixed(2)}</p>
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