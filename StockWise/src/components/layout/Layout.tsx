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
  useIonRouter
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


interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { role } = useRole();
  const ionRouter = useIonRouter();
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setUserName(user.displayName);
    }
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
                StockWise Inventory Management
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