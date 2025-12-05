import React, { useState, useEffect, useRef } from 'react';
import { Search, Save, RotateCcw, Edit2, Trash2, Download, Package, QrCode, ChevronDown, X, PackageMinus } from 'lucide-react';
import { productapi } from '../../services/productapi';
import { stockapi } from '../../services/stockapi';

const BarangMasukAdmin = () => {
  const [formData, setFormData] = useState({
    tanggal_masuk: new Date().toISOString().split('T')[0],
    product_id: '',
    jumlah_masuk: ''
  });
  
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchProduct, setSearchProduct] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const dropdownRef = useRef(null);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchTransactions();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [searchTerm, transactions]);

  useEffect(() => {
    filterProductDropdown();
  }, [searchProduct, products]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
        if (!selectedProduct) {
            setSearchProduct('');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedProduct]);

  const fetchProducts = async () => {
    try {
      const response = await productapi.getForDropdown();
      let productList = [];
      
      if (response.data?.data) {
        productList = response.data.data;
      } else if (response.data) {
        productList = response.data;
      } else if (Array.isArray(response)) {
        productList = response;
      }
      
      setProducts(productList);
      setFilteredProducts(productList);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Gagal memuat daftar produk');
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await stockapi.getAll({ jenis_transaksi: 'IN' });
      const allTransactions = response.data?.data || [];
      const masukTransactions = allTransactions.filter(t => t.jenis_transaksi === 'IN');
      setTransactions(masukTransactions);
      setFilteredTransactions(masukTransactions);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    }
  };

  const filterProductDropdown = () => {
    if (!searchProduct.trim()) {
      setFilteredProducts(products);
      return;
    }

    const filtered = products.filter(p =>
      p.nama_barang?.toLowerCase().includes(searchProduct.toLowerCase()) ||
      p.kode_barang?.toLowerCase().includes(searchProduct.toLowerCase()) ||
      p.jenis_barang?.toLowerCase().includes(searchProduct.toLowerCase())
    );
    setFilteredProducts(filtered);
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

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setFormData({ ...formData, product_id: product.product_id });
    setSearchProduct(product.nama_barang); 
    setShowDropdown(false);
    setSuccess(`Produk dipilih: ${product.nama_barang}`);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleClearSelection = () => {
    setSelectedProduct(null);
    setFormData({ ...formData, product_id: '' });
    setSearchProduct('');
  };

  const handleSimpan = async () => {
    setError('');
    setSuccess('');

    if (!formData.tanggal_masuk) return setError('Tanggal masuk harus diisi!');
    if (!selectedProduct) return setError('Silakan pilih produk terlebih dahulu!');
    if (!formData.jumlah_masuk || formData.jumlah_masuk <= 0) return setError('Jumlah masuk harus lebih dari 0!');

    try {
      setLoading(true);

      const dataToSubmit = {
        product_id: parseInt(selectedProduct.product_id),
        jenis_transaksi: 'IN', 
        jumlah: parseInt(formData.jumlah_masuk), 
        catatan: `Barang masuk - ${selectedProduct.nama_barang}`
      };

      await stockapi.create(dataToSubmit);
      
      setSuccess('Transaksi barang masuk berhasil disimpan!');
      
      setTimeout(() => {
        handleReset();
        fetchTransactions();
        fetchProducts(); 
      }, 1500);

    } catch (err) {
      console.error('Error saving transaction:', err);
      setError(err.response?.data?.message || 'Gagal menyimpan transaksi');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      tanggal_masuk: new Date().toISOString().split('T')[0],
      product_id: '',
      jumlah_masuk: ''
    });
    setSelectedProduct(null);
    setSearchProduct('');
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
      try {
        await stockapi.delete(id);
        setSuccess('Transaksi berhasil dihapus!');
        fetchTransactions();
        fetchProducts();
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        setError(`Gagal menghapus transaksi: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  const handleEdit = (transaction) => {
    setEditData({
      transaction_id: transaction.transaction_id,
      jumlah: transaction.jumlah,
      catatan: transaction.catatan || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateTransaction = async () => {
    if (!editData) return;
    try {
      setLoading(true);
      await stockapi.update(editData.transaction_id, {
        jumlah: parseInt(editData.jumlah),
        catatan: editData.catatan
      });
      setSuccess('Transaksi berhasil diupdate!');
      setShowEditModal(false);
      setEditData(null);
      fetchTransactions();
      fetchProducts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal update transaksi');
    } finally {
      setLoading(false);
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
          {/* 1. Tanggal Masuk */}
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

          {/* 2. Pilih Barang (Dropdown Search) */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Pilih Barang <span className="text-red-500">*</span>
            </label>
            
            <div className="relative">
              {!selectedProduct ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-left bg-white hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-gray-500">Pilih produk...</span>
                  </button>
                  <ChevronDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="flex-1 px-4 py-2.5 border border-blue-300 bg-blue-50 rounded-lg">
                    <p className="font-semibold text-blue-900">{selectedProduct.nama_barang}</p>
                    <p className="text-xs text-blue-600">Kode: {selectedProduct.kode_barang}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                    title="Hapus pilihan"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Dropdown Content Absolute */}
              {showDropdown && !selectedProduct && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden">
                  {/* Search Box */}
                  <div className="p-3 border-b border-gray-200 bg-gray-50">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={searchProduct}
                        onChange={(e) => setSearchProduct(e.target.value)}
                        placeholder="Cari nama atau kode barang..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* List Item */}
                  <div className="max-h-64 overflow-y-auto">
                    {filteredProducts.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        <PackageMinus className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">Tidak ada produk ditemukan</p>
                      </div>
                    ) : (
                      filteredProducts.map((product) => (
                        <div
                          key={product.product_id}
                          onClick={() => handleSelectProduct(product)}
                          className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                        >
                          <p className="font-medium text-gray-900">{product.nama_barang}</p>
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>Kode: {product.kode_barang}</span>
                            <span className="text-blue-600 font-bold">
                              Stok: {product.stok}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3. Jumlah Masuk */}
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
                    <p className="text-gray-600">Stok Saat Ini:</p>
                    <p className="font-semibold text-blue-600 text-lg">{selectedProduct.stok || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Satuan:</p>
                    <p className="font-semibold text-gray-900">{selectedProduct.satuan || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Jenis:</p>
                    <p className="font-semibold text-gray-900">{selectedProduct.jenis_barang || '-'}</p>
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
                          onClick={() => handleEdit(transaction)}
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

      {/* Edit Modal */}
      {showEditModal && editData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Edit Transaksi</h3>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Jumlah</label>
                <input
                  type="number"
                  value={editData.jumlah}
                  onChange={(e) => setEditData({ ...editData, jumlah: e.target.value })}
                  min="1"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Catatan</label>
                <textarea
                  value={editData.catatan}
                  onChange={(e) => setEditData({ ...editData, catatan: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleUpdateTransaction}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:bg-gray-300"
              >
                {loading ? 'Menyimpan...' : 'Simpan'}
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BarangMasukAdmin;