import React, { useState, useEffect } from 'react';
import './Layout.css';
import {
  IonPage,
  IonSplitPane,
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  IonMenuToggle,
  IonFooter,
  useIonRouter,
  IonBadge
} from '@ionic/react';
import { 
  homeOutline, 
  listOutline, 
  statsChartOutline, 
  settingsOutline,
  logOutOutline,
  reloadOutline,
  peopleOutline, 
  cartOutline 
} from 'ionicons/icons';
import { useLocation } from 'react-router';
import { auth } from '../../../firebaseConfig';
import { useRole } from '../../hooks/useRole';
import { useNavigate } from 'react-router-dom';
import { 
  getStockPredictions, 
  getOrders, 
  getUsers,
  StockPrediction, 
  SupplierOrder 
} from '../../firestoreService';
import { UserRoleData } from '../../types/roles';

interface LayoutProps {
  children: React.ReactNode;
}

// Add interfaces for type safety
interface Notifications {
  restock: number;
  orders: number;
  pendingUsers: number;  // Add this
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { role } = useRole();
  const ionRouter = useIonRouter();
  const [userName, setUserName] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notifications>({
    restock: 0,
    orders: 0,
    pendingUsers: 0  // Add this
  });

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setUserName(user.displayName);
    }
  }, []);

  useEffect(() => {
    // Get restock suggestions count - Show urgent items that need restocking
    const fetchRestockCount = async () => {
      const predictions = await getStockPredictions();
      const restockCount = predictions.filter((pred: StockPrediction) => {
        const currentQuantity = Number(pred.current_quantity) || 0;
        const dailyConsumption = Number(pred.daily_consumption) || 0;
        const daysUntilLow = Number(pred.predicted_days_until_low) || 0;
        
        // Calculate target stock (10 days worth)
        const targetStock = Math.ceil(dailyConsumption * 10);
        
        // Show count when:
        // 1. Days until low is less than 7 OR
        // 2. Current stock is below target stock level
        return daysUntilLow < 7 || currentQuantity < targetStock;
      }).length;
      
      setNotifications(prev => ({ ...prev, restock: restockCount }));
    };

    // Get pending orders count - Show all non-received orders
    const fetchPendingOrdersCount = () => {
      getOrders((orders: SupplierOrder[]) => {
        const pendingCount = orders.filter((order: SupplierOrder) => 
          // Changed condition to show all orders except 'received' and 'canceled'
          order.status !== 'received' && order.status !== 'canceled'
        ).length;
        setNotifications(prev => ({ ...prev, orders: pendingCount }));
      });
    };

    // Add new function to fetch pending users count with proper types
    const fetchPendingUsersCount = () => {
      getUsers().then((users: UserRoleData[]) => {
        const pendingCount = users.filter((user: UserRoleData) => 
          user.status === 'pending'
        ).length;
        setNotifications(prev => ({ ...prev, pendingUsers: pendingCount }));
      }).catch((error: Error) => {
        console.error('Error fetching pending users:', error);
      });
    };

    fetchRestockCount();
    fetchPendingOrdersCount();
    fetchPendingUsersCount(); // Add this

    // Refresh every 5 minutes
    const interval = setInterval(() => {
      fetchRestockCount();
      fetchPendingOrdersCount();
      fetchPendingUsersCount(); // Add this
    }, 300000);

    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { title: 'Home', path: '/home', icon: homeOutline, roles: ['admin', 'manager', 'employee'] },
    { title: 'Inventory', path: '/inventory', icon: listOutline, roles: ['admin', 'manager', 'employee'] },
    { title: 'Orders', path: '/orders', icon: cartOutline, roles: ['admin', 'manager'] },
    { title: 'Suppliers', path: '/suppliers', icon: peopleOutline, roles: ['admin', 'manager', 'employee'] },
    { title: 'Restock', path: '/restock', icon: reloadOutline, roles: ['admin', 'manager'] },
    { title: 'Reports', path: '/reports', icon: statsChartOutline, roles: ['admin', 'manager'] },
    { title: 'User Management', path: '/users', icon: peopleOutline, roles: ['admin'] }
  ];

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      if (ionRouter.canGoBack()) {
        await ionRouter.push('/login', 'root', 'replace');
      }
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <IonPage>
      <IonSplitPane contentId="main" when="md">
        <IonMenu contentId="main" className="menu-container">
          <IonContent className="menu-container">
            <IonList className="menu-list">
              {menuItems
                .filter(item => item.roles.includes(role))
                .map((item) => (
                  <IonMenuToggle key={item.path} autoHide={false}>
                    <IonItem 
                      className={`menu-item ${location.pathname === item.path ? 'selected' : ''}`}
                      routerLink={item.path} 
                      routerDirection="none"
                      lines="none"
                      button
                    >
                      <IonIcon 
                        slot="start" 
                        icon={item.icon}
                        className="menu-icon"
                      />
                      <IonLabel className="menu-label">
                        {item.title}
                      </IonLabel>
                      {item.path === '/restock' && notifications.restock > 0 && (
                        <IonBadge color="danger" className="notification-badge">
                          {notifications.restock}
                        </IonBadge>
                      )}
                      {item.path === '/orders' && notifications.orders > 0 && (
                        <IonBadge color="warning" className="notification-badge">
                          {notifications.orders}
                        </IonBadge>
                      )}
                      {item.path === '/users' && notifications.pendingUsers > 0 && (
                        <IonBadge color="warning" className="notification-badge">
                          {notifications.pendingUsers}
                        </IonBadge>
                      )}
                    </IonItem>
                  </IonMenuToggle>
                ))}
            </IonList>
          </IonContent>
          <IonItem 
            onClick={handleSignOut}
            button
            lines="none"
            className="sign-out-button"
          >
            <IonIcon 
              slot="start" 
              icon={logOutOutline}
              className="sign-out-icon"
            />
            <IonLabel className="menu-label">
              Sign Out
            </IonLabel>
          </IonItem>
        </IonMenu>

        <IonPage id="main">
          <IonHeader>
            <IonToolbar className="header-toolbar">
              <IonTitle className="header-title">
                StockWise
              </IonTitle>
              <div className="header-actions">
                {userName && (
                  <>
                    <span className="user-welcome">{userName}</span>
                    <IonIcon 
                      icon={settingsOutline}
                      className="settings-icon"
                      onClick={() => navigate('/settings')}
                    />
                    <IonIcon 
                      icon={logOutOutline}
                      className="sign-out-icon"
                      onClick={handleSignOut}
                    />
                  </>
                )}
              </div>
            </IonToolbar>
          </IonHeader>

          <IonContent className="main-content">
            {children}
          </IonContent>

          <IonFooter>
            <IonToolbar className="footer-toolbar">
              <div className="footer-content">
                <p>© 2024 StockWise. All rights reserved.</p>
              </div>
            </IonToolbar>
          </IonFooter>
        </IonPage>
      </IonSplitPane>
    </IonPage>
  );
};

export default Layout;