import React from 'react';
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
  reloadOutline 
} from 'ionicons/icons';
import { useLocation } from 'react-router';
import { auth } from '../../firebaseConfig';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const ionRouter = useIonRouter();

  const menuItems = [
    { title: 'Home', path: '/home', icon: homeOutline },
    { title: 'Inventory', path: '/inventory', icon: listOutline },
    { title: 'Restock', path: '/restock', icon: reloadOutline },
    { title: 'Reports', path: '/reports', icon: statsChartOutline },
    { title: 'Settings', path: '/settings', icon: settingsOutline },
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
          '--background': 'var(--ion-color-primary-tint)',  // Light blue background
        }}>
          <IonContent style={{ 
            '--background': '#f0f8ff',  // Light blue background
            '--padding-top': '46px',
            borderRight: '1px solid var(--ion-color-light-shade)'
          }}>
            <IonList style={{ 
              marginTop: '10px',
              background: 'transparent'  // Make list background transparent
            }}>
              {menuItems.map((item) => (
                <IonMenuToggle key={item.path} autoHide={false}>
                  <IonItem 
                    className={location.pathname === item.path ? 'selected' : ''} 
                    routerLink={item.path} 
                    routerDirection="none"
                    lines="none"
                    detail={false}
                    style={{ 
                      minHeight: '44px',
                      '--padding-start': '16px',
                      '--background': 'transparent',
                      '--background-hover': 'rgba(var(--ion-color-primary-rgb), 0.1)',
                      '--color': 'var(--ion-color-dark)',
                      borderRadius: '8px',
                      margin: '4px 8px'
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
                  minHeight: '44px',
                  '--padding-start': '16px',
                  '--background': 'transparent',
                  '--background-hover': 'rgba(var(--ion-color-danger-rgb), 0.1)',
                  '--color': 'var(--ion-color-danger)',
                  borderRadius: '8px',
                  margin: '4px 8px'
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