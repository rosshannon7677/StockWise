// src/components/AddItem.tsx
import React, { useState } from "react";

const AddItem: React.FC = () => {
  
  const handleSubmit = async (e: React.FormEvent) => {
   
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Add New Inventory Item</h3>
      <label>
        Name:
      </label>
      <label>
        Quantity:        
      </label>
      <label>
        Price:   
      </label>
      <label>
        Description:       
      </label>
      <button type="submit">Add Item</button>
    </form>
  );
};

export default AddItem;
