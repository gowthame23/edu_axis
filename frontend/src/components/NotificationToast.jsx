import React from 'react';
import { X } from 'lucide-react';

const NotificationToast = ({ notification, onClose }) => {
  if (!notification) return null;

  return (
    <div className="fixed top-20 right-4 z-50 animate-slide-in">
      <div className={`rounded-lg shadow-lg p-4 max-w-md ${
        notification.type === 'success' 
          ? 'bg-green-500 text-white' 
          : 'bg-red-500 text-white'
      }`}>
        <div className="flex items-center justify-between">
          <span className="font-medium">{notification.message}</span>
          <button
            onClick={onClose}
            className="ml-4 text-white hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationToast;
