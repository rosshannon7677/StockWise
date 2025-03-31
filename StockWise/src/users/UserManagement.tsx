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
  IonIcon,
  IonBadge,
  IonCardHeader,
  IonCardTitle
} from '@ionic/react';
import { getUsers, updateUserRole, deleteUser, updateUserStatus } from '../firestoreService';
import { UserRole, UserRoleData } from '../types/roles';
import { auth } from '../../firebaseConfig';
import { trash, checkmarkCircle, shieldCheckmark } from 'ionicons/icons';
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
        console.log("Fetched users:", fetchedUsers); // Debug log
        setUsers(fetchedUsers);
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
    try {
      if (user.email === 'rosshannonty@gmail.com') {
        setError('Cannot delete admin account');
        return;
      }
      setUserToDelete(user);
      setShowDeleteAlert(true);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    
    try {
      await deleteUser(userToDelete.userId, userToDelete.email);
      setUsers(users.filter(u => u.userId !== userToDelete.userId));
      setUserToDelete(null);
      setShowDeleteAlert(false);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      await updateUserStatus(userId, 'active');
      // Update local state
      setUsers(users.map(user => 
        user.userId === userId 
          ? { ...user, status: 'active' } 
          : user
      ));
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <IonContent>
      <div className="user-management-container">
        {/* Admin User Section - Add this new section */}
        <IonCard className="admin-card">
          <IonCardHeader>
            <IonCardTitle>System Administrator</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonList>
              {users
                .filter(user => user.email === 'rosshannonty@gmail.com')
                .map(user => (
                  <IonItem 
                    key={user.userId}
                    className="admin-user"
                  >
                    <IonLabel>
                      <div className="admin-identifier">
                        <h2>{user.name}</h2>
                        <span className="admin-badge">
                          <IonIcon icon={shieldCheckmark} />
                          Primary Admin
                        </span>
                      </div>
                      <p>{user.email}</p>
                      <p className="role-text">Role: Administrator</p>
                    </IonLabel>
                  </IonItem>
                ))}
            </IonList>
          </IonCardContent>
        </IonCard>

        {/* Pending Users Section */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Pending Approvals</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonList>
              {users
                .filter(user => user.status === 'pending')
                .map(user => (
                  <IonItem key={user.userId}>
                    <IonLabel>
                      <h2>{user.name}</h2>
                      <p>{user.email}</p>
                      <IonBadge color="warning">Pending Approval</IonBadge>
                    </IonLabel>
                    <IonButton
                      onClick={() => handleApproveUser(user.userId)}
                      color="success"
                      className="approve-button" // Add this class
                    >
                      <IonIcon slot="start" icon={checkmarkCircle} />
                      Approve
                    </IonButton>
                  </IonItem>
                ))}
              {users.filter(user => user.status === 'pending').length === 0 && (
                <IonItem>
                  <IonLabel>No pending approvals</IonLabel>
                </IonItem>
              )}
            </IonList>
          </IonCardContent>
        </IonCard>

        {/* Active Users Section */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Active Users</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonList>
              {users
                .filter(user => user.status === 'active')
                .map(user => (
                  <IonItem 
                    key={user.userId}
                    className={user.email === 'rosshannonty@gmail.com' ? 'admin-user' : ''}
                  >
                    <IonLabel>
                      <div className="admin-identifier">
                        <h2>{user.name}</h2>
                        {user.email === 'rosshannonty@gmail.com' && (
                          <span className="admin-badge">
                            <IonIcon icon={shieldCheckmark} />
                            Primary Admin
                          </span>
                        )}
                      </div>
                      <p>{user.email}</p>
                    </IonLabel>
                    <IonSelect
                      value={user.role}
                      onIonChange={e => handleRoleChange(user.userId, e.detail.value)}
                      interface="popover"
                      disabled={user.email === 'rosshannonty@gmail.com'}
                      label={`Select role for ${user.name}`} // Add this line
                      labelPlacement="stacked" // Add this line
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
      </div>

      <IonAlert
        isOpen={showDeleteAlert}
        onDidDismiss={() => setShowDeleteAlert(false)}
        header="Confirm Delete"
        message="Are you sure you want to delete this user?"
        buttons={[
          {
            text: 'Cancel',
            role: 'cancel',
            handler: () => {
              setShowDeleteAlert(false);
              setUserToDelete(null);
            }
          },
          {
            text: 'Delete',
            role: 'confirm',
            handler: confirmDelete
          }
        ]}
      />

      {error && (
        <IonAlert
          isOpen={!!error}
          onDidDismiss={() => setError(null)}
          header="Error"
          message={error}
          buttons={['OK']}
        />
      )}
    </IonContent>
  );
};

export default UserManagement;