import { useState, useCallback } from 'react';
import { studentAPI } from '../services/api';

export const useStudentData = (user, showNotification) => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState({});

  const getStudentId = useCallback(() => {
    return user?._id || user?.id || user?.studentId;
  }, [user]);

  const fetchData = useCallback(async (key, apiMethod, errorMessage) => {
    try {
      setLoading(prev => ({ ...prev, [key]: true }));
      const studentId = getStudentId();
      const response = await apiMethod(studentId);
      
      if (response.data.success) {
        setData(prev => ({ ...prev, [key]: response.data[key] }));
        return response.data[key];
      }
    } catch (error) {
      console.error(`Error fetching ${key}:`, error);
      showNotification?.(errorMessage || `Failed to load ${key}`, 'error');
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  }, [getStudentId, showNotification]);

  return { data, loading, fetchData, getStudentId };
};
