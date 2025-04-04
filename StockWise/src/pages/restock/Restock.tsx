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
  useIonRouter,
  IonSearchbar,
  IonList,
  IonItem,
  IonLabel
} from '@ionic/react';
import { 
  alertCircleOutline,
  trendingUpOutline,
  reloadOutline,
  cartOutline,
  analyticsOutline
} from 'ionicons/icons';
import { getStockPredictions, getConsumptionPlot, StockPrediction, addOrder, getSuppliers, SupplierOrder, updateInventoryItem, addInventoryItem, getOrders } from '../../firestoreService';
import { auth } from '../../../firebaseConfig';
import './Restock.css';
import { collection, query, where, getDocs } from 'firebase/firestore';

// Remove the local StockPrediction interface since we're importing it

interface UsageRecord {
  date: string;
  quantity: number; // Add this property
}

// In Restock.tsx
export interface RestockSuggestion {
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
  dailyConsumption: number;
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

// Update VALID_CATEGORIES to include Countertops
const VALID_CATEGORIES = [
  'Timber',
  'Paint',
  'Edge/Trim',
  'Screw',
  'Nail',
  'Countertops'  // Add this
] as const;

// Also update CATEGORY_MAPPINGS to include countertop-related terms
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
  
  // Add countertop mappings
  'granite': 'Countertops',
  'countertop': 'Countertops',
  'marble': 'Countertops',
  'surface': 'Countertops',
  
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

// Add this function before the Restock component
const determineCategory = (itemName: string, currentCategory: string): string => {
  const nameLower = itemName.toLowerCase();
  
  // Check for specific patterns first
  if (nameLower.includes('screw') || nameLower.includes('bolt') || nameLower.includes('fastener')) {
    return 'Screw';
  }
  
  if (nameLower.includes('nail') || nameLower.includes('brad') || nameLower.includes('pin')) {
    return 'Nail';
  }

  // Then try exact matches from CATEGORY_MAPPINGS
  const matchedCategory = Object.entries(CATEGORY_MAPPINGS).find(([key]) => 
    nameLower.includes(key.toLowerCase())
  );
  
  if (matchedCategory) {
    return matchedCategory[1];
  }
  
  // Fallback to current category if it's valid
  if (VALID_CATEGORIES.includes(currentCategory as any)) {
    return currentCategory;
  }

  // Default fallback
  return 'Screw';
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

  // Remove the searchbar state
  
  const [selectedPrediction, setSelectedPrediction] = useState<StockPrediction | null>(null);

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const fetchedPredictions = await getStockPredictions();
        console.log('Raw fetched predictions:', fetchedPredictions);
        
        if (!fetchedPredictions || !Array.isArray(fetchedPredictions)) {
          console.error('Invalid predictions data:', fetchedPredictions);
          return;
        }
  
        setMlPredictions(fetchedPredictions);
        setPredictions(fetchedPredictions);
        
        const suggestions = fetchedPredictions.map(pred => {
          const currentQuantity = Number(pred.current_quantity) || 0;
          const dailyConsumption = Number(pred.daily_consumption) || 0;
          const daysUntilLow = Number(pred.predicted_days_until_low) || 0;
        
          // Calculate recommended quantity when:
          // 1. Stock is below target (10 days worth) OR
          // 2. Days until low is less than 7 days
          const targetStock = Math.ceil(dailyConsumption * 10); // 10 days worth
          const recommendedQuantity = daysUntilLow < 7 || currentQuantity < targetStock ? 
            Math.max(0, targetStock - currentQuantity) : 
            0;
        
          const urgency: 'high' | 'medium' | 'low' = 
            daysUntilLow < 7 ? 'high' : 
            daysUntilLow < 14 ? 'medium' : 
            'low';
        
          console.log(`Processing ${pred.name}:`, {
            currentQty: currentQuantity,
            dailyUse: dailyConsumption,
            targetStock,
            daysUntilLow,
            recommended: recommendedQuantity
          });
        
          return {
            id: pred.product_id,
            name: pred.name,
            currentQuantity,
            recommendedQuantity,
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
  
        console.log('Processed suggestions:', suggestions);
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
    try {
      console.log(`Fetching plot for ${itemName}`);
      setSelectedItem(itemName);
      setPlotData(null); // Reset plot while loading
      
      const plotData = await getConsumptionPlot(itemName);
      if (!plotData) {
        throw new Error('No plot data received');
      }
      
      console.log('Setting plot data');
      setPlotData(plotData);
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
            
              
            </IonRow>

              
                <IonCard className="dashboard-card">
                  <IonCardHeader>
                    <IonCardTitle>Restock Suggestions</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <div className="restock-list">
                      {restockSuggestions.length > 0 ? (
                        restockSuggestions
                          .filter(item => {
                            const shouldShow = item.recommendedQuantity > 0;
                            console.log(`Filtering ${item.name}: recommendedQty=${item.recommendedQuantity}, showing=${shouldShow}`);
                            return shouldShow;
                          })
                          .map((item) => (
                            <div key={item.id} className={`restock-item ${item.urgency}`}>
                              <div className="item-info">
                                <h3>{item.name}</h3>
                                <p>Current Stock: {item.currentQuantity}</p>
                                <p>Daily Usage: {item.dailyConsumption.toFixed(2)} units</p>
                                <p>Recommended Order: {item.recommendedQuantity}</p>
                                <p>Days until Low: {item.predicted_days_until_low}</p>
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
                          ))
                      ) : (
                        <div>No restock suggestions available</div>
                      )}
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
                    <div className="predictions-select">
                      <IonList>
                        {predictions.map((prediction) => (
                          <IonItem 
                            key={prediction.product_id}
                            button
                            onClick={() => setSelectedPrediction(prediction)}
                            className={selectedPrediction?.product_id === prediction.product_id ? 'selected-item' : ''}
                          >
                            <IonLabel>
                              <h2>{prediction.name}</h2>
                              <p>Current Stock: {prediction.current_quantity}</p>
                            </IonLabel>
                            <IonBadge color={prediction.predicted_days_until_low < 7 ? 'danger' : 'warning'}>
                              {prediction.predicted_days_until_low} days
                            </IonBadge>
                          </IonItem>
                        ))}
                      </IonList>

                      {selectedPrediction && (
                        <div className="prediction-details">
                          <div className="tables-container">
                            <div className="table-section">
                              <h4>Stock Information</h4>
                              <table className="info-table">
                                <tbody>
                                  <tr>
                                    <th>Name</th>
                                    <td>{selectedPrediction.name}</td>
                                  </tr>
                                  <tr>
                                    <th>Current Stock</th>
                                    <td>{selectedPrediction.current_quantity}</td>
                                  </tr>
                                  <tr>
                                    <th>Daily Usage</th>
                                    <td>{selectedPrediction.daily_consumption.toFixed(2)} units</td>
                                  </tr>
                                  <tr>
                                    <th>Days Until Low</th>
                                    <td>{selectedPrediction.predicted_days_until_low}</td>
                                  </tr>
                                  <tr>
                                    <th>Confidence Score</th>
                                    <td>{(selectedPrediction.confidence_score * 100).toFixed(0)}%</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>

                            <div className="table-section">
                              <h4>Usage History</h4>
                              <div className="usage-table-container">
                                <table className="usage-table">
                                  <tbody>
                                    {selectedPrediction.usage_history
                                      ?.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Sort by most recent
                                      ?.map((usage, index) => (
                                        <tr key={index}>
                                          <td>{new Date(usage.date).toLocaleDateString()}</td>
                                          <td>{usage.quantity} units</td>
                                        </tr>
                                      ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>

                          <IonButton
                            className="show-trend-button"
                            onClick={() => handleItemClick(selectedPrediction.name)}
                          >
                            Show Usage Trend
                          </IonButton>

                          {selectedItem === selectedPrediction.name && plotData && (
                            <div className="usage-plot">
                              <h4>Usage Trends</h4>
                              <div className="plot-container">
                                <img 
                                  src={`data:image/png;base64,${plotData}`} 
                                  alt={`Usage trend for ${selectedPrediction.name}`}
                                  onError={(e) => {
                                    console.error('Error loading plot image');
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
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