import React, { useState, useEffect } from 'react';
import { IonContent, IonSearchbar, IonSelect, IonSelectOption } from '@ionic/react';
import { SearchbarInputEventDetail } from '@ionic/core';
import InventoryList from './InventoryList';
import { getInventoryItems, addInventoryItem } from '../firestoreService';
import './AddItem.css';

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  description?: string;
}

const InventoryManagement: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [price, setPrice] = useState(0);
  const [description, setDescription] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [searchText, setSearchText] = useState("");
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

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
      return matchesSearch;
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
  }, [searchText, sortBy, items]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addInventoryItem({ name, quantity, price, description });
    setName("");
    setQuantity(0);
    setPrice(0);
    setDescription("");
    alert("Item added successfully!");
  };

  return (
    <IonContent>
      <div className="inventory-container">
        <div className="add-item-section">
          <form onSubmit={handleSubmit} className="add-item-form">
            <h3>Add New Inventory Item</h3>
            <div className="form-group">
              <label>Name:</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
            </div>
            
            <div className="form-group">
              <label>Quantity:</label>
              <input 
                type="number" 
                value={quantity} 
                onChange={(e) => setQuantity(parseInt(e.target.value))} 
                required 
              />
            </div>
            
            <div className="form-group">
              <label>Price:</label>
              <input 
                type="number" 
                value={price} 
                onChange={(e) => setPrice(parseFloat(e.target.value))} 
                required 
                step="0.01"
              />
            </div>
            
            <div className="form-group">
              <label>Description:</label>
              <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <button type="submit" className="submit-button">Add Item</button>
          </form>
        </div>
        <div className="inventory-section">
          <h2>Current Inventory</h2>
          <div className="search-filter-container">
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
          <InventoryList items={filteredItems} categories={[]} />
        </div>
      </div>
    </IonContent>
  );
};

export default InventoryManagement;