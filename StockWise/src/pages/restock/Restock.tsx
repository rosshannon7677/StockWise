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
  IonIcon,
  IonBadge,
  IonButton
} from '@ionic/react';
import { 
  alertCircleOutline,
  trendingUpOutline,
  reloadOutline,
  cartOutline,
  analyticsOutline
} from 'ionicons/icons';
import { getInventoryItems, getStockPredictions } from '../../firestoreService';
import './Restock.css';

// Add interface for usage history
interface UsageRecord {
  date: string;
  quantity: number;
}

// Add interface for prediction
interface StockPrediction {
  product_id: string;
  name: string;
  current_quantity: number;
  daily_consumption: number;
  predicted_days_until_low: number;
  confidence_score: number;
  recommended_restock_date: string;
  usage_history: UsageRecord[];
}

interface RestockSuggestion {
  id: string;
  name: string;
  currentQuantity: number;
  recommendedQuantity: number;
  price: number;
  category: string;
  urgency: 'high' | 'medium' | 'low';
  lastRestocked?: string;
}

const Restock: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [restockSuggestions, setRestockSuggestions] = useState<RestockSuggestion[]>([]);
  const [mlPredictions, setMlPredictions] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [plotData, setPlotData] = useState<string | null>(null);

  useEffect(() => {
    // Fetch ML predictions
    const fetchPredictions = async () => {
      const predictions = await getStockPredictions();
      setMlPredictions(predictions);
      setPredictions(predictions);
    };

    fetchPredictions();
    
    getInventoryItems((fetchedItems) => {
      setItems(fetchedItems);
      
      // Calculate restock suggestions with proper type assertion
      const suggestions = fetchedItems
        .filter(item => item.quantity < 10)
        .map(item => ({
          id: item.id,
          name: item.name,
          currentQuantity: item.quantity,
          recommendedQuantity: 20 - item.quantity,
          price: item.price,
          category: item.category,
          urgency: item.quantity < 5 ? ('high' as const) : ('medium' as const),
          lastRestocked: item.metadata?.addedDate
        }));
      
      setRestockSuggestions(suggestions);
    });
  }, []);

  const handleItemClick = async (itemName: string) => {
    setSelectedItem(itemName);
    try {
      const response = await fetch(
        `http://localhost:8000/consumption-plot/${encodeURIComponent(itemName)}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setPlotData(data.plot);
    } catch (error) {
      console.error('Error fetching plot:', error);
      setPlotData(null);
    }
  };

  const totalRestockCost = restockSuggestions.reduce((total, item) => 
    total + (item.recommendedQuantity * item.price), 0
  );

  const urgentItems = restockSuggestions.filter(item => item.urgency === 'high');

  return (
    <IonContent>
      <div className="dashboard-container">
        <h1 className="dashboard-title">Restock Management</h1>
        
        <IonGrid>
          <IonRow>
            <IonCol sizeMd="3" sizeSm="6" size="12">
              <IonCard className="dashboard-card">
                <IonCardHeader>
                  <IonIcon icon={alertCircleOutline} className="card-icon warning" />
                  <IonCardTitle>Items to Restock</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <h2 className="metric-value">{restockSuggestions.length}</h2>
                </IonCardContent>
              </IonCard>
            </IonCol>

            <IonCol sizeMd="3" sizeSm="6" size="12">
              <IonCard className="dashboard-card">
                <IonCardHeader>
                  <IonIcon icon={cartOutline} className="card-icon danger" />
                  <IonCardTitle>Urgent Items</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <h2 className="metric-value">{urgentItems.length}</h2>
                </IonCardContent>
              </IonCard>
            </IonCol>

            <IonCol sizeMd="3" sizeSm="6" size="12">
              <IonCard className="dashboard-card">
                <IonCardHeader>
                  <IonIcon icon={trendingUpOutline} className="card-icon" />
                  <IonCardTitle>Restock Cost</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <h2 className="metric-value">€{totalRestockCost.toFixed(2)}</h2>
                </IonCardContent>
              </IonCard>
            </IonCol>

            <IonCol sizeMd="3" sizeSm="6" size="12">
              <IonCard className="dashboard-card">
                <IonCardHeader>
                  <IonIcon icon={reloadOutline} className="card-icon" />
                  <IonCardTitle>Categories</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <h2 className="metric-value">
                    {new Set(restockSuggestions.map(item => item.category)).size}
                  </h2>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol sizeMd="8" sizeSm="12">
              <IonCard className="dashboard-card">
                <IonCardHeader>
                  <IonCardTitle>Restock Suggestions</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <div className="restock-list">
                    {restockSuggestions.map((item) => (
                      <div key={item.id} className={`restock-item ${item.urgency}`}>
                        <div className="item-info">
                          <h3>{item.name}</h3>
                          <p>Current Stock: {item.currentQuantity}</p>
                          <p>Recommended Order: {item.recommendedQuantity}</p>
                          <p>Category: {item.category}</p>
                        </div>
                        <div className="item-actions">
                          <IonBadge color={item.urgency === 'high' ? 'danger' : 'warning'}>
                            {item.urgency.toUpperCase()}
                          </IonBadge>
                          <p className="cost">€{(item.recommendedQuantity * item.price).toFixed(2)}</p>
                          <IonButton size="small" fill="solid">
                            Order Now
                          </IonButton>
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
                  <IonCardTitle>Restock Analysis</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <div className="analysis-stats">
                    <div className="stat-item">
                      <label>Average Restock Size:</label>
                      <span>{(restockSuggestions.reduce((acc, item) => 
                        acc + item.recommendedQuantity, 0) / restockSuggestions.length || 0).toFixed(0)} units</span>
                    </div>
                    <div className="stat-item">
                      <label>Average Cost per Item:</label>
                      <span>€{(totalRestockCost / restockSuggestions.length || 0).toFixed(2)}</span>
                    </div>
                    <div className="stat-item">
                      <label>Urgent Items Cost:</label>
                      <span>€{urgentItems.reduce((total, item) => 
                        total + (item.recommendedQuantity * item.price), 0).toFixed(2)}</span>
                    </div>
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
                                {prediction.usage_history.slice(-5).map((usage: UsageRecord, index: number) => (
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

export default Restock;