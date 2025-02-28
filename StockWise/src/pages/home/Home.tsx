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
import { RestockSuggestion } from '../restock/Restock';
import { auth } from '../../../firebaseConfig';
import { useIonRouter } from '@ionic/react';
import { getInventoryItems, getStockPredictions, StockPrediction } from '../../firestoreService';

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

  const suggestions = predictions.map(pred => {
    // Parse values as numbers
    const currentQuantity = Number(pred.current_quantity) || 0;
    const dailyConsumption = Number(pred.daily_consumption) || 0;
    const daysUntilLow = Number(pred.predicted_days_until_low) || 0;

    // Use the ML service's recommended quantity directly
    const recommendedQuantity = Number(pred.recommended_quantity) || 0;

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
          
        </IonGrid>
      </div>
    </IonContent>
  );
};

export default Home;