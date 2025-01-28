import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonCard,
  IonCardContent,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonList,
  IonAlert
} from '@ionic/react';
import { getUsers, updateUserRole, setDefaultAdmin } from '../firestoreService';
import { UserRole, UserRoleData } from '../types/roles';
import { auth } from '../../firebaseConfig';
import './UserManagement.css';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserRoleData[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const fetchedUsers = await getUsers();
        setUsers(fetchedUsers);
        
        // Set rosshannonty@gmail.com as default admin
        const currentUser = auth.currentUser;
        if (currentUser?.email === 'rosshannonty@gmail.com') {
          await setDefaultAdmin('rosshannonty@gmail.com');
        }
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await updateUserRole(userId, newRole);
      setUsers(users.map(user => 
        user.userId === userId ? { ...user, role: newRole } : user
      ));
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <IonContent>
      <div className="user-management-container">
        <h1>User Management</h1>
        <IonCard>
          <IonCardContent>
            <IonList>
              {users.map(user => (
                <IonItem key={user.userId}>
                  <IonLabel>
                    <h2>{user.name}</h2>
                    <p>{user.email}</p>
                    {user.email === 'rosshannonty@gmail.com' && 
                      <p><small>(Default Admin)</small></p>
                    }
                  </IonLabel>
                  <IonSelect
                    value={user.role}
                    onIonChange={e => handleRoleChange(user.userId, e.detail.value)}
                    interface="popover"
                    disabled={user.email === 'rosshannonty@gmail.com'}
                  >
                    <IonSelectOption value="admin">Admin</IonSelectOption>
                    <IonSelectOption value="manager">Manager</IonSelectOption>
                    <IonSelectOption value="employee">Employee</IonSelectOption>
                  </IonSelect>
                </IonItem>
              ))}
            </IonList>
          </IonCardContent>
        </IonCard>
        {error && (
          <IonAlert
            isOpen={!!error}
            onDidDismiss={() => setError(null)}
            header="Error"
            message={error}
            buttons={['OK']}
          />
        )}
      </div>
    </IonContent>
  );
};

export default UserManagement;