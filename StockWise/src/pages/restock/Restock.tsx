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
  IonButton,
  IonRouterOutlet,
  useIonRouter
} from '@ionic/react';
import { 
  alertCircleOutline,
  trendingUpOutline,
  reloadOutline,
  cartOutline,
  analyticsOutline
} from 'ionicons/icons';
import { getInventoryItems, getStockPredictions, StockPrediction, addOrder, getSuppliers, SupplierOrder, updateInventoryItem, addInventoryItem, getOrders } from '../../firestoreService';
import { auth } from '../../../firebaseConfig';
import './Restock.css';
import { collection, query, where, getDocs } from 'firebase/firestore';

// Remove the local StockPrediction interface since we're importing it

interface UsageRecord {
  date: string;
  quantity: number; // Add this property
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
  dailyConsumption: number;  // Add this field
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
}

interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  category: string;
}

// Update VALID_CATEGORIES to have separate Screw and Nail categories
const VALID_CATEGORIES = [
  'Timber',
  'Paint',
  'Edge/Trim',
  'Screw',
  'Nail'  
] as const;

// Update CATEGORY_MAPPINGS to map to separate categories
const CATEGORY_MAPPINGS: Record<string, string> = {
  // Screw category
  'screw': 'Screw',
  'wood screw': 'Screw',
  'machine screw': 'Screw',
  'bolt': 'Screw',
  'fastener': 'Screw',
  
  // Nail category
  'nail': 'Nail',
  'brad': 'Nail',
  'pin': 'Nail',
  'tack': 'Nail',
  
  // Other categories
  'timber': 'Timber',
  'sheet': 'Timber',
  'plank': 'Timber',
  'paint': 'Paint',
  'stain': 'Paint',
  'varnish': 'Paint',
  'edge': 'Edge/Trim',
  'trim': 'Edge/Trim',
  'border': 'Edge/Trim'
};

const Restock: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [restockSuggestions, setRestockSuggestions] = useState<RestockSuggestion[]>([]);
  const [mlPredictions, setMlPredictions] = useState<StockPrediction[]>([]);
  const [predictions, setPredictions] = useState<StockPrediction[]>([]);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [plotData, setPlotData] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [orderedItems, setOrderedItems] = useState<Set<string>>(() => {
    // Initialize from localStorage
    const savedItems = localStorage.getItem('orderedItems');
    return new Set(savedItems ? JSON.parse(savedItems) : []);
  });
  const router = useIonRouter();

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const fetchedPredictions = await getStockPredictions();
        console.log('Fetched predictions:', fetchedPredictions);
        
        if (!fetchedPredictions) {
          console.error('No predictions received');
          return;
        }
  
        setMlPredictions(fetchedPredictions);
        setPredictions(fetchedPredictions);
        
        const suggestions = fetchedPredictions
          .map(pred => {
            const currentQuantity = Number(pred.current_quantity) || 0;
            const dailyConsumption = Number(pred.daily_consumption) || 0;
            const price = Number(pred.price) || 0;
  
            // Calculate total need (7 days + 3 days buffer)
            const totalNeeded = Math.ceil(dailyConsumption * 10);
  
            // Only calculate recommended quantity if we need to restock
            const recommendedQuantity = totalNeeded > currentQuantity ? 
              Math.max(totalNeeded - currentQuantity, 5) : 0;
  
            // Improved category mapping
            const determineCategory = (itemName: string, currentCategory: string): string => {
              const nameLower = itemName.toLowerCase();
              
              // Check timber/wood related terms first
              if (nameLower.includes('pine') || nameLower.includes('timber') || nameLower.includes('wood')) {
                return 'Timber';
              }
              
              // Then check for nails/screws
              if (nameLower.includes('nail') || nameLower.includes('pin') || nameLower.includes('brad')) {
                return 'Nail';
              }
              
              if (nameLower.includes('screw') || nameLower.includes('bolt')) {
                return 'Screw';
              }
            
              // Try other category matches
              const includesMatch = Object.entries(CATEGORY_MAPPINGS).find(([key]) => 
                nameLower.includes(key)
              );
              if (includesMatch) {
                return includesMatch[1];
              }
              
              return currentCategory || 'Timber'; // Default to Timber instead of Screw
            };
  
            return {
              id: pred.product_id,
              name: pred.name,
              currentQuantity,
              recommendedQuantity,
              price,
              dailyConsumption, // Add this
              category: determineCategory(pred.name, pred.category),
              urgency: pred.predicted_days_until_low < 7 
                ? 'high' 
                : pred.predicted_days_until_low < 14 
                  ? 'medium' 
                  : 'low',
              confidence: pred.confidence_score,
              predicted_days_until_low: pred.predicted_days_until_low,
              dimensions: pred.dimensions || {
                length: 0,
                width: 0,
                height: 0
              }
            } as RestockSuggestion;
          })
          .filter(suggestion => 
            // Only include items that actually need restocking
            suggestion.recommendedQuantity > 0 && 
            suggestion.currentQuantity < (suggestion.dailyConsumption * 10)
          );
  
        // Log suggestions for debugging
        console.log('Generated suggestions:', suggestions);
  
        setRestockSuggestions(suggestions);
      } catch (error) {
        console.error('Error fetching predictions:', error);
      }
    };
  
    fetchPredictions();
  }, []);

  useEffect(() => {
    getSuppliers((fetchedSuppliers) => {
      setSuppliers(fetchedSuppliers);
    });
  }, []);

  // Add effect to save to localStorage when orderedItems changes
  useEffect(() => {
    localStorage.setItem('orderedItems', JSON.stringify([...orderedItems]));
  }, [orderedItems]);

  // Add effect to remove items from orderedItems when order is completed/cancelled
  useEffect(() => {
    const checkOrderStatus = () => {
      getOrders((orders: SupplierOrder[]) => {
        const completedOrderItems = orders
          .filter((order: SupplierOrder) => 
            order.status === 'received' || order.status === 'canceled'
          )
          .flatMap(order => order.items.map(item => item.itemId));

        setOrderedItems(prev => {
          const newSet = new Set(prev);
          completedOrderItems.forEach(itemId => newSet.delete(itemId));
          return newSet;
        });
      });
    };

    checkOrderStatus();
  }, []);

  // Add effect to remove items from orderedItems when order is completed/cancelled/deleted
  useEffect(() => {
    const checkOrderStatus = () => {
      getOrders((orders: SupplierOrder[]) => {
        // Get all current active order item IDs
        const activeOrderItemIds = orders
          .filter(order => order.status !== 'received' && order.status !== 'canceled')
          .flatMap(order => order.items.map(item => item.itemId));

        // Update orderedItems to only include items that are in active orders
        setOrderedItems(prev => {
          const newSet = new Set<string>();
          // Only keep items that are still in active orders
          for (const itemId of prev) {
            if (activeOrderItemIds.includes(itemId)) {
              newSet.add(itemId);
            }
          }
          return newSet;
        });
      });
    };

    checkOrderStatus();
    
    // Add an interval to check periodically
    const interval = setInterval(checkOrderStatus, 5000); // Check every 5 seconds

    return () => clearInterval(interval); // Cleanup on unmount
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

  const handleOrderNow = async (item: RestockSuggestion) => {
    try {
      // Debug logs
      console.log('Item category:', item.category);
      console.log('Available suppliers:', suppliers);
      console.log('Item details:', item);

      // First validate that the category is one of our valid categories
      if (!VALID_CATEGORIES.includes(item.category as any)) {
        alert(
          `Invalid category: ${item.category}\n` +
          `Valid categories are: ${VALID_CATEGORIES.join(', ')}`
        );
        return;
      }

      // Then check if we have a supplier for this category
      const supplier = suppliers.find(s => {
        const normalizedSupplierCategory = s.category.toLowerCase().trim();
        const normalizedItemCategory = item.category.toLowerCase().trim();
        return normalizedSupplierCategory === normalizedItemCategory;
      });

      if (!supplier) {
        // Show both valid categories and available supplier categories
        const availableSupplierCategories = Array.from(new Set(suppliers.map(s => s.category)));
        alert(
          `Please add a supplier for category: ${item.category}\n` +
          `Current supplier categories: ${availableSupplierCategories.join(', ')}\n` +
          `Valid system categories: ${VALID_CATEGORIES.join(', ')}`
        );
        return;
      }

      // Calculate total with proper type checking
      const quantity = Number(item.recommendedQuantity) || 0;
      const price = Number(item.price) || 0;
      const totalAmount = quantity * price;

      // Ensure all required fields are defined with proper number conversion
      const orderData: Omit<SupplierOrder, 'id'> = {
        supplier: {
          id: supplier.id || '',
          name: supplier.name || '',
          email: supplier.email || '',
          phone: supplier.phone || '',
          category: supplier.category || ''
        },
        items: [{
          itemId: item.id || '',
          name: item.name || '',
          quantity: quantity,
          price: price,
          dimensions: {
            length: Number(item.dimensions?.length) || 0,
            width: Number(item.dimensions?.width) || 0,
            height: Number(item.dimensions?.height) || 0
          }
        }],
        status: 'pending',
        totalAmount: totalAmount,
        orderDate: new Date().toISOString(),
        statusHistory: [{
          status: 'pending',
          date: new Date().toISOString(),
          updatedBy: auth.currentUser?.email || 'unknown',
          notes: `Auto-generated from ML restock suggestion. Confidence: ${((item.confidence || 0) * 100).toFixed(0)}%`
        }],
        metadata: {
          addedBy: auth.currentUser?.email || 'unknown',
          addedDate: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        }
      };

      // Debug log
      console.log('Creating order with data:', orderData);

      await addOrder(orderData);
      
      // Add item ID to ordered items set and persist to localStorage
      setOrderedItems(prev => {
        const newSet = new Set([...prev, item.id]);
        localStorage.setItem('orderedItems', JSON.stringify([...newSet]));
        return newSet;
      });
      
      // Show success message and navigate
      alert('Order created successfully!');
      
      // Use timeout to ensure state updates before navigation
      setTimeout(() => {
        router.push('/orders');
      }, 100);

    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order. Please try again.');
    }
  };

  const totalRestockCost = restockSuggestions.reduce((total, item) => 
    total + (item.recommendedQuantity * item.price), 0
  );

  const urgentItems = restockSuggestions.filter(item => item.urgency === 'high');

  return (
    <IonContent>
      <IonRouterOutlet>
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
                            <p className="cost">
                              €{(item.price * item.recommendedQuantity).toFixed(2)}
                              {/* Add unit price */}
                              <span className="unit-price">(€{item.price.toFixed(2)} each)</span>
                            </p>
                            <IonButton 
                              size="small" 
                              onClick={() => handleOrderNow(item)}
                              disabled={!suppliers.length || orderedItems.has(item.id)}
                            >
                              {orderedItems.has(item.id) ? 'Order Pending' : 'Order Now'}
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
      </IonRouterOutlet>
    </IonContent>
  );
};

export default Restock;