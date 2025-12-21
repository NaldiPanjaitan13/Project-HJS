import api from './api';

const cache = {
  data: new Map(),
  timestamps: new Map(),
  TTL: 5 * 60 * 1000,

  set(key, value) {
    this.data.set(key, value);
    this.timestamps.set(key, Date.now());
  },

  get(key) {
    const timestamp = this.timestamps.get(key);
    if (!timestamp) return null;

    const age = Date.now() - timestamp;
    if (age > this.TTL) {
      this.data.delete(key);
      this.timestamps.delete(key);
      return null;
    }

    return this.data.get(key);
  },

  invalidate(pattern) {
    if (pattern === '*') {
      this.data.clear();
      this.timestamps.clear();
    } else {
      for (const key of this.data.keys()) {
        if (key.includes(pattern)) {
          this.data.delete(key);
          this.timestamps.delete(key);
        }
      }
    }
  }
};

const pendingRequests = new Map();

const dedupedRequest = async (key, requestFn) => {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }

  const promise = requestFn()
    .finally(() => {
      pendingRequests.delete(key);
    });

  pendingRequests.set(key, promise);
  return promise;
};

export const productapi = {
  getAll: async (params = {}) => {
    const cacheKey = `products:all:${JSON.stringify(params)}`;
    
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log('✅ Cache hit:', cacheKey);
      return cached;
    }

    const data = await dedupedRequest(cacheKey, async () => {
      const response = await api.get('/dev/products', { params });
      return response.data;
    });

    cache.set(cacheKey, data);
    return data;
  },

  getForDropdown: async (params = {}) => {
    const cacheKey = `products:dropdown:${JSON.stringify(params)}`;
    
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log('✅ Cache hit:', cacheKey);
      return cached;
    }

    const response = await dedupedRequest(cacheKey, async () => {
      return await api.get('/dev/products/dropdown/list', { params });
    });

    cache.set(cacheKey, response);
    return response;
  },
  
  getById: async (id) => {
    const cacheKey = `products:${id}`;
    
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log('✅ Cache hit:', cacheKey);
      return cached;
    }

    const data = await dedupedRequest(cacheKey, async () => {
      const response = await api.get(`/dev/products/${id}`);
      return response.data;
    });

    cache.set(cacheKey, data);
    return data;
  },

  create: async (productData) => {
    const response = await api.post('/dev/products', productData);
    
    cache.invalidate('products:');
    console.log('🗑️ Cache invalidated: products');
    
    return response.data;
  },

  update: async (id, productData) => {
    const response = await api.put(`/dev/products/${id}`, productData);
    
    cache.invalidate('products:');
    console.log('🗑️ Cache invalidated: products');
    
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/dev/products/${id}`);
    
    cache.invalidate('products:');
    console.log('🗑️ Cache invalidated: products');
    
    return response.data;
  },

  scanQr: async (qrData) => {
    const response = await api.post('/dev/products/scan-qr', qrData);
    return response.data;
  },

  clearCache: () => {
    cache.invalidate('*');
    console.log('🗑️ All cache cleared');
  }
};