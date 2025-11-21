import React, { useState, useEffect } from 'react';
import { Search, Save, RotateCcw, Edit2, Trash2, Download, Package, QrCode } from 'lucide-react';
import { productapi } from '../../services/productapi';
import { stockapi } from '../../services/stockapi';

const BarangMasukAdmin = () => {
  const [formData, setFormData] = useState({
    tanggal_masuk: new Date().toISOString().split('T')[0],
    kode_barang: '',
    jumlah_masuk: ''
  });
  
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [searchTerm, transactions]);

  const fetchTransactions = async () => {
    try {
      const response = await stockapi.getAll();
      const allTransactions = response.data?.data || [];
      const masukTransactions = allTransactions.filter(t => t.jenis_transaksi === 'IN');
      
      setTransactions(masukTransactions);
      setFilteredTransactions(masukTransactions);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    }
  };

  const filterTransactions = () => {
    if (!searchTerm.trim()) {
      setFilteredTransactions(transactions);
      return;
    }

    const filtered = transactions.filter(t => 
      t.product?.kode_barang?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.product?.nama_barang?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.product?.jenis_barang?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredTransactions(filtered);
  };

  const handleCekBarang = async () => {
    if (!formData.kode_barang.trim()) {
      setError('Kode barang harus diisi!');
      return;
    }

    setError('');
    setSelectedProduct(null);
    setLoading(true);

    try {
      const response = await productapi.getAll();
      console.log('API Response:', response);
      
      let products = [];
      if (response.data?.data) {
        products = response.data.data; 
      } else if (response.data) {
        products = response.data; 
      } else if (Array.isArray(response)) {
        products = response;
      }

      const product = products.find(p => p.kode_barang === formData.kode_barang);
      
      if (product) {
        setSelectedProduct(product);
        setSuccess(`Produk ditemukan: ${product.nama_barang}`);
      } else {
        setError('Produk tidak ditemukan! Pastikan kode barang PERSIS sama (case-sensitive)');
      }
    } catch (err) {
      console.error('Error checking product:', err);
      setError(`Gagal memeriksa produk: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSimpan = async () => {
    setError('');
    setSuccess('');

    if (!formData.tanggal_masuk) {
      setError('Tanggal masuk harus diisi!');
      return;
    }

    if (!selectedProduct) {
      setError('Silakan cek barang terlebih dahulu!');
      return;
    }

    if (!formData.jumlah_masuk || formData.jumlah_masuk <= 0) {
      setError('Jumlah masuk harus lebih dari 0!');
      return;
    }

    try {
      setLoading(true);

      const dataToSubmit = {
        product_id: parseInt(selectedProduct.product_id),
        jenis_transaksi: 'IN', 
        jumlah: parseInt(formData.jumlah_masuk), 
        catatan: `Barang masuk - ${selectedProduct.nama_barang}`
      };

      console.log('Selected Product:', selectedProduct);
      console.log('Data to submit:', dataToSubmit);

      const response = await stockapi.create(dataToSubmit);
      
      console.log('Save response:', response);
      
      setSuccess('Transaksi barang masuk berhasil disimpan!');
      
      setTimeout(() => {
        handleReset();
        fetchTransactions();
      }, 1500);

    } catch (err) {
      console.error('Error saving transaction:', err);
      console.error('Error response:', err.response);
      console.error('Error response data:', err.response?.data);
      
      let errorMessage = 'Gagal menyimpan transaksi';
      
      if (err.response?.status === 422) {
        const validationErrors = err.response?.data?.errors || err.response?.data?.details || {};
        const errorMessages = Object.entries(validationErrors)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join(' | ');
        
        errorMessage = `Validasi gagal: ${errorMessages || err.response?.data?.message || 'Periksa data yang diinput'}`;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      tanggal_masuk: new Date().toISOString().split('T')[0],
      kode_barang: '',
      jumlah_masuk: ''
    });
    setSelectedProduct(null);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
      try {
        await stockapi.delete(id);
        setSuccess('Transaksi berhasil dihapus!');
        fetchTransactions();
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        console.error('Error deleting transaction:', error);
        setError(`Gagal menghapus transaksi: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Package className="w-8 h-8 text-blue-600" />
              Barang Masuk
            </h1>
            <p className="text-gray-600 mt-1">Form pencatatan barang masuk gudang</p>
          </div>
        </div>

        {/* Alert Messages */}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Tanggal Masuk */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tanggal Masuk <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.tanggal_masuk}
              onChange={(e) => setFormData({ ...formData, tanggal_masuk: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Kode Barang */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Kode Barang <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.kode_barang}
                onChange={(e) => setFormData({ ...formData, kode_barang: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && handleCekBarang()}
                placeholder="Masukkan kode barang (case-sensitive)"
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleCekBarang}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors font-medium whitespace-nowrap disabled:bg-gray-400"
              >
                <Search className="w-5 h-5" />
                Cek Barang
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              <strong>PENTING:</strong> Kode harus PERSIS sama (huruf besar/kecil & simbol berpengaruh)
            </p>
          </div>

          {/* Jumlah Masuk */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Jumlah Masuk <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.jumlah_masuk}
              onChange={(e) => setFormData({ ...formData, jumlah_masuk: e.target.value })}
              min="1"
              placeholder="0"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Product Info Card */}
        {selectedProduct && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-bold text-blue-900 text-lg mb-2">{selectedProduct.nama_barang}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Kode Barang:</p>
                    <p className="font-semibold text-gray-900">{selectedProduct.kode_barang}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Jenis:</p>
                    <p className="font-semibold text-gray-900">{selectedProduct.jenis_barang || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Satuan:</p>
                    <p className="font-semibold text-gray-900">{selectedProduct.satuan}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Stok Saat Ini:</p>
                    <p className="font-semibold text-blue-600 text-lg">{selectedProduct.stok || 0}</p>
                  </div>
                </div>
              </div>
              {selectedProduct.qr_code && (
                <div className="ml-4">
                  <QrCode className="w-16 h-16 text-blue-600" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSimpan}
            disabled={loading || !selectedProduct}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Menyimpan...' : 'Simpan'}
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-6 py-2.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-semibold"
          >
            <RotateCcw className="w-5 h-5" />
            Reset
          </button>
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Daftar Transaksi Barang Masuk</h2>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari kode atau nama barang..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
              <Download className="w-5 h-5" />
              Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold">Tanggal</th>
                <th className="text-left py-4 px-6 text-sm font-semibold">Kode Barang</th>
                <th className="text-left py-4 px-6 text-sm font-semibold">Nama Barang</th>
                <th className="text-left py-4 px-6 text-sm font-semibold">Jenis</th>
                <th className="text-left py-4 px-6 text-sm font-semibold">Satuan</th>
                <th className="text-center py-4 px-6 text-sm font-semibold">Jumlah</th>
                <th className="text-center py-4 px-6 text-sm font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-gray-500">
                    <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">Belum ada transaksi barang masuk</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => (
                  <tr 
                    key={transaction.transaction_id} 
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-6 text-sm text-gray-700">
                      {formatDate(transaction.created_at)}
                    </td>
                    <td className="py-4 px-6 text-sm font-medium text-gray-900">
                      {transaction.product?.kode_barang || '-'}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-700">
                      {transaction.product?.nama_barang || '-'}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-700">
                      {transaction.product?.jenis_barang || '-'}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-700">
                      {transaction.product?.satuan || '-'}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold text-sm">
                        +{transaction.jumlah}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(transaction.transaction_id)}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Menampilkan {filteredTransactions.length} transaksi
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BarangMasukAdmin;