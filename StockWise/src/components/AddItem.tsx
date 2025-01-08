// src/components/AddItem.tsx
import React, { useState } from "react";
import { addInventoryItem } from "../firestoreService";
import { auth } from '../../firebaseConfig';
import './AddItem.css';

const AddItem: React.FC = () => {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [price, setPrice] = useState(0);
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
      location: `Aisle ${location.aisle}, Shelf ${location.shelf}, Section ${location.section}`,
      metadata: {
        addedBy: currentUser?.uid || 'unknown',
        addedDate: new Date().toISOString()
      }
    });

    // Reset form
    setName("");
    setQuantity(0);
    setPrice(0);
    setDescription("");
    setDimensions({ length: 0, width: 0, height: 0 });
    setLocation({ aisle: "", shelf: "", section: "" });
    alert("Item added successfully!");
  };

  return (
    <form onSubmit={handleSubmit} className="add-item-form">
      <h3>Add New Inventory Item</h3>
      
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
  );
};

export default AddItem;
