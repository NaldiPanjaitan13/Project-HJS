import api from './api';

const cache = {
  data: new Map(),
  timestamps: new Map(),
  TTL: 2 * 60 * 1000, 

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

export const stockapi = {
  getAll: async (params = {}) => {
    const cacheKey = `transactions:all:${JSON.stringify(params)}`;
    
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const data = await dedupedRequest(cacheKey, async () => {
      const response = await api.get('/dev/stock-transactions', { params });
      return response.data;
    });

    cache.set(cacheKey, data);
    return data;
  },

  getById: async (id) => {
    const cacheKey = `transactions:${id}`;
    
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const data = await dedupedRequest(cacheKey, async () => {
      const response = await api.get(`/dev/stock-transactions/${id}`);
      return response.data;
    });

    cache.set(cacheKey, data);
    return data;
  },

  create: async (transactionData) => {
    const response = await api.post('/dev/stock-transactions', transactionData);
    
    cache.invalidate('transactions:');
    cache.invalidate('summary:');
    
    return response.data;
  },

  update: async (id, transactionData) => {
    const response = await api.put(`/dev/stock-transactions/${id}`, transactionData);
    
    cache.invalidate('transactions:');
    cache.invalidate('summary:');
    
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/dev/stock-transactions/${id}`);
    
    cache.invalidate('transactions:');
    cache.invalidate('summary:');
    
    return response.data;
  },

  getByProduct: async (productId) => {
    const cacheKey = `transactions:product:${productId}`;
    
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const data = await dedupedRequest(cacheKey, async () => {
      const response = await api.get(`/dev/stock-transactions/product/${productId}`);
      return response.data;
    });

    cache.set(cacheKey, data);
    return data;
  },

  getKartuStok: async (productId) => {
    const cacheKey = `transactions:kartu:${productId}`;
    
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const data = await dedupedRequest(cacheKey, async () => {
      const response = await api.get(`/dev/stock-transactions/kartu-stok/${productId}`);
      return response.data;
    });

    cache.set(cacheKey, data);
    return data;
  },

  getSummary: async (params = {}) => {
    const cacheKey = `summary:all:${JSON.stringify(params)}`;
    
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const data = await dedupedRequest(cacheKey, async () => {
      const response = await api.get('/dev/stock-transactions/summary/all', { params });
      return response.data;
    });

    cache.set(cacheKey, data);
    return data;
  },

  clearCache: () => {
    cache.invalidate('*');
  }
};