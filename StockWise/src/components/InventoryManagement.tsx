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


  return (
   
  );
};

export default InventoryManagement;