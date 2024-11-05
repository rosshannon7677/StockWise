// src/components/AddItem.tsx
import React, { useState } from "react";
import { addInventoryItem } from ".././firestoreService";

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
    <form onSubmit={handleSubmit}>
      <h3>Add New Inventory Item</h3>
      <label>
        Name:
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <label>
        Quantity:
        <input type="number" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value))} required />
      </label>
      <label>
        Price:
        <input type="number" value={price} onChange={(e) => setPrice(parseFloat(e.target.value))} required />
      </label>
      <label>
        Description:
        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>
      <button type="submit">Add Item</button>
    </form>
  );
};

export default AddItem;
