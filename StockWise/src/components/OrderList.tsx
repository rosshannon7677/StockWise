import React, { useState } from 'react';
import { IonCard, IonCardHeader, IonCardContent, IonBadge, IonButton } from '@ionic/react';
import './OrderList.css';

interface OrderItem {
  itemId: string;
  name: string;
  quantity: number;
  price: number;
}

interface CustomerOrder {
  id: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  items: OrderItem[];
  status: 'pending' | 'inProgress' | 'shipped' | 'delivered';
  totalAmount: number;
  orderDate: string;
  expectedDeliveryDate?: string;
  notes?: string;
  metadata: {
    addedBy: string;
    addedDate: string;
    lastUpdated: string;
  };
}

interface OrderListProps {
  orders: CustomerOrder[];
}

const OrderList: React.FC<OrderListProps> = ({ orders }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending': return 'warning';
      case 'inProgress': return 'primary';
      case 'shipped': return 'secondary';
      case 'delivered': return 'success';
      default: return 'medium';
    }
  };

  const handleEdit = (order: CustomerOrder) => {
    // Will implement edit functionality
    console.log('Edit order:', order);
  };

  const handleDelete = async (orderId: string) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      // Will implement delete functionality
      console.log('Delete order:', orderId);
    }
  };

  return (
    <div className="orders-container">
      {orders.map((order: CustomerOrder) => (
        <IonCard key={order.id} className="order-card">
          <IonCardHeader>
            <div className="order-header">
              <h3>{order.customer.name}</h3>
              <div className="order-actions">
                <IonBadge color={getStatusColor(order.status)}>
                  {order.status}
                </IonBadge>
                <IonButton 
                  fill="clear" 
                  size="small" 
                  onClick={() => handleEdit(order)}
                >
                  Edit
                </IonButton>
                <IonButton 
                  fill="clear" 
                  color="danger" 
                  size="small" 
                  onClick={() => handleDelete(order.id)}
                >
                  Delete
                </IonButton>
              </div>
            </div>
          </IonCardHeader>
          <IonCardContent>
            <div className="order-items">
              {order.items.map((item: OrderItem, index: number) => (
                <div key={index} className="order-item">
                  <span>{item.name}</span>
                  <span>x{item.quantity}</span>
                  <span>€{item.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="order-footer">
              <p>Total: €{order.totalAmount.toFixed(2)}</p>
              <p>Order Date: {new Date(order.orderDate).toLocaleDateString()}</p>
            </div>
          </IonCardContent>
        </IonCard>
      ))}
    </div>
  );
};

export default OrderList;