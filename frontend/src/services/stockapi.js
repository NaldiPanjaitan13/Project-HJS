import api from './api';

export const stockapi = {
  // Get all stock transactions with filters
  getAll: async (params = {}) => {
    const response = await api.get('/dev/stock-transactions', { params });
    return response.data;
  },

  // Get single transaction by ID
  getById: async (id) => {
    const response = await api.get(`/dev/stock-transactions/${id}`);
    return response.data;
  },

  // Create new transaction
  create: async (transactionData) => {
    const response = await api.post('/dev/stock-transactions', transactionData);
    return response.data;
  },

  // Update transaction
  update: async (id, transactionData) => {
    const response = await api.put(`/dev/stock-transactions/${id}`, transactionData);
    return response.data;
  },

  // Delete transaction
  delete: async (id) => {
    const response = await api.delete(`/dev/stock-transactions/${id}`);
    return response.data;
  },

  // Get transactions by product
  getByProduct: async (productId) => {
    const response = await api.get(`/dev/stock-transactions/product/${productId}`);
    return response.data;
  },

  // Get summary
  getSummary: async (params = {}) => {
    const response = await api.get('/dev/stock-transactions/summary/all', { params });
    return response.data;
  }
};