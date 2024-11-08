// src/components/InventoryList.tsx
import React from "react";

const InventoryList: React.FC<{ items: any[] }> = ({ items }) => {
    return (
      <div>
        <h3>Inventory List</h3>
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              <strong>Name:</strong> {item.name || "N/A"} <br />
              <strong>Quantity:</strong> {item.quantity || 0} <br />
              <strong>Price:</strong> ${Number(item.price).toFixed(2)} <br />
              <strong>Description:</strong> {item.description || "No description"}
            </li>
          ))}
        </ul>
      </div>
    );
  };

export default InventoryList;
