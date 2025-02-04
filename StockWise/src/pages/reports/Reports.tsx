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
  IonButton
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
import { getInventoryItems } from '../../firestoreService';
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
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import type { UserOptions } from 'jspdf-autotable';

// Add type declaration for jsPDF
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: UserOptions) => jsPDF;
  }
}

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

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
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

const Reports: React.FC = () => {
  const [inventoryData, setInventoryData] = useState<any>([]);

  useEffect(() => {
    getInventoryItems((items) => {
      setInventoryData(items);
    });
  }, []);

  // Calculate metrics
  const totalItems = inventoryData.length;
  const lowStockItems = inventoryData.filter((item: InventoryItem) => item.quantity < 10).length;
  const totalValue = inventoryData.reduce((sum: number, item: InventoryItem) => 
    sum + (item.price * item.quantity), 0);
  const activeItems = inventoryData.filter((item: InventoryItem) => item.quantity > 0).length;
  const categories = new Set(inventoryData.map((item: InventoryItem) => item.category)).size;
  
  // Get top items by quantity
  const topItems = [...inventoryData]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // Prepare chart data
  const categoryChartData = {
    labels: Array.from(new Set(inventoryData.map((item: InventoryItem) => item.category))),
    datasets: [{
      label: 'Items by Category',
      data: Array.from(new Set(inventoryData.map((item: InventoryItem) => item.category)))
        .map(cat => 
          inventoryData.filter((item: InventoryItem) => item.category === cat).length
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

  // Get data by category
  const categoryData = Array.from(new Set(inventoryData.map((item: InventoryItem) => item.category))).map(cat => {
    const items = inventoryData.filter((item: InventoryItem) => item.category === cat);
    const totalItems = items.length;
    const totalValue = items.reduce((sum: number, item: InventoryItem) => 
      sum + (item.price * item.quantity), 0);
    const averageValue = totalValue / totalItems;
  
    return {
      category: cat,
      itemCount: totalItems,
      totalValue,
      averageValue
    };
  });
  
  // Fix valueChartData with proper types
  const valueChartData = {
    labels: Array.from(new Set(inventoryData.map((item: InventoryItem) => item.category))),
    datasets: [{
      label: 'Value by Category',
      data: Array.from(new Set(inventoryData.map((item: InventoryItem) => item.category)))
        .map(cat => 
          inventoryData
            .filter((item: InventoryItem) => item.category === cat)
            .reduce((sum: number, item: InventoryItem) => 
              sum + (item.price * item.quantity), 0)
        ),
      backgroundColor: 'rgba(54, 162, 235, 0.5)'
    }]
  };

  const generateInventoryPDF = () => {
    const doc = new jsPDF();
      
    // Add header
    doc.setFontSize(20);
    doc.text('Inventory Overview Report', 14, 15);
      
    // Add report info
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 25);
    
    // Add summary metrics
    doc.text('Summary:', 14, 35);
    doc.setFontSize(11);
    doc.text(`Total Items: ${totalItems}`, 14, 45);
    doc.text(`Active Items: ${activeItems}`, 14, 52);
    doc.text(`Low Stock Items: ${lowStockItems}`, 14, 59);
    doc.text(`Total Value: €${totalValue.toFixed(2)}`, 14, 66);
    
    // Add items table with proper typing
    doc.autoTable({
      startY: 80,
      head: [['Item Name', 'Category', 'Quantity', 'Price', 'Total Value', 'Location']],
      body: inventoryData.map((item: InventoryItem) => [
        item.name,
        item.category,
        item.quantity,
        `€${item.price.toFixed(2)}`,
        `€${(item.quantity * item.price).toFixed(2)}`,
        `${item.location.aisle}-${item.location.shelf}-${item.location.section}`
      ]),
    });
      
    doc.save('inventory-report.pdf');
  };
  
  const generateCategoryPDF = () => {
    const doc = new jsPDF();
    
    // Add header
    doc.setFontSize(20);
    doc.text('Category Analysis Report', 14, 15);
    
    // Add report info
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 25);
    doc.text(`Total Categories: ${categories}`, 14, 32);
    
    // Get data by category
    const categoryData = Array.from(new Set(inventoryData.map((item: InventoryItem) => item.category))).map(cat => {
      const items = inventoryData.filter((item: InventoryItem) => item.category === cat);
      const totalItems = items.length;
      const totalValue = items.reduce((sum: number, item: InventoryItem) => sum + (item.price * item.quantity), 0);
      const averageValue = totalValue / totalItems;
      
      return {
        category: cat,
        itemCount: totalItems,
        totalValue,
        averageValue
      };
    });
    
    // Add category summary table
    doc.autoTable({
      startY: 45,
      head: [['Category', 'Items', 'Total Value', 'Avg Value/Item']],
      body: categoryData.map(cat => [
        cat.category,
        cat.itemCount,
        `€${cat.totalValue.toFixed(2)}`,
        `€${cat.averageValue.toFixed(2)}`
      ]),
    });
      
    doc.save('category-report.pdf');
  };

  return (
    <IonContent>
      <div className="dashboard-container">
        
        {/* Report Buttons */}
        <IonRow className="report-buttons">
          <IonCol>
            <IonButton 
              expand="block"
              onClick={generateInventoryPDF}
              className="report-button"
            >
              Generate Inventory Report
            </IonButton>
          </IonCol>
          <IonCol>
            <IonButton 
              expand="block"
              onClick={generateCategoryPDF}
              className="report-button"
            >
              Generate Category Report
            </IonButton>
          </IonCol>
        </IonRow>

        {/* Metric Cards */}
        <IonGrid>
          <IonRow>
            <IonCol sizeMd="3" sizeSm="6">
              <IonCard className="dashboard-card">
                <IonCardHeader>
                  <IonIcon icon={cubeOutline} className="card-icon" />
                  <IonCardTitle>Total Stock</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <div className="metric-value">{totalItems}</div>
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

          {/* Charts Row */}
          <IonRow>
            <IonCol sizeMd="6">
              <IonCard className="dashboard-card">
                <IonCardHeader>
                  <IonCardTitle>Category Distribution</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <div className="chart-container">
                    <Doughnut data={categoryChartData} options={{ responsive: true, maintainAspectRatio: false }} />
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
                  <div className="chart-container">
                    <Bar data={valueChartData} options={{ responsive: true, maintainAspectRatio: false }} />
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