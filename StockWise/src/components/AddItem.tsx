// src/components/AddItem.tsx
import React, { useState } from "react";
import { addInventoryItem } from "../firestoreService";
import './AddItem.css';

const AddItem: React.FC = () => {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [price, setPrice] = useState(0);
  const [description, setDescription] = useState("");

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
  );
};

export default AddItem;
