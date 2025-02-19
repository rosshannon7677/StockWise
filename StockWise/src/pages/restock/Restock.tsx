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
import { getInventoryItems, getStockPredictions, StockPrediction } from '../../firestoreService';
import './Restock.css';

// Remove the local StockPrediction interface since we're importing it

interface UsageRecord {
  date: string;
  quantity: number;
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
  confidence: number;
  predicted_days_until_low: number;
}

const Restock: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [restockSuggestions, setRestockSuggestions] = useState<RestockSuggestion[]>([]);
  const [mlPredictions, setMlPredictions] = useState<StockPrediction[]>([]);
  const [predictions, setPredictions] = useState<StockPrediction[]>([]);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [plotData, setPlotData] = useState<string | null>(null);

  useEffect(() => {
    const fetchPredictions = async () => {
      const fetchedPredictions = await getStockPredictions();
      setMlPredictions(fetchedPredictions);
      setPredictions(fetchedPredictions);
      
      const suggestions = fetchedPredictions.map(pred => ({
        id: pred.product_id,
        name: pred.name,
        currentQuantity: pred.current_quantity,
        recommendedQuantity: Math.ceil(pred.daily_consumption * 14),
        price: pred.price,
        category: pred.category,
        // Fix: Type assertion for urgency
        urgency: (pred.predicted_days_until_low < 7 
          ? 'high' 
          : pred.predicted_days_until_low < 14 
            ? 'medium' 
            : 'low') as 'high' | 'medium' | 'low',
        lastRestocked: undefined,
        confidence: pred.confidence_score,
        predicted_days_until_low: pred.predicted_days_until_low
      }));

      const needsRestock = suggestions.filter(item => 
        item.predicted_days_until_low < 14 || item.currentQuantity < 10
      );
      
      setRestockSuggestions(needsRestock);
    };

    fetchPredictions();
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
                          <p>Daily Usage: {mlPredictions.find(p => p.product_id === item.id)?.daily_consumption.toFixed(2)} units</p>
                          <p>Recommended Order: {item.recommendedQuantity}</p>
                          <p>Days until Low: {mlPredictions.find(p => p.product_id === item.id)?.predicted_days_until_low}</p>
                        </div>
                        <div className="item-actions">
                          <IonBadge color={item.urgency === 'high' ? 'danger' : 'warning'}>
                            {item.urgency.toUpperCase()}
                          </IonBadge>
                          <div className="confidence-score">
                            {(item.confidence * 100).toFixed(0)}% confidence
                          </div>
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
                            <h1>{prediction.name}</h1>
                            
                            <div className="tables-container">
                              {/* Stock Information Table */}
                              <div className="table-section">
                              <h4>Stock Information</h4>
                                <table className="info-table">
                                  <thead>
                                    <tr>
                                      <th>Metric</th>
                                      <th>Value</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr>
                                      <td>Current Stock:</td>
                                      <td>{prediction.current_quantity}</td>
                                    </tr>
                                    <tr>
                                      <td>Daily Usage:</td>
                                      <td>{prediction.daily_consumption?.toFixed(2)} units</td>
                                    </tr>
                                    <tr>
                                      <td>Days until Low:</td>
                                      <td>{prediction.predicted_days_until_low}</td>
                                    </tr>
                                    <tr>
                                      <td>Confidence:</td>
                                      <td>{(prediction.confidence_score * 100).toFixed(0)}%</td>
                                    </tr>
                                    <tr>
                                      <td>Restock by:</td>
                                      <td>{new Date(prediction.recommended_restock_date).toLocaleDateString()}</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>

                              {/* Usage History Table */}
                              {prediction.usage_history && prediction.usage_history.length > 0 && (
                                <div className="table-section">
                                  <h4>Recent Usage History</h4>
                                  <table className="usage-table">
                                    <thead>
                                      <tr>
                                        <th>Date</th>
                                        <th>Units Used</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {prediction.usage_history.slice(-5).map((usage: UsageRecord, index: number) => (
                                        <tr key={index}>
                                          <td>{new Date(usage.date).toLocaleDateString()}</td>
                                          <td>-{usage.quantity}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
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