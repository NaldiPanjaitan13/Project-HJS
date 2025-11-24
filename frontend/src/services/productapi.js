import api from './api';

export const productapi = {
  getAll: async (params = {}) => {
    const response = await api.get('/dev/products', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/dev/products/${id}`);
    return response.data;
  },

  create: async (productData) => {
    const response = await api.post('/dev/products', productData);
    return response.data;
  },

  update: async (id, productData) => {
    const response = await api.put(`/dev/products/${id}`, productData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/dev/products/${id}`);
    return response.data;
  },

  scanQr: async (qrData) => {
    const response = await api.post('/dev/products/scan-qr', qrData);
    return response.data;
  },
};