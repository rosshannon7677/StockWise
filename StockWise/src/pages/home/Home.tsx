import React, { useState, useEffect } from "react";
import { 
  IonContent, IonGrid, IonRow, IonCol, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonIcon, IonButton
} from '@ionic/react';
import { 
  logOutOutline, cubeOutline, checkmarkCircleOutline,
  receiptOutline, cartOutline, trendingUpOutline,
  statsChartOutline, settingsOutline, analyticsOutline
} from 'ionicons/icons';
import './Home.css';
import { RestockSuggestion } from '../restock/Restock';
import { auth } from '../../../firebaseConfig';
import { useIonRouter } from '@ionic/react';
import { 
  getInventoryItems, getStockPredictions, StockPrediction, getActivityLogs 
} from '../../firestoreService';

// Update VALID_CATEGORIES to match exactly with supplier categories
const VALID_CATEGORIES = [
  'Timber',
  'Paint',
  'Edge/Trim',
  'Screws/Nails',
  'Tools',  // Add Tools
  'Countertops'  // Add Countertops
] as const;

// Add type for the categories
type ValidCategory = typeof VALID_CATEGORIES[number];

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  description?: string;
  category: string;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  location: {
    aisle: string;
    shelf: string;
    section: string;
  };
  metadata: {
    addedBy: string;
    addedDate: string;
  };
}

interface ActivityLog {
  id: string;
  action: 'add' | 'update' | 'delete' | 'order' | 'stock_use';
  itemName: string;
  timestamp: string;
  user: string;
  details: string;
}

const Home: React.FC = () => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [predictions, setPredictions] = useState<StockPrediction[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [plotData, setPlotData] = useState<string | null>(null);
  const [selectedAisle, setSelectedAisle] = useState<string | null>(null);
  const navigation = useIonRouter();

  useEffect(() => {
    getInventoryItems((items) => {
      setInventoryItems(items);
    });
  }, []);

  useEffect(() => {
    const fetchPredictions = async () => {
      const stockPredictions = await getStockPredictions();
      setPredictions(stockPredictions);
    };
    fetchPredictions();
  }, []);

  useEffect(() => {
    const unsubscribe = getActivityLogs((logs) => {
      setActivityLogs(logs);
    });
    return () => unsubscribe();
  }, []);

  const fetchPlot = async (itemName: string) => {
    console.log(`Fetching plot for: ${itemName}`);  // Debug log
    try {
      const encodedName = encodeURIComponent(itemName);
      const url = `http://localhost:8000/consumption-plot/${encodedName}`;
      console.log(`Requesting URL: ${url}`);  // Debug log
      
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.plot) {
        setPlotData(data.plot);
      } else {
        throw new Error('No plot data received');
      }
    } catch (error) {
      console.error('Error fetching plot:', error);
      setPlotData(null);
    }
  };

  const handleItemClick = (itemName: string) => {
    if (selectedItem === itemName) {
      setSelectedItem(null);
      setPlotData(null);
    } else {
      setSelectedItem(itemName);
      fetchPlot(itemName);
    }
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      navigation.push('/login', 'root', 'replace');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };


  // Get top selling products
  const topProducts = [...inventoryItems]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const suggestions = predictions.map(pred => {
    // Parse values as numbers
    const currentQuantity = Number(pred.current_quantity) || 0;
    const dailyConsumption = Number(pred.daily_consumption) || 0;
    const recommendedQuantity = Number(pred.recommended_quantity) || 0;
    const daysUntilLow = Number(pred.predicted_days_until_low) || 0;

    // Type the urgency explicitly
    const urgency: 'high' | 'medium' | 'low' = 
      daysUntilLow < 7 ? 'high' : 
      daysUntilLow < 14 ? 'medium' : 
      'low';

    return {
      id: pred.product_id,
      name: pred.name,
      currentQuantity,
      recommendedQuantity, // Use ML service value directly
      price: Number(pred.price) || 0,
      category: pred.category || 'Uncategorized',
      urgency,
      confidence: pred.confidence_score,
      predicted_days_until_low: daysUntilLow,
      dailyConsumption,
      dimensions: pred.dimensions || {
        length: 0,
        width: 0,
        height: 0
      }
    } satisfies RestockSuggestion;
  });

  return (
    <IonContent>
      <div className="dashboard-container">
        <IonGrid>
          

          <IonRow>
            <IonCol sizeMd="8" sizeSm="12">
              <IonCard className="dashboard-card">
                <IonCardHeader>
                  <IonIcon icon={trendingUpOutline} className="card-icon" />
                  <IonCardTitle>Stock Location Map</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <div className="location-grid">
                    {Array.from(new Set(inventoryItems.map(item => item.location.aisle))).map(aisle => (
                      <div 
                        key={aisle} 
                        className={`location-card ${selectedAisle === aisle ? 'active' : ''}`}
                        onClick={() => setSelectedAisle(aisle === selectedAisle ? null : aisle)}
                      >
                        <div className="location-title">Aisle {aisle}</div>
                        <div className="location-count">
                          {inventoryItems.filter(item => item.location.aisle === aisle).length} items
                        </div>
                        
                        {selectedAisle === aisle && (
                          <div className="aisle-items">
                            {inventoryItems
                              .filter(item => item.location.aisle === aisle)
                              .map(item => (
                                <div key={item.id} className="aisle-item">
                                  <div className="item-name">{item.name}</div>
                                  <div className="item-details">
                                    <span className="quantity">Qty: {item.quantity}</span>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>

            <IonCol sizeMd="4" sizeSm="12">
              <IonCard className="dashboard-card">
                <IonCardHeader>
                  <IonIcon icon={statsChartOutline} className="card-icon" />
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
          
          <IonRow>
            {/* Activity Log Column - Left Side */}
            <IonCol sizeMd="6" sizeSm="12">
              <IonCard className="dashboard-card activity-card">
                <IonCardHeader>
                  <IonIcon icon={receiptOutline} className="card-icon" />
                  <IonCardTitle>Recent Activity</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <div className="activity-list">
                    {activityLogs.length > 0 ? (
                      activityLogs.map((log) => (
                        <div key={log.id} className="activity-item">
                          <div className="activity-header">
                            <span className={`activity-type ${log.action}`}>
                              {log.action.toUpperCase()}
                            </span>
                            <span className="activity-time">
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <div className="activity-content">
                            <strong>{log.itemName}</strong> - {log.details}
                          </div>
                          <div className="activity-user">By: {log.user}</div>
                        </div>
                      ))
                    ) : (
                      <div className="no-activity">No recent activity</div>
                    )}
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>

            {/* Additional Content - Right Side */}
            <IonCol sizeMd="6" sizeSm="12">
              <IonCard className="dashboard-card">
                <IonCardHeader>
                  <IonIcon icon={analyticsOutline} className="card-icon" />
                  <IonCardTitle>Usage Analysis</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <div className="analysis-content">
                    {/* Daily Usage Summary */}
                    <div className="usage-summary">
                      <h4>Daily Usage Summary</h4>
                      {predictions
                        .filter(pred => pred.daily_consumption > 0)
                        .sort((a, b) => b.daily_consumption - a.daily_consumption)
                        .slice(0, 5)
                        .map(item => (
                          <div key={item.name} className="usage-item" onClick={() => handleItemClick(item.name)}>
                            <div className="usage-item-header">
                              <span className="item-name">{item.name}</span>
                              <span className="daily-rate">{item.daily_consumption.toFixed(1)} units/day</span>
                            </div>
                            <div className="usage-item-footer">
                              <span className="stock-level">Current Stock: {item.current_quantity}</span>
                              <span className="days-remaining">
                                {item.predicted_days_until_low} days until low
                              </span>
                            </div>
                            {selectedItem === item.name && plotData && (
                              <div className="usage-trend">
                                <img 
                                  src={`data:image/png;base64,${plotData}`} 
                                  alt={`Usage trend for ${item.name}`}
                                />
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
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