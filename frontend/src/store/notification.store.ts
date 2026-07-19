import { create } from 'zustand';

export type NotificationType = 'success' | 'error' | 'info';

interface Notification {
  id: string;
  message: string;
  type: NotificationType;
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (message: string, type?: NotificationType) => void;
  removeNotification: (id: string) => void;
}

let counter = 0;

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  addNotification: (message, type = 'info') => {
    const id = `notif-${++counter}`;
    set((state) => ({
      notifications: [...state.notifications, { id, message, type }],
    }));
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }));
    }, type === 'error' ? 5000 : 3000);
  },
  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },
}));
