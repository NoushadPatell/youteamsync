// src/components/layout/NotificationCenter.tsx
import { useState } from 'react';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { useNavigate } from 'react-router-dom';

export const NotificationCenter = () => {
    const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const handleNotificationClick = (notification: any) => {
        markAsRead(notification.id);
        if (notification.actionUrl) {
            navigate(notification.actionUrl);
            setIsOpen(false);
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'success':
                return '✅';
            case 'warning':
                return '⚠️';
            case 'error':
                return '❌';
            default:
                return '💡';
        }
    };

    const getNotificationColor = (type: string) => {
        switch (type) {
            case 'success':
                return 'bg-success-light border-success';
            case 'warning':
                return 'bg-warning-light border-warning';
            case 'error':
                return 'bg-error-light border-error';
            default:
                return 'bg-brand-pale border-brand-light';
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" className="relative rounded-xl">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md overflow-auto rounded-l-2xl">
                <SheetHeader className="border-b pb-4 mb-4">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="text-xl font-bold">Notifications</SheetTitle>
                        {notifications.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={markAllAsRead}
                                className="text-xs rounded-lg"
                            >
                                <Check className="w-4 h-4 mr-1" />
                                Mark all read
                            </Button>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <p className="text-sm text-gray-600">
                            You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                        </p>
                    )}
                </SheetHeader>

                <div className="space-y-3">
                    {notifications.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Bell className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-600 font-medium">No notifications</p>
                            <p className="text-sm text-gray-500 mt-1">You're all caught up!</p>
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${notification.read
                                        ? 'bg-white border-gray-200 opacity-60'
                                        : getNotificationColor(notification.type)
                                    } hover:shadow-md`}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="text-2xl flex-shrink-0">
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <h4 className="font-semibold text-gray-900 text-sm">
                                                {notification.title}
                                            </h4>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 rounded-full hover:bg-red-100"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    clearNotification(notification.id);
                                                }}
                                            >
                                                <X className="w-3 h-3" />
                                            </Button>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {notification.message}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-2">
                                            {new Date(notification.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
};