import React, { useState, useEffect } from 'react';
import { IonContent } from '@ionic/react';
import InventoryList from './InventoryList';
import { getInventoryItems, addInventoryItem } from '../firestoreService';
import './AddItem.css';

const InventoryManagement: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [price, setPrice] = useState(0);
  const [description, setDescription] = useState("");

  useEffect(() => {
    getInventoryItems((fetchedItems) => {
      setItems(fetchedItems);
    });
  }, []);

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
      
    </IonContent>
  );
};

export default InventoryManagement;