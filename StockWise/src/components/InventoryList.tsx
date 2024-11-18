// src/components/InventoryList.tsx
import React from "react";
import "./InventoryList.css";


interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  description?: string;
}

const InventoryList: React.FC<{ items: InventoryItem[] }> = ({ items }) => {
  return (
    <div className="inventory-list">
      {items.map((item) => (
        <div key={item.id} className="inventory-item">
          <h3>{item.name}</h3>
          <p><strong>Quantity:</strong> {item.quantity}</p>
          <p><strong>Price:</strong> ${item.price.toFixed(2)}</p>
          <p><strong>Description:</strong> {item.description || "No description"}</p>
        </div>
      ))}
    </div>
  );
};

export default InventoryList;
