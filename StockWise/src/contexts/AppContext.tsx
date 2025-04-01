import React, { createContext, useState, useContext, useEffect } from 'react';
import { useIonRouter } from '@ionic/react';

interface AppContextType {
  defaultView: string;
  itemsPerPage: number;
  setDefaultView: (view: string) => void;
  setItemsPerPage: (count: number) => void;
}

const AppContext = createContext<AppContextType>({
  defaultView: 'inventory',
  itemsPerPage: 20,
  setDefaultView: () => {},
  setItemsPerPage: () => {},
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [defaultView, setDefaultView] = useState(() => 
    localStorage.getItem('defaultView') || 'inventory'
  );
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    const saved = localStorage.getItem('itemsPerPage');
    return saved ? parseInt(saved) : 20;
  });
  const [autoLogout, setAutoLogout] = useState(() => 
    localStorage.getItem('autoLogout') !== 'false'
  );
  const router = useIonRouter();

  useEffect(() => {
    localStorage.setItem('defaultView', defaultView);
  }, [defaultView]);

  useEffect(() => {
    localStorage.setItem('itemsPerPage', String(itemsPerPage));
  }, [itemsPerPage]);

  return (
    <AppContext.Provider value={{
      defaultView,
      itemsPerPage,
      setDefaultView,
      setItemsPerPage: (count: number) => setItemsPerPage(count),
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);