"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";

type NotificationType = "success" | "error" | "warning" | "info";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  linkText?: string;
}

interface NotificationContextType {
  showSuccess: (
    title: string,
    message: string,
    link?: string,
    linkText?: string
  ) => void;
  showError: (title: string, message: string) => void;
  showWarning: (title: string, message: string) => void;
  showInfo: (title: string, message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback(
    (
      type: NotificationType,
      title: string,
      message: string,
      link?: string,
      linkText?: string
    ) => {
      const id = Math.random().toString(36).substring(7);
      const notification: Notification = {
        id,
        type,
        title,
        message,
        link,
        linkText,
      };

      setNotifications((prev) => [...prev, notification]);

      // Auto-remove after 5 seconds
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 5000);
    },
    []
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const showSuccess = useCallback(
    (title: string, message: string, link?: string, linkText?: string) => {
      addNotification("success", title, message, link, linkText);
    },
    [addNotification]
  );

  const showError = useCallback(
    (title: string, message: string) => {
      addNotification("error", title, message);
    },
    [addNotification]
  );

  const showWarning = useCallback(
    (title: string, message: string) => {
      addNotification("warning", title, message);
    },
    [addNotification]
  );

  const showInfo = useCallback(
    (title: string, message: string) => {
      addNotification("info", title, message);
    },
    [addNotification]
  );

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case "error":
        return <XCircle className="w-5 h-5 text-red-400" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case "info":
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getStyles = (type: NotificationType) => {
    switch (type) {
      case "success":
        return "bg-green-900/90 border-green-500/50";
      case "error":
        return "bg-red-900/90 border-red-500/50";
      case "warning":
        return "bg-yellow-900/90 border-yellow-500/50";
      case "info":
        return "bg-blue-900/90 border-blue-500/50";
    }
  };

  return (
    <NotificationContext.Provider
      value={{ showSuccess, showError, showWarning, showInfo }}
    >
      {children}

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`${getStyles(
              notification.type
            )} border backdrop-blur-sm rounded-lg p-4 shadow-lg animate-slide-in-right flex items-start space-x-3`}
          >
            {getIcon(notification.type)}
            <div className="flex-1">
              <h4 className="font-semibold text-white mb-1">
                {notification.title}
              </h4>
              <p className="text-sm text-gray-300">{notification.message}</p>
              {notification.link && (
                <a
                  href={notification.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#00ff9d] hover:text-[#00cc7d] underline mt-1 inline-block"
                >
                  {notification.linkText || "View Transaction"}
                </a>
              )}
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
}
