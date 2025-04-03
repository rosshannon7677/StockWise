import React, { useState, useEffect } from 'react';
import { 
  IonContent, IonButton, IonIcon, IonModal, IonItem, 
  IonLabel, IonInput, IonSelect, IonSelectOption, IonList, IonSearchbar
} from '@ionic/react';
import { addOutline, addCircleOutline, removeCircleOutline } from 'ionicons/icons';
import OrderList from '../../components/orders/OrderList';
import { getOrders, addOrder, getInventoryItems, getSuppliers } from '../../firestoreService';
import type { SupplierOrder, InventoryItem, Supplier } from '../../firestoreService';
import './Orders.css';
import { auth } from '../../../firebaseConfig';

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<SupplierOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all'); // Set default to 'all'
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<{
    itemId: string;
    name: string;
    quantity: number;
    price: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
  }[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');  // Keep 'all' as default
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Get unique supplier categories
  const supplierCategories = Array.from(new Set(suppliers.map(s => s.category)));

  // Filter suppliers based on selected category
  const filteredSuppliers = suppliers.filter(s => s.category === selectedCategory);
  
  useEffect(() => {
    const unsubscribeOrders = getOrders((fetchedOrders) => {
      setOrders(fetchedOrders);
    });

    const unsubscribeSuppliers = getSuppliers((fetchedSuppliers) => {
      setSuppliers(fetchedSuppliers);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeSuppliers();
    };
  }, []);

  const handleAddItem = () => {
    setSelectedItems([...selectedItems, { 
      itemId: `temp-${Date.now()}`,  // Generate a temporary unique ID
      name: '', 
      quantity: 1, 
      price: 0,
      dimensions: {
        length: 0,
        width: 0,
        height: 0
      }
    }]);
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...selectedItems];
    if (field === 'dimensions') {
      newItems[index] = { ...newItems[index], dimensions: value };
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
      const supplier = suppliers.find(s => s.id === selectedSupplier);
      if (!supplier) return;

      const orderData: Omit<SupplierOrder, 'id'> = {
        supplier: {
          id: supplier.id,
          name: supplier.name,
          email: supplier.email,
          phone: supplier.phone,
          category: supplier.category // Add supplier category
        },
        items: selectedItems,
        status: 'pending',
        totalAmount: calculateTotal(),
        orderDate: new Date().toISOString(),
        statusHistory: [  // Add this field
          {
            status: 'pending',
            date: new Date().toISOString(),
            updatedBy: auth.currentUser?.email || 'unknown'
          }
        ],
        metadata: {
          addedBy: auth.currentUser?.email || '',
          addedDate: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        }
      };

      await addOrder(orderData);
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  const resetForm = () => {
    setSelectedItems([]);
    setSelectedSupplier('');
    setSelectedCategory(''); // Add this
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.supplier.name.toLowerCase().includes(searchText.toLowerCase()) ||
      order.items.some(item => item.name.toLowerCase().includes(searchText.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || order.supplier.category === selectedCategory;
    
    // Hide received orders when viewing "all" orders
    if (selectedStatus === 'all') {
      return matchesSearch && matchesCategory && order.status !== 'received';
    }
    
    // Show orders matching the selected status
    const matchesStatus = order.status === selectedStatus;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleSearchChange = (e: CustomEvent) => {
    const value = e.detail.value || '';
    setSearchText(value);
    
    if (value.trim()) {
      const searchSuggestions = orders
        .flatMap(order => [
          order.supplier.name,
          ...order.items.map(item => item.name)
        ])
        .filter((name, index, self) => 
          name.toLowerCase().includes(value.toLowerCase()) && 
          self.indexOf(name) === index
        )
        .slice(0, 5);
      
      setSuggestions(searchSuggestions);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (value: string) => {
    setSearchText(value);
    setShowSuggestions(false);
  };

  return (
    <IonContent>
      <div className="orders-container">
        <div className="actions-bar">
          <IonButton onClick={() => setShowModal(true)}>
            <IonIcon slot="start" icon={addOutline} />
            New Order
          </IonButton>

          <div className="filters-group">
            <div className="search-container">
              <IonSearchbar
                value={searchText}
                onIonChange={handleSearchChange}
                placeholder="Search orders..."
                className="search-bar"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="search-suggestions">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="suggestion-item"
                      onClick={() => selectSuggestion(suggestion)}
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <IonSelect
              value={selectedStatus}
              onIonChange={e => setSelectedStatus(e.detail.value)}
              interface="popover"
              className="filter-select"
            >
              <IonSelectOption value="all">All Orders</IonSelectOption>
              <IonSelectOption value="pending">Pending</IonSelectOption>
              <IonSelectOption value="sent">Sent</IonSelectOption>
              <IonSelectOption value="shipped">Shipped</IonSelectOption>
              <IonSelectOption value="received">Received</IonSelectOption>
              <IonSelectOption value="canceled">Canceled</IonSelectOption>
            </IonSelect>

            <IonSelect
              value={selectedCategory}
              onIonChange={e => setSelectedCategory(e.detail.value)}
              interface="popover"
              className="filter-select"
            >
              <IonSelectOption value="all">All Categories</IonSelectOption>
              {supplierCategories.map(category => (
                <IonSelectOption key={category} value={category}>
                  {category}
                </IonSelectOption>
              ))}
            </IonSelect>
          </div>
        </div>

        <OrderList orders={filteredOrders} />
      </div>
    </IonContent>
  );
};

export default Orders;