import React, { useState, useEffect } from 'react';
import { 
  IonContent, IonButton, IonIcon, IonModal, IonItem, 
  IonLabel, IonInput, IonSelect, IonSelectOption, IonList
} from '@ionic/react';
import { addOutline, addCircleOutline, removeCircleOutline } from 'ionicons/icons';
import OrderList from '../components/OrderList';
import { getOrders, addOrder, getInventoryItems } from '../firestoreService';
import type { CustomerOrder, InventoryItem } from '../firestoreService';
import './Orders.css';

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState<{
    itemId: string;
    name: string;
    quantity: number;
    price: number;
  }[]>([]);
  const [newOrder, setNewOrder] = useState({
    customer: {
      name: '',
      email: '',
      phone: '',
      address: ''
    },
    items: [],
    status: 'pending' as const,
    totalAmount: 0,
    orderDate: new Date().toISOString(),
    metadata: {
      addedBy: '',
      addedDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    }
  });

  useEffect(() => {
    const unsubscribeOrders = getOrders((fetchedOrders) => {
      setOrders(fetchedOrders);
    });

    const unsubscribeInventory = getInventoryItems((items) => {
      setInventoryItems(items);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeInventory();
    };
  }, []);

  const handleAddItem = () => {
    setSelectedItems([...selectedItems, { itemId: '', name: '', quantity: 1, price: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...selectedItems];
    if (field === 'itemId') {
      const selectedItem = inventoryItems.find(item => item.id === value);
      if (selectedItem) {
        newItems[index] = {
          ...newItems[index],
          itemId: selectedItem.id,
          name: selectedItem.name,
          price: selectedItem.price,
          quantity: 1
        };
      }
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    setSelectedItems(newItems);
  };

  const calculateTotal = () => {
    return selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleCreateOrder = async () => {
    try {
      const orderData = {
        ...newOrder,
        items: selectedItems,
        totalAmount: calculateTotal(),
      };
      await addOrder(orderData);
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  const resetForm = () => {
    setNewOrder({
      customer: { name: '', email: '', phone: '', address: '' },
      items: [],
      status: 'pending',
      totalAmount: 0,
      orderDate: new Date().toISOString(),
      metadata: {
        addedBy: '',
        addedDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      }
    });
    setSelectedItems([]);
  };

  return (
    <IonContent>
      <div className="orders-container">
        
        <div className="actions-bar">
          <IonButton onClick={() => setShowModal(true)}>
            <IonIcon slot="start" icon={addOutline} />
            New Order
          </IonButton>
        </div>
        <OrderList orders={orders} />

        <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
          <div className="modal-content">
            <h2>Create New Order</h2>
            
            {/* Customer Information */}
            <div className="form-section">
              <h3>Customer Information</h3>
              <IonList>
                <IonItem>
                  <IonLabel position="floating">Customer Name</IonLabel>
                  <IonInput
                    value={newOrder.customer.name}
                    onIonChange={e => setNewOrder({
                      ...newOrder,
                      customer: { ...newOrder.customer, name: e.detail.value! }
                    })}
                  />
                </IonItem>
                <IonItem>
                  <IonLabel position="floating">Email</IonLabel>
                  <IonInput
                    type="email"
                    value={newOrder.customer.email}
                    onIonChange={e => setNewOrder({
                      ...newOrder,
                      customer: { ...newOrder.customer, email: e.detail.value! }
                    })}
                  />
                </IonItem>
                <IonItem>
                  <IonLabel position="floating">Phone</IonLabel>
                  <IonInput
                    type="tel"
                    value={newOrder.customer.phone}
                    onIonChange={e => setNewOrder({
                      ...newOrder,
                      customer: { ...newOrder.customer, phone: e.detail.value! }
                    })}
                  />
                </IonItem>
                <IonItem>
                  <IonLabel position="floating">Address</IonLabel>
                  <IonInput
                    value={newOrder.customer.address}
                    onIonChange={e => setNewOrder({
                      ...newOrder,
                      customer: { ...newOrder.customer, address: e.detail.value! }
                    })}
                  />
                </IonItem>
              </IonList>
            </div>

            {/* Order Items */}
            <div className="form-section">
              <h3>Order Items</h3>
              <IonButton onClick={handleAddItem} size="small">
                <IonIcon slot="start" icon={addCircleOutline} />
                Add Item
              </IonButton>
              
              {selectedItems.map((item, index) => (
                <div key={index} className="order-item-row">
                  <IonSelect
                    value={item.itemId}
                    placeholder="Select Item"
                    onIonChange={e => handleItemChange(index, 'itemId', e.detail.value)}
                  >
                    {inventoryItems.map(invItem => (
                      <IonSelectOption key={invItem.id} value={invItem.id}>
                        {invItem.name} (€{invItem.price})
                      </IonSelectOption>
                    ))}
                  </IonSelect>
                  <IonInput
                    type="number"
                    value={item.quantity}
                    placeholder="Qty"
                    min="1"
                    onIonChange={e => handleItemChange(index, 'quantity', parseInt(e.detail.value!))}
                  />
                  <div className="item-total">€{(item.price * item.quantity).toFixed(2)}</div>
                  <IonButton 
                    fill="clear" 
                    color="danger" 
                    onClick={() => handleRemoveItem(index)}
                  >
                    <IonIcon icon={removeCircleOutline} />
                  </IonButton>
                </div>
              ))}
              
              <div className="order-total">
                Total: €{calculateTotal().toFixed(2)}
              </div>
            </div>

            <div className="modal-actions">
              <IonButton 
                fill="outline" 
                onClick={() => setShowModal(false)}
              >
                Cancel
              </IonButton>
              <IonButton 
                color=""
                onClick={handleCreateOrder}
                disabled={selectedItems.length === 0 || !newOrder.customer.name}
              >
                Submit Order
              </IonButton>
            </div>
          </div>
        </IonModal>
      </div>
    </IonContent>
  );
};

export default Orders;