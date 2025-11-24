import api from './api';

export const reportapi = {
  getAll: async (params = {}) => {
    const response = await api.get('/dev/profit-reports', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/dev/profit-reports/${id}`);
    return response.data;
  },

  generate: async (reportData) => {
    const response = await api.post('/dev/profit-reports/generate', reportData);
    return response.data;
  },

  generateDaily: async (date) => {
    const response = await api.post('/dev/profit-reports/generate/daily', { date });
    return response.data;
  },

  generateWeekly: async (weekData) => {
    const response = await api.post('/dev/profit-reports/generate/weekly', weekData);
    return response.data;
  },

  generateMonthly: async (monthData) => {
    const response = await api.post('/dev/profit-reports/generate/monthly', monthData);
    return response.data;
  },

  getSummary: async () => {
    const response = await api.get('/dev/profit-reports/summary/all');
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/dev/profit-reports/${id}`);
    return response.data;
  },
};

export const qrLogAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/dev/qr-logs', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/dev/qr-logs/${id}`);
    return response.data;
  },

  getByProduct: async (productId) => {
    const response = await api.get(`/dev/qr-logs/product/${productId}`);
    return response.data;
  },

  getStatistics: async () => {
    const response = await api.get('/dev/qr-logs/statistics/all');
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/dev/qr-logs/${id}`);
    return response.data;
  },
};