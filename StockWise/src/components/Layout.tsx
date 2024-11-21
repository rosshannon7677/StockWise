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
} from '@ionic/react';
import { homeOutline, listOutline, statsChartOutline, settingsOutline } from 'ionicons/icons';
import { useLocation } from 'react-router';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const menuItems = [
    { title: 'Home', path: '/home', icon: homeOutline },
    { title: 'Inventory', path: '/inventory', icon: listOutline },
    { title: 'Reports', path: '/reports', icon: statsChartOutline },
    { title: 'Settings', path: '/settings', icon: settingsOutline },
  ];

  return (
    <IonPage>
      <IonSplitPane contentId="main">
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
            </IonList>
          </IonContent>
        </IonMenu>
        <IonPage id="main">
          {children}
        </IonPage>
      </IonSplitPane>
    </IonPage>
  );
};

export default Layout;