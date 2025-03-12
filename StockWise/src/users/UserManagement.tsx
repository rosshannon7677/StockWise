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
  IonAlert,
  IonButton,
  IonIcon
} from '@ionic/react';
import { getUsers, updateUserRole, setDefaultAdmin, deleteUser } from '../firestoreService';
import { UserRole, UserRoleData } from '../types/roles';
import { auth } from '../../firebaseConfig';
import { trash } from 'ionicons/icons';
import './UserManagement.css';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserRoleData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserRoleData | null>(null);

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

  const handleDeleteUser = async (user: UserRoleData) => {
    setUserToDelete(user);
    setShowDeleteAlert(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    
    try {
      await deleteUser(userToDelete.userId, userToDelete.email);
      setUsers(users.filter(u => u.userId !== userToDelete.userId));
      setShowDeleteAlert(false);
      setUserToDelete(null);
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
                    <IonSelectOption value="manager">Manager</IonSelectOption>
                    <IonSelectOption value="employee">Employee</IonSelectOption>
                  </IonSelect>
                  {user.email !== 'rosshannonty@gmail.com' && (
                    <IonButton 
                      fill="clear" 
                      color="danger"
                      onClick={() => handleDeleteUser(user)}
                    >
                      <IonIcon icon={trash} />
                    </IonButton>
                  )}
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
        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header="Confirm Delete"
          message={`Are you sure you want to remove ${userToDelete?.name} (${userToDelete?.email})?`}
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel'
            },
            {
              text: 'Delete',
              role: 'confirm',
              handler: confirmDelete
            }
          ]}
        />
      </div>
    </IonContent>
  );
};

export default UserManagement;