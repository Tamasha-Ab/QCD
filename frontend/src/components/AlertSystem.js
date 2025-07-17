import React, { useState, useEffect, useContext, createContext } from 'react';
import api from '../api/api';
import { Bell } from 'lucide-react';

// Create Alert Context to make alerts available globally
const AlertContext = createContext();

export const useAlerts = () => useContext(AlertContext);

export const AlertProvider = ({ children }) => {
    const [alerts, setAlerts] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch alerts from backend
    const fetchAlerts = async () => {
        setLoading(true);
        try {
            const response = await api.get('/alerts', {
                params: { read: false }, // Get only unread alerts
            });

            if (response.data.success) {
                setAlerts(response.data.data);
                setUnreadCount(response.data.data.length);
            }
        } catch (err) {
            console.error('Error fetching alerts:', err);
            setError('Failed to load alerts');
        } finally {
            setLoading(false);
        }
    };

    // Mark alert as read
    const markAsRead = async (alertId) => {
        try {
            await api.put(`/alerts/${alertId}/read`, {});

            // Update local state
            setAlerts(prevAlerts =>
                prevAlerts.map(alert =>
                    alert._id === alertId ? { ...alert, read: true } : alert
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Error marking alert as read:', err);
        }
    };

    // Mark all alerts as read
    const markAllAsRead = async () => {
        try {
            await Promise.all(
                alerts.filter(alert => !alert.read).map(alert =>
                    api.put(`/alerts/${alert._id}/read`, {})
                )
            );

            // Update local state
            setAlerts(prevAlerts =>
                prevAlerts.map(alert => ({ ...alert, read: true }))
            );
            setUnreadCount(0);
        } catch (err) {
            console.error('Error marking all alerts as read:', err);
        }
    };

    // Check for new alerts every minute
    useEffect(() => {
        fetchAlerts();

        const interval = setInterval(() => {
            fetchAlerts();
        }, 60000); // Check every minute

        return () => clearInterval(interval);
    }, []);

    // Setup browser notifications
    useEffect(() => {
        if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            Notification.requestPermission();
        }
    }, []);

    // Show browser notification for new alerts
    useEffect(() => {
        if (alerts.length > 0 && Notification.permission === 'granted') {
            const newAlerts = alerts.filter(alert => !alert.read);

            if (newAlerts.length > 0) {
                // Show only the latest alert as notification
                const latestAlert = newAlerts[0];
                const notification = new Notification('Quality Control Alert', {
                    body: latestAlert.message,
                    icon: '/logo192.png', // Assuming you have this in your public folder
                });

                // When user clicks the notification, mark as read
                notification.onclick = () => {
                    markAsRead(latestAlert._id);
                    window.focus();
                    notification.close();
                };
            }
        }
    }, [alerts]);

    return (
        <AlertContext.Provider value={{
            alerts,
            unreadCount,
            loading,
            error,
            fetchAlerts,
            markAsRead,
            markAllAsRead
        }}>
            {children}
        </AlertContext.Provider>
    );
};

// Notification Bell Component
export const AlertBell = () => {
    const { unreadCount } = useAlerts();

    return (
        <div className="relative">
            <Bell size={22} aria-hidden="true" />
            {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
            )}
        </div>
    );
};

// Alert Dropdown Component
export const AlertDropdown = ({ onClose }) => {
    const { alerts, loading, markAsRead, markAllAsRead } = useAlerts();

    return (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50 overflow-hidden">
            <div className="p-3 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-medium text-gray-900">Notifications</h3>
                {alerts.some(alert => !alert.read) && (
                    <button
                        onClick={markAllAsRead}
                        className="text-xs text-blue-600 hover:text-blue-800"
                    >
                        Mark all as read
                    </button>
                )}
            </div>

            <div className="max-h-60 overflow-y-auto">
                {loading ? (
                    <div className="py-4 text-center text-gray-500">Loading notifications...</div>
                ) : alerts.length === 0 ? (
                    <div className="py-4 text-center text-gray-500">No new notifications</div>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {alerts.map(alert => (
                            <li
                                key={alert._id}
                                className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${!alert.read ? 'bg-blue-50' : ''}`}
                                onClick={() => markAsRead(alert._id)}
                            >
                                <div className="flex items-start">
                                    <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                                        alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                                            'bg-blue-100 text-blue-800'
                                        }`}>
                                        <Bell size={16} />
                                    </div>
                                    <div className="ml-3 flex-1">
                                        <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {new Date(alert.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="p-2 border-t border-gray-200 bg-gray-50">
                <a
                    href="/alert-notifications"
                    className="block w-full text-center text-sm text-blue-600 hover:text-blue-800"
                    onClick={() => onClose && onClose()}
                >
                    View all notifications
                </a>
            </div>
        </div>
    );
};