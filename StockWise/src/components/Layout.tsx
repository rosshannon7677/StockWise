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
      <IonSplitPane contentId="main" when="md" style={{ '--side-width': '200px' }}>
        <IonMenu contentId="main">
          <IonHeader>
            <IonToolbar>
              <IonTitle>StockWise</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <IonList>
              {menuItems.map((item) => (
                <IonMenuToggle key={item.path} autoHide={false}>
                  <IonItem 
                    className={location.pathname === item.path ? 'selected' : ''} 
                    routerLink={item.path} 
                    routerDirection="none"
                    lines="none"
                    detail={false}
                  >
                    <IonIcon slot="start" icon={item.icon} />
                    <IonLabel>{item.title}</IonLabel>
                  </IonItem>
                </IonMenuToggle>
              ))}
              
              <IonItem 
                onClick={handleSignOut}
                button
                lines="none"
                className="sign-out-button"
              >
                <IonIcon slot="start" icon={logOutOutline} />
                <IonLabel>Sign Out</IonLabel>
              </IonItem>
            </IonList>
          </IonContent>
        </IonMenu>
        <IonPage id="main">
          <IonHeader>
            <IonToolbar>
              <IonTitle>StockWise - Inventory Management</IonTitle>
            </IonToolbar>
          </IonHeader>

          <IonContent className="main-content">
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