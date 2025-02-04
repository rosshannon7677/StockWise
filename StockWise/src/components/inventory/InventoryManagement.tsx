import React, { useState, useEffect } from 'react';
import { IonContent, IonSearchbar, IonSelect, IonSelectOption, IonButton, IonModal, IonIcon } from '@ionic/react';
import { SearchbarInputEventDetail } from '@ionic/core';
import InventoryList from './InventoryList';
import { getInventoryItems, addInventoryItem } from '../../firestoreService';
import './AddItem.css';
import { auth } from '../../../firebaseConfig';
import { addOutline } from 'ionicons/icons';
import AddItem from './AddItem';

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

const InventoryManagement: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [sortBy, setSortBy] = useState("name");
  const [searchText, setSearchText] = useState("");
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const categories = Array.from(new Set(items.map(item => item.category || 'Uncategorized')));

  useEffect(() => {
    getInventoryItems((fetchedItems) => {
      setItems(fetchedItems);
      setFilteredItems(fetchedItems);
    });
  }, []);

  useEffect(() => {
    const filtered = items.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchText.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchText.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'quantity':
          return b.quantity - a.quantity;
        case 'price':
          return b.price - a.price;
        default:
          return 0;
      }
    });

    setFilteredItems(sorted);
  }, [searchText, sortBy, items, selectedCategory]);

  const handleSearchChange = (event: CustomEvent<SearchbarInputEventDetail>) => {
    const value = event.detail.value || '';
    setSearchText(value);
    
    if (value.trim()) {
      const searchSuggestions = items
        .filter(item => 
          item.name.toLowerCase().includes(value.toLowerCase()) ||
          (item.description && item.description.toLowerCase().includes(value.toLowerCase()))
        )
        .slice(0, 5);
      setSuggestions(searchSuggestions.map(item => item.name));
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
      <div className="inventory-container">     
        <div className="inventory-section">
          <div className="search-filter-container">
            <IonButton 
              onClick={() => setShowAddModal(true)}
              color="primary"
              className="add-item-button"
            >
              <IonIcon slot="start" icon={addOutline} />
              Add Item
            </IonButton>

            <div className="search-container">
              <IonSearchbar
                value={searchText}
                onIonInput={handleSearchChange}
                placeholder="Search items..."
                className="search-bar"
                debounce={100}
                animated={true}
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="suggestions-dropdown">
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
              value={selectedCategory}
              onIonChange={e => setSelectedCategory(e.detail.value)}
              interface="popover"
              className="category-select"
            >
              <IonSelectOption value="all">All Categories</IonSelectOption>
              {categories.map(category => (
                <IonSelectOption key={category} value={category}>
                  {category}
                </IonSelectOption>
              ))}
            </IonSelect>
            <IonSelect
              value={sortBy}
              onIonChange={e => setSortBy(e.detail.value)}
              interface="popover"
              className="sort-select"
            >
              <IonSelectOption value="name">Sort by Name</IonSelectOption>
              <IonSelectOption value="quantity">Sort by Quantity</IonSelectOption>
              <IonSelectOption value="price">Sort by Price</IonSelectOption>
            </IonSelect>
          </div>
          <InventoryList items={filteredItems} categories={categories} />
        </div>
      </div>
      <IonModal 
        isOpen={showAddModal} 
        onDidDismiss={() => setShowAddModal(false)}
        className="add-item-modal"
      >
        <AddItem 
          onClose={() => setShowAddModal(false)} 
          categories={categories}
        />
      </IonModal>
    </IonContent>
  );
};

export default InventoryManagement;