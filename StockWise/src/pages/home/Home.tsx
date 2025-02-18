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
  settingsOutline,
  analyticsOutline
} from 'ionicons/icons';
import './Home.css';
import { auth } from '../../../firebaseConfig';
import { useIonRouter } from '@ionic/react';
import { getInventoryItems, getStockPredictions, StockPrediction } from '../../firestoreService';

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

const Home: React.FC = () => {
  const navigation = useIonRouter();
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [predictions, setPredictions] = useState<StockPrediction[]>([]);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [plotData, setPlotData] = useState<string | null>(null);

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

  const fetchPlot = async (itemName: string) => {
    console.log(`Fetching plot for: ${itemName}`);  // Debug log
    try {
      // Make sure to encode the item name properly
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
        <IonGrid>
          <IonRow>
            {cardComponent.map((card, index) => (
              <IonCol sizeMd="3" sizeSm="6" size="12" key={index}>
                <IonCard className="dashboard-card" style={{ height: 'auto', padding: '0.5rem' }}>
                  <IonCardHeader style={{ padding: '0.5rem' }}>
                    <IonIcon icon={card.icon} className="card-icon" color={card.color} />
                    <IonCardTitle style={{ fontSize: '1rem' }}>{card.title}</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent style={{ padding: '0.5rem' }}>
                    <div className="metric-value" style={{ fontSize: '1.2rem' }}>{card.subTitle}</div>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            ))}
          </IonRow>

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
                      <div key={aisle} className="location-card">
                        <div className="location-title">Aisle {aisle}</div>
                        <div className="location-count">
                          {inventoryItems.filter(item => item.location.aisle === aisle).length} items
                        </div>
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
            <IonCol sizeMd="12">
              <IonCard className="dashboard-card">
                <IonCardHeader>
                  <IonIcon icon={analyticsOutline} className="card-icon" />
                  <IonCardTitle>ML Stock Insights & Usage History</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  {predictions.length > 0 ? (
                    <div className="predictions-list">
                      {predictions.map((prediction) => (
                        <div 
                          key={prediction.product_id} 
                          className={`prediction-item ${
                            prediction.predicted_days_until_low < 7 ? 'urgent' : 
                            prediction.predicted_days_until_low < 14 ? 'warning' : 'normal'
                          }`}
                          onClick={() => handleItemClick(prediction.name)}
                        >
                          <div className="prediction-info">
                            <h3>{prediction.name}</h3>
                            <div className="prediction-details">
                              <p>Current Stock: {prediction.current_quantity}</p>
                              <p>Daily Usage: {prediction.daily_consumption?.toFixed(2)} units</p>
                              <p>Days until Low: {prediction.predicted_days_until_low}</p>
                            </div>
                            <div className="prediction-meta">
                              <span className={`confidence-badge ${
                                prediction.confidence_score > 0.7 ? 'high' :
                                prediction.confidence_score > 0.5 ? 'medium' : 'low'
                              }`}>
                                {(prediction.confidence_score * 100).toFixed(0)}% confidence
                              </span>
                              <span className="restock-date">
                                Restock by: {new Date(prediction.recommended_restock_date).toLocaleDateString()}
                              </span>
                            </div>
                            {prediction.usage_history && prediction.usage_history.length > 0 && (
                              <div className="usage-timeline">
                                <h4>Recent Usage History</h4>
                                {prediction.usage_history.slice(-5).map((usage, index) => (
                                  <div key={index} className="usage-event">
                                    <span className="usage-date">
                                      {new Date(usage.date).toLocaleDateString()}
                                    </span>
                                    <span className="usage-quantity">
                                      -{usage.quantity} units
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          {selectedItem === prediction.name && plotData && (
                            <div className="usage-plot">
                              <h4>Usage Trends</h4>
                              <img 
                                src={`data:image/png;base64,${plotData}`} 
                                alt={`Usage trend for ${prediction.name}`}
                                style={{ 
                                  width: '80%',  // Reduced from 100%
                                  marginTop: '1rem',
                                  marginLeft: 'auto',
                                  marginRight: 'auto',
                                  display: 'block'
                                }}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-predictions">
                      <p>No stock predictions available yet. Use inventory items to generate predictions.</p>
                    </div>
                  )}
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