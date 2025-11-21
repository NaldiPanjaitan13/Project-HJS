import React, { useState, useEffect } from 'react';
import { Search, Save, RotateCcw, Edit2, Trash2, Download, PackageMinus, QrCode, X } from 'lucide-react';
import { productapi } from '../../services/productapi';
import { stockapi } from '../../services/stockapi';

const BarangKeluarAdmin = () => {
  const [formData, setFormData] = useState({
    tanggal_keluar: new Date().toISOString().split('T')[0],
    kode_barang: '',
    jumlah_keluar: '',
    penanggung_jawab: ''
  });
  
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [searchTerm, transactions]);

  const fetchTransactions = async () => {
    try {
      const response = await stockapi.getAll({ jenis_transaksi: 'OUT' });
      const allTransactions = response.data?.data || [];
      const keluarTransactions = allTransactions.filter(t => t.jenis_transaksi === 'OUT');
      setTransactions(keluarTransactions);
      setFilteredTransactions(keluarTransactions);
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
      t.product?.jenis_barang?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.penanggung_jawab?.toLowerCase().includes(searchTerm.toLowerCase())
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

    if (!formData.tanggal_keluar) {
      setError('Tanggal keluar harus diisi!');
      return;
    }
    if (!selectedProduct) {
      setError('Silakan cek barang terlebih dahulu!');
      return;
    }
    if (!formData.jumlah_keluar || formData.jumlah_keluar <= 0) {
      setError('Jumlah keluar harus lebih dari 0!');
      return;
    }
    if (parseInt(formData.jumlah_keluar) > selectedProduct.stok) {
      setError(`Stok tidak mencukupi! Stok tersedia: ${selectedProduct.stok}`);
      return;
    }
    if (!formData.penanggung_jawab.trim()) {
      setError('Penanggung jawab harus diisi!');
      return;
    }

    try {
      setLoading(true);
      const dataToSubmit = {
        product_id: parseInt(selectedProduct.product_id),
        jenis_transaksi: 'OUT',
        jumlah: parseInt(formData.jumlah_keluar),
        catatan: `Barang keluar - ${selectedProduct.nama_barang}`,
        penanggung_jawab: formData.penanggung_jawab
      };

      console.log('Data to submit:', dataToSubmit);
      await stockapi.create(dataToSubmit);
      
      setSuccess('Transaksi barang keluar berhasil disimpan!');
      setTimeout(() => {
        handleReset();
        fetchTransactions();
      }, 1500);

    } catch (err) {
      console.error('Error saving transaction:', err);
      let errorMessage = 'Gagal menyimpan transaksi';
      if (err.response?.status === 422) {
        const validationErrors = err.response?.data?.errors || {};
        const errorMessages = Object.entries(validationErrors)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join(' | ');
        errorMessage = err.response?.data?.message || `Validasi gagal: ${errorMessages}`;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      tanggal_keluar: new Date().toISOString().split('T')[0],
      kode_barang: '',
      jumlah_keluar: '',
      penanggung_jawab: ''
    });
    setSelectedProduct(null);
    setError('');
    setSuccess('');
  };

  const handleEdit = (transaction) => {
    setEditData({
      transaction_id: transaction.transaction_id,
      jumlah: transaction.jumlah,
      penanggung_jawab: transaction.penanggung_jawab || '',
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
        penanggung_jawab: editData.penanggung_jawab,
        catatan: editData.catatan
      });
      setSuccess('Transaksi berhasil diupdate!');
      setShowEditModal(false);
      setEditData(null);
      fetchTransactions();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating transaction:', err);
      setError(`Gagal update transaksi: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus transaksi ini? Stok akan dikembalikan.')) {
      try {
        await stockapi.delete(id);
        setSuccess('Transaksi berhasil dihapus!');
        fetchTransactions();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        console.error('Error deleting transaction:', err);
        setError(`Gagal menghapus transaksi: ${err.response?.data?.message || err.message}`);
      }
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['Tanggal', 'Kode Barang', 'Nama Barang', 'Jenis', 'Satuan', 'Penanggung Jawab', 'Jumlah'],
      ...filteredTransactions.map(t => [
        formatDate(t.created_at),
        t.product?.kode_barang || '',
        t.product?.nama_barang || '',
        t.product?.jenis_barang || '',
        t.product?.satuan || '',
        t.penanggung_jawab || '',
        t.jumlah
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `barang_keluar_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <PackageMinus className="w-8 h-8 text-red-600" />
              Barang Keluar
            </h1>
            <p className="text-gray-600 mt-1">Form pencatatan barang keluar gudang</p>
          </div>
        </div>

        {/* Alert Messages */}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">{success}</div>
        )}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
        )}

        {/* Form Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tanggal Keluar <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.tanggal_keluar}
              onChange={(e) => setFormData({ ...formData, tanggal_keluar: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
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
                placeholder="Input barcode"
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
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
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Jumlah Keluar <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.jumlah_keluar}
              onChange={(e) => setFormData({ ...formData, jumlah_keluar: e.target.value })}
              min="1"
              max={selectedProduct?.stok || 999999}
              placeholder="0"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        {/* Form Row 2 - Penanggung Jawab */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Penanggung Jawab <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.penanggung_jawab}
              onChange={(e) => setFormData({ ...formData, penanggung_jawab: e.target.value })}
              placeholder="Nama penanggung jawab"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        {/* Product Info Card */}
        {selectedProduct && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-bold text-red-900 text-lg mb-2">{selectedProduct.nama_barang}</h3>
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
                    <p className="text-gray-600">Stok Tersedia:</p>
                    <p className={`font-semibold text-lg ${selectedProduct.stok > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedProduct.stok || 0}
                    </p>
                  </div>
                </div>
              </div>
              {selectedProduct.qr_code && (
                <div className="ml-4">
                  <QrCode className="w-16 h-16 text-red-600" />
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
        <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-gray-900">Daftar Transaksi Barang Keluar</h2>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari kode atau nama barang..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <Download className="w-5 h-5" />
              Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-red-600 text-white">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold">Tanggal</th>
                <th className="text-left py-4 px-6 text-sm font-semibold">Kode Barang</th>
                <th className="text-left py-4 px-6 text-sm font-semibold">Nama Barang</th>
                <th className="text-left py-4 px-6 text-sm font-semibold">Jenis</th>
                <th className="text-left py-4 px-6 text-sm font-semibold">Satuan</th>
                <th className="text-left py-4 px-6 text-sm font-semibold">Penanggung Jawab</th>
                <th className="text-center py-4 px-6 text-sm font-semibold">Jumlah</th>
                <th className="text-center py-4 px-6 text-sm font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-gray-500">
                    <PackageMinus className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">Belum ada transaksi barang keluar</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => (
                  <tr key={transaction.transaction_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6 text-sm text-gray-700">{formatDate(transaction.created_at)}</td>
                    <td className="py-4 px-6 text-sm font-medium text-gray-900">{transaction.product?.kode_barang || '-'}</td>
                    <td className="py-4 px-6 text-sm text-gray-700">{transaction.product?.nama_barang || '-'}</td>
                    <td className="py-4 px-6 text-sm text-gray-700">{transaction.product?.jenis_barang || '-'}</td>
                    <td className="py-4 px-6 text-sm text-gray-700">{transaction.product?.satuan || '-'}</td>
                    <td className="py-4 px-6 text-sm text-gray-700">{transaction.penanggung_jawab || '-'}</td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-block px-3 py-1 bg-red-100 text-red-700 rounded-full font-semibold text-sm">
                        -{transaction.jumlah}
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
            <p className="text-sm text-gray-600">Menampilkan {filteredTransactions.length} transaksi</p>
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
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Penanggung Jawab</label>
                <input
                  type="text"
                  value={editData.penanggung_jawab}
                  onChange={(e) => setEditData({ ...editData, penanggung_jawab: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Catatan</label>
                <textarea
                  value={editData.catatan}
                  onChange={(e) => setEditData({ ...editData, catatan: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
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

export default BarangKeluarAdmin;