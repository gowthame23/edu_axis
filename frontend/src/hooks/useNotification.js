import { useState, useEffect, useCallback } from 'react';

export const useNotification = (duration = 5000) => {
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [notification, duration]);

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
  }, []);

  const hideNotification = useCallback(() => {
    setNotification(null);
  }, []);

  return { notification, showNotification, hideNotification };
};
