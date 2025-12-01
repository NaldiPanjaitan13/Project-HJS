import api from './api';

export const stocktransactionapi = {
  getAll: async (params = {}) => {
    const response = await api.get('/dev/stock-transactions', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/dev/stock-transactions/${id}`);
    return response.data;
  },

  create: async (transactionData) => {
    const response = await api.post('/dev/stock-transactions', transactionData);
    return response.data;
  },

  update: async (id, transactionData) => {
    const response = await api.put(`/dev/stock-transactions/${id}`, transactionData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/dev/stock-transactions/${id}`);
    return response.data;
  },

  getByProduct: async (productId) => {
    const response = await api.get(`/dev/stock-transactions/product/${productId}`);
    return response.data;
  },

  getKartuStok: async (productId) => {
    const response = await api.get(`/dev/stock-transactions/kartu-stok/${productId}`);
    return response.data;
  },

  getSummary: async (params = {}) => {
    const response = await api.get('/dev/stock-transactions/summary/all', { params });
    return response.data;
  }
};

export default stocktransactionapi;