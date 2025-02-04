// src/components/AddItem.tsx
import React, { useState } from "react";
import { addInventoryItem } from "../../firestoreService";
import { auth } from '../../../firebaseConfig';
import './AddItem.css';
import { IonButton } from '@ionic/react';

interface AddItemProps {
  onClose: () => void;
  categories?: string[]; // Add this line
}

const AddItem: React.FC<AddItemProps> = ({ onClose, categories = [] }) => {
  const currentUser = auth.currentUser; // Add this line
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [price, setPrice] = useState(0);
  const [category, setCategory] = useState("");
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

  // Add state for showing suggestions
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const [filteredCategories, setFilteredCategories] = useState<string[]>([]);

  // Add category suggestion handler
  const handleCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCategory(value);
    
    if (value.trim()) {
      const suggestions = categories.filter(cat => 
        cat.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCategories(suggestions);
      setShowCategorySuggestions(true);
    } else {
      setShowCategorySuggestions(false);
    }
  };

  const selectCategory = (selectedCategory: string) => {
    setCategory(selectedCategory);
    setShowCategorySuggestions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await addInventoryItem({
      name,
      quantity,
      price,
      category,
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
        addedBy: currentUser?.email || 'unknown',
        addedDate: new Date().toISOString()
      }
    });

    // Reset form
    setName("");
    setQuantity(0);
    setPrice(0);
    setCategory("");
    setDimensions({ length: 0, width: 0, height: 0 });
    setLocation({ aisle: "", shelf: "", section: "" });
    
    onClose(); // Close the modal after successful submission
    alert("Item added successfully!");
  };

  return (
    <div className="modal-content">
      <div className="modal-header">
        <h3>Add New Inventory Item</h3>
        <IonButton fill="clear" onClick={onClose}>Close</IonButton>
      </div>
      <form onSubmit={handleSubmit} className="add-item-form">
        {/* Basic Information */}
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
        </div>

        {/* Category & Added By Section */}
        <div className="form-section">
          <h4>Category & Added By</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Category:</label>
              <div className="category-input-container">
                <input 
                  type="text" 
                  value={category} 
                  onChange={handleCategoryChange}
                  onFocus={() => {
                    setFilteredCategories(categories);
                    setShowCategorySuggestions(true);
                  }}
                  placeholder="Enter or select category"
                />
                {showCategorySuggestions && (
                  <div className="category-suggestions">
                    {(filteredCategories.length > 0 ? filteredCategories : categories).map((suggestion, index) => (
                      <div
                        key={index}
                        className="category-suggestion-item"
                        onClick={() => selectCategory(suggestion)}
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="form-group">
              <label>Added By:</label>
              <input 
                type="text" 
                value={currentUser?.email || 'Unknown'} 
                disabled
                className="added-by-input"
              />
            </div>
          </div>
        </div>

        {/* Dimensions */}
        <div className="form-section">
          <h4>Dimensions (in cm)</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Length:</label>
              <input 
                type="number" 
                value={dimensions.length} 
                onChange={(e) => setDimensions({...dimensions, length: parseFloat(e.target.value)})}
                step="0.1"
              />
            </div>
            
            <div className="form-group">
              <label>Width:</label>
              <input 
                type="number" 
                value={dimensions.width} 
                onChange={(e) => setDimensions({...dimensions, width: parseFloat(e.target.value)})}
                step="0.1"
              />
            </div>
            
            <div className="form-group">
              <label>Height:</label>
              <input 
                type="number" 
                value={dimensions.height} 
                onChange={(e) => setDimensions({...dimensions, height: parseFloat(e.target.value)})}
                step="0.1"
              />
            </div>
          </div>
        </div>

        {/* Location */}
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
        
        <button type="submit" className="submit-button">Add Item</button>
      </form>
    </div>
  );
};

export default AddItem;
