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
  cubeOutline,
  alertCircleOutline,
  cartOutline,
  timeOutline,
  statsChartOutline,
  trendingUpOutline,
  checkmarkCircleOutline
} from 'ionicons/icons';
import './Reports.css';
import { getInventoryItems } from '../firestoreService';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Reports: React.FC = () => {
  const [inventoryData, setInventoryData] = useState<any>([]);

  useEffect(() => {
    getInventoryItems((items) => {
      setInventoryData(items);
    });
  }, []);

  // Calculate metrics
  const totalItems = inventoryData.length;
  const lowStockItems = inventoryData.filter(item => item.quantity < 10).length;
  const totalValue = inventoryData.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const activeItems = inventoryData.filter(item => item.quantity > 0).length;
  const categories = new Set(inventoryData.map(item => item.category)).size;
  
  // Get top items by quantity
  const topItems = [...inventoryData]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // Prepare chart data
  const categoryChartData = {
    labels: Array.from(new Set(inventoryData.map(item => item.category))),
    datasets: [{
      label: 'Items by Category',
      data: Array.from(new Set(inventoryData.map(item => item.category))).map(cat => 
        inventoryData.filter(item => item.category === cat).length
      ),
      backgroundColor: [
        'rgba(255, 99, 132, 0.5)',
        'rgba(54, 162, 235, 0.5)',
        'rgba(255, 206, 86, 0.5)',
        'rgba(75, 192, 192, 0.5)',
        'rgba(153, 102, 255, 0.5)'
      ]
    }]
  };

  const valueChartData = {
    labels: Array.from(new Set(inventoryData.map(item => item.category))),
    datasets: [{
      label: 'Value by Category',
      data: Array.from(new Set(inventoryData.map(item => item.category))).map(cat =>
        inventoryData
          .filter(item => item.category === cat)
          .reduce((sum, item) => sum + (item.price * item.quantity), 0)
      ),
      backgroundColor: 'rgba(54, 162, 235, 0.5)'
    }]
  };

  return (
    <IonContent>
      <div className="dashboard-container">
        <h1 className="dashboard-title">Inventory Analytics</h1>
        
        {/* Inventory Status Overview */}
        <IonGrid>
          <IonRow>
            <IonCol sizeMd="3" sizeSm="6">
              <IonCard className="dashboard-card">
                <IonCardHeader>
                  <IonIcon icon={cubeOutline} className="card-icon" />
                  <IonCardTitle>Total Stock</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <div className="metric-value">
                    {inventoryData.reduce((sum, item) => sum + item.quantity, 0)}
                  </div>
                  <div className="metric-label">Items in Stock</div>
                </IonCardContent>
              </IonCard>
            </IonCol>

            <IonCol sizeMd="3" sizeSm="6">
              <IonCard className="dashboard-card">
                <IonCardHeader>
                  <IonIcon icon={alertCircleOutline} className="card-icon warning" />
                  <IonCardTitle>Low Stock</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <div className="metric-value">{lowStockItems}</div>
                  <div className="metric-label">Items Need Restock</div>
                </IonCardContent>
              </IonCard>
            </IonCol>

            <IonCol sizeMd="3" sizeSm="6">
              <IonCard className="dashboard-card">
                <IonCardHeader>
                  <IonIcon icon={statsChartOutline} className="card-icon" />
                  <IonCardTitle>Total Value</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <div className="metric-value">€{totalValue.toFixed(2)}</div>
                  <div className="metric-label">Inventory Worth</div>
                </IonCardContent>
              </IonCard>
            </IonCol>

            <IonCol sizeMd="3" sizeSm="6">
              <IonCard className="dashboard-card">
                <IonCardHeader>
                  <IonIcon icon={checkmarkCircleOutline} className="card-icon success" />
                  <IonCardTitle>Categories</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <div className="metric-value">{categories}</div>
                  <div className="metric-label">Product Categories</div>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>

          {/* Detailed Analysis */}
          <IonRow>
            <IonCol sizeMd="8">
              <IonCard className="dashboard-card">
                <IonCardHeader>
                  <IonCardTitle>Top Items by Quantity</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <div className="top-items-list">
                    {topItems.map((item, index) => (
                      <div key={index} className="top-item">
                        <span className="item-name">{item.name}</span>
                        <span className="item-quantity">{item.quantity} units</span>
                        <span className="item-value">€{(item.quantity * item.price).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>

            <IonCol sizeMd="4">
              <IonCard className="dashboard-card">
                <IonCardHeader>
                  <IonCardTitle>Stock Health</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <div className="stock-stats">
                    <div className="stat-item">
                      <label>Active Items:</label>
                      <span>{activeItems} ({((activeItems/totalItems) * 100).toFixed(1)}%)</span>
                    </div>
                    <div className="stat-item">
                      <label>Average Item Value:</label>
                      <span>€{(totalValue / totalItems).toFixed(2)}</span>
                    </div>
                    <div className="stat-item">
                      <label>Low Stock Alert:</label>
                      <span className="warning">{lowStockItems} items</span>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol sizeMd="6">
              <IonCard className="dashboard-card">
                <IonCardHeader>
                  <IonCardTitle>Category Distribution</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <div style={{ height: '300px' }}>
                    <Doughnut 
                      data={categoryChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false
                      }}
                    />
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>

            <IonCol sizeMd="6">
              <IonCard className="dashboard-card">
                <IonCardHeader>
                  <IonCardTitle>Value by Category</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <div style={{ height: '300px' }}>
                    <Bar 
                      data={valueChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false
                      }}
                    />
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