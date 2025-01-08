import React, { useState, useEffect } from 'react';
import { IonContent, IonSearchbar, IonSelect, IonSelectOption } from '@ionic/react';
import { SearchbarInputEventDetail } from '@ionic/core';
import InventoryList from './InventoryList';
import { getInventoryItems, addInventoryItem } from '../firestoreService';
import './AddItem.css';
import { auth } from '../../firebaseConfig';

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  description?: string;
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
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState<number>(0);
  const [price, setPrice] = useState<number>(0);
  const [description, setDescription] = useState("");
  const [dimensions, setDimensions] = useState({
    length: 0,
    width: 0,
    height: 0
  });
  const [location, setLocation] = useState({
    aisle: "",
    shelf: "",
    section: ""
  });
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

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuantity(value === '' ? 0 : Math.max(0, parseInt(value) || 0));
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPrice(value === '' ? 0 : Math.max(0, parseFloat(value) || 0));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentUser = auth.currentUser;
    
    await addInventoryItem({
      name,
      quantity,
      price,
      description,
      dimensions: {
        length: dimensions.length,
        width: dimensions.width,
        height: dimensions.height
      },
      location: {
        aisle: location.aisle,
        shelf: location.shelf,
        section: location.section
      },
      metadata: {
        addedBy: currentUser?.uid || 'unknown',
        addedDate: new Date().toISOString()
      }
    });
  
    setName("");
    setQuantity(0);
    setPrice(0);
    setDescription("");
    setDimensions({
      length: 0,
      width: 0,
      height: 0
    });
    setLocation({
      aisle: "",
      shelf: "",
      section: ""
    });
    alert("Item added successfully!");
  };

  return (
    <IonContent>
      <div className="inventory-container">
        <div className="add-item-section">
          <form onSubmit={handleSubmit} className="add-item-form">
            <h3>Add New Inventory Item</h3>
            
            <div className="form-section">
              <h4>Basic Information</h4>
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
                  min="0"
                  value={quantity || ''}
                  onChange={handleQuantityChange}
                  required 
                />
              </div>
              
              <div className="form-group">
                <label>Price:</label>
                <input 
                  type="number"
                  min="0"
                  step="0.01"
                  value={price || ''}
                  onChange={handlePriceChange}
                  required 
                />
              </div>
            </div>

            <div className="form-section">
              <h4>Dimensions (in cm)</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Length:</label>
                  <input 
                    type="number"
                    value={dimensions.length}
                    onChange={(e) => setDimensions({...dimensions, length: parseFloat(e.target.value) || 0})}
                    step="0.1"
                  />
                </div>
                
                <div className="form-group">
                  <label>Width:</label>
                  <input 
                    type="number"
                    value={dimensions.width}
                    onChange={(e) => setDimensions({...dimensions, width: parseFloat(e.target.value) || 0})}
                    step="0.1"
                  />
                </div>
                
                <div className="form-group">
                  <label>Height:</label>
                  <input 
                    type="number"
                    value={dimensions.height}
                    onChange={(e) => setDimensions({...dimensions, height: parseFloat(e.target.value) || 0})}
                    step="0.1"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h4>Warehouse Location</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Aisle:</label>
                  <input 
                    type="text"
                    value={location.aisle}
                    onChange={(e) => setLocation({...location, aisle: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Shelf:</label>
                  <input 
                    type="text"
                    value={location.shelf}
                    onChange={(e) => setLocation({...location, shelf: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Section:</label>
                  <input 
                    type="text"
                    value={location.section}
                    onChange={(e) => setLocation({...location, section: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h4>Additional Information</h4>
              <div className="form-group">
                <label>Description:</label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
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