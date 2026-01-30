// src/contexts/NotificationContext.tsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { socket } from '@/utilities/socketConnection';

export type Notification = {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    actionUrl?: string;
};

type NotificationContextType = {
    notifications: Notification[];
    unreadCount: number;
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearNotification: (id: string) => void;
    clearAll: () => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode; userEmail: string }> = ({ 
    children, 
    userEmail 
}) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
        const newNotification: Notification = {
            ...notification,
            id: Date.now().toString(),
            timestamp: new Date(),
            read: false,
        };
        setNotifications(prev => [newNotification, ...prev]);
    }, []);

    const markAsRead = useCallback((id: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, []);

    const clearNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);

    // Listen for socket events
    useEffect(() => {
        if (!userEmail) return;

        // Video assignment notification
        socket.on('task-assigned', (data: { videoTitle: string; role: string; creator: string }) => {
            addNotification({
                type: 'info',
                title: 'New Task Assigned',
                message: `${data.creator} assigned you to work on "${data.videoTitle}" as ${data.role.replace('_', ' ')}`,
                actionUrl: '/editor/tasks'
            });
        });

        // Video completed notification
        socket.on('task-completed', (data: { videoTitle: string; editor: string }) => {
            addNotification({
                type: 'success',
                title: 'Task Completed',
                message: `${data.editor} completed work on "${data.videoTitle}"`,
                actionUrl: '/creator/videos'
            });
        });

        // Message notification (already handled by chat, but we can add badge)
        socket.on('new-message', (data: { from: string }) => {
            addNotification({
                type: 'info',
                title: 'New Message',
                message: `${data.from.split('@')[0]} sent you a message`,
            });
        });

        return () => {
            socket.off('task-assigned');
            socket.off('task-completed');
            socket.off('new-message');
        };
    }, [userEmail, addNotification]);

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                addNotification,
                markAsRead,
                markAllAsRead,
                clearNotification,
                clearAll,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
};