import React, { useState, useEffect } from 'react';
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
import { auth } from '../../firebaseConfig';
import { useRole } from '../hooks/useRole';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const ionRouter = useIonRouter();
  const { role } = useRole();
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
    { title: 'User Management', path: '/users', icon: peopleOutline, roles: ['admin'] },
    { title: 'Settings', path: '/settings', icon: settingsOutline, roles: ['admin', 'manager', 'employee'] },
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
      <IonSplitPane contentId="main" when="md" style={{ '--side-width': '180px' }}>
        <IonMenu contentId="main" style={{ 
          '--background': '#f0f8ff',
          '--padding-top': '20px', 
        }}>
          <IonContent style={{ 
            '--background': '#f0f8ff',
            '--padding-top': '20px', 
            borderRight: '1px solid var(--ion-color-light-shade)'
          }}>
            <IonList style={{ 
              marginTop: '5px', 
              background: 'transparent'  
            }}>
              {menuItems
                .filter(item => item.roles.includes(role))
                .map((item) => (
                <IonMenuToggle key={item.path} autoHide={false}>
                  <IonItem 
                    className={location.pathname === item.path ? 'selected' : ''} 
                    routerLink={item.path} 
                    routerDirection="none"
                    lines="none"
                    button
                    style={{ 
                      minHeight: '36px', 
                      '--padding-start': '16px',
                      '--background': 'transparent',
                      '--background-hover': 'rgba(var(--ion-color-primary-rgb), 0.1)',
                      '--color': 'var(--ion-color-dark)',
                      borderRadius: '8px',
                      margin: '2px 8px' 
                    }}
                  >
                    <IonIcon 
                      slot="start" 
                      icon={item.icon}
                      style={{ 
                        fontSize: '1.2rem',
                        color: 'var(--ion-color-primary)'
                      }} 
                    />
                    <IonLabel style={{ 
                      fontSize: '0.9rem',
                      fontWeight: 500
                    }}>
                      {item.title}
                    </IonLabel>
                  </IonItem>
                </IonMenuToggle>
              ))}
              
              <IonItem 
                onClick={handleSignOut}
                button
                lines="none"
                className="sign-out-button"
                style={{ 
                  minHeight: '36px', 
                  '--padding-start': '16px',
                  '--background': 'transparent',
                  '--background-hover': 'rgba(var(--ion-color-danger-rgb), 0.1)',
                  '--color': 'var(--ion-color-danger)',
                  borderRadius: '8px',
                  margin: '2px 8px', 
                  marginBottom: '10px' 
                }}
              >
                <IonIcon 
                  slot="start" 
                  icon={logOutOutline}
                  style={{ 
                    fontSize: '1.2rem',
                    color: 'var(--ion-color-danger)'
                  }}
                />
                <IonLabel style={{ 
                  fontSize: '0.9rem',
                  fontWeight: 500
                }}>
                  Sign Out
                </IonLabel>
              </IonItem>
            </IonList>
          </IonContent>
        </IonMenu>
        <IonPage id="main">
          <IonHeader>
            <IonToolbar style={{ minHeight: '46px' }}>
              <IonTitle style={{ textAlign: 'center', fontSize: '1.1rem' }}>
                StockWise Inventory Management
              </IonTitle>
              {userName && (
                <div style={{ 
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '0.9rem',
                  color: 'var(--ion-color-medium)'
                }}>
                  Welcome, {userName}
                </div>
              )}
            </IonToolbar>
          </IonHeader>

          <IonContent className="main-content" style={{ '--padding-top': '46px' }}>
            {children}
          </IonContent>

          <IonFooter>
            <IonToolbar>
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