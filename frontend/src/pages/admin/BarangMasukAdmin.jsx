import React, { useState, useEffect, useRef } from 'react';
import { Search, Save, RotateCcw, Edit2, Trash2, Download, Package, QrCode, ChevronDown, X, PackageMinus, CheckCircle2, AlertCircle } from 'lucide-react';
import { productapi } from '../../services/productapi';
import { stockapi } from '../../services/stockapi';
import * as XLSX from 'xlsx';

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
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState(null);
  
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    perPage: 10
  });

  useEffect(() => {
    fetchInitialData();
  }, [pagination.currentPage]);

  const fetchInitialData = async () => {
    try {
      setInitialLoading(true);
      setError('');
      
      const productsResponse = await productapi.getForDropdown();
      
      let allProducts = [];
      if (productsResponse?.data?.data && Array.isArray(productsResponse.data.data)) {
        allProducts = productsResponse.data.data;
      } else if (productsResponse?.data && Array.isArray(productsResponse.data)) {
        allProducts = productsResponse.data;
      }
      
      setProducts(allProducts);
      setFilteredProducts(allProducts);

      const transactionsResponse = await stockapi.getAll({ 
        jenis_transaksi: 'IN',
        page: pagination.currentPage,
        limit: pagination.perPage
      });

      const responseData = transactionsResponse.data;
      const transactionsData = responseData?.data || [];
      const paginationInfo = responseData?.pagination || {};
      
      const enrichedTransactions = transactionsData.map(transaction => {
        const fullProduct = allProducts.find(p => p.product_id === transaction.product_id);
        if (fullProduct) {
          return {
            ...transaction,
            product: {
              ...transaction.product,
              kode_barang: fullProduct.kode_barang || transaction.product?.kode_barang,
              nama_barang: fullProduct.nama_barang || transaction.product?.nama_barang,
              jenis_barang: fullProduct.jenis_barang || transaction.product?.jenis_barang || '-',
              satuan: fullProduct.satuan || transaction.product?.satuan || '-',
              stok: fullProduct.stok || transaction.product?.stok || 0
            }
          };
        }
        return transaction;
      });
      
      setTransactions(enrichedTransactions);
      setFilteredTransactions(enrichedTransactions);

      setPagination(prev => ({
        ...prev,
        totalPages: paginationInfo.total_pages || Math.ceil((paginationInfo.total || enrichedTransactions.length) / prev.perPage),
        totalItems: paginationInfo.total || enrichedTransactions.length
      }));

    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat data. Silakan refresh halaman.');
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
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
  }, [searchProduct, products]);

  useEffect(() => {
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
  }, [searchTerm, transactions]);

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

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setFormData({ ...formData, product_id: product.product_id });
    setSearchProduct(product.nama_barang);
    setShowDropdown(false);
    setSuccess(`✓ Produk dipilih: ${product.nama_barang}`);
    setTimeout(() => setSuccess(''), 2000);
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
      
      setSuccess('✓ Transaksi barang masuk berhasil disimpan!');
      
      setTimeout(() => {
        handleReset();
        setPagination(prev => ({ ...prev, currentPage: 1 }));
        fetchInitialData();
      }, 1500);

    } catch (err) {
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
        setSuccess('✓ Transaksi berhasil dihapus!');
        fetchInitialData();
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
      catatan: transaction.catatan || '',
      product_name: transaction.product?.nama_barang || ''
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
      setSuccess('✓ Transaksi berhasil diupdate!');
      setShowEditModal(false);
      setEditData(null);
      fetchInitialData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal update transaksi');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    try {
      const exportData = filteredTransactions.map((transaction, index) => ({
        'No': index + 1,
        'Tanggal': formatDate(transaction.created_at),
        'Kode Barang': transaction.product?.kode_barang || '-',
        'Nama Barang': transaction.product?.nama_barang || '-',
        'Jenis Barang': transaction.product?.jenis_barang || '-',
        'Satuan': transaction.product?.satuan || '-',
        'Jumlah Masuk': transaction.jumlah || 0,
        'Catatan': transaction.catatan || '-'
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      ws['!cols'] = [
        { wch: 5 }, { wch: 12 }, { wch: 15 }, { wch: 30 },
        { wch: 15 }, { wch: 10 }, { wch: 12 }, { wch: 30 }
      ];

      const range = XLSX.utils.decode_range(ws['!ref']);
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[cellAddress]) continue;
          
          if (R === 0) {
            ws[cellAddress].s = {
              font: { bold: true, color: { rgb: "FFFFFF" } },
              fill: { fgColor: { rgb: "000000" } },
              alignment: { horizontal: "center", vertical: "center" },
              border: {
                top: { style: "thin", color: { rgb: "000000" } },
                bottom: { style: "thin", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } }
              }
            };
          } else {
            ws[cellAddress].s = {
              alignment: { horizontal: C === 0 || C === 6 ? "center" : "left", vertical: "center" },
              border: {
                top: { style: "thin", color: { rgb: "CCCCCC" } },
                bottom: { style: "thin", color: { rgb: "CCCCCC" } },
                left: { style: "thin", color: { rgb: "CCCCCC" } },
                right: { style: "thin", color: { rgb: "CCCCCC" } }
              },
              fill: { fgColor: { rgb: R % 2 === 0 ? "F9FAFB" : "FFFFFF" } }
            };
          }
        }
      }

      XLSX.utils.book_append_sheet(wb, ws, "Barang Masuk");
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      XLSX.writeFile(wb, `Barang_Masuk_${timestamp}.xlsx`);
      
      setSuccess('✓ Data berhasil di-export!');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Gagal export data');
      setTimeout(() => setError(''), 3000);
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

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-3 animate-pulse">
            <CheckCircle2 className="w-5 h-5" />
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
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
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
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
                    className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-left bg-white hover:bg-gray-50 transition-all"
                  >
                    <span className="text-gray-500">Pilih produk...</span>
                  </button>
                  <ChevronDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                </div>
              ) : (
                <div className="flex gap-2 animate-in fade-in duration-300">
                  <div className="flex-1 px-4 py-2.5 border-2 border-blue-400 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg shadow-sm">
                    <p className="font-semibold text-blue-900">{selectedProduct.nama_barang}</p>
                    <p className="text-xs text-blue-600">Kode: {selectedProduct.kode_barang} • Stok: {selectedProduct.stok}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all hover:scale-105"
                    title="Hapus pilihan"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Dropdown Content */}
              {showDropdown && !selectedProduct && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl overflow-hidden animate-in slide-in-from-top-2 duration-200">
                  {/* Search Box */}
                  <div className="p-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-500" />
                      <input
                        type="text"
                        value={searchProduct}
                        onChange={(e) => setSearchProduct(e.target.value)}
                        placeholder="Cari nama atau kode barang..."
                        className="w-full pl-10 pr-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* List Item */}
                  <div className="max-h-80 overflow-y-auto custom-scrollbar">
                    {filteredProducts.length === 0 ? (
                      <div className="p-6 text-center text-gray-500">
                        <PackageMinus className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm font-medium">Tidak ada produk ditemukan</p>
                        <p className="text-xs text-gray-400 mt-1">Coba gunakan kata kunci yang berbeda</p>
                      </div>
                    ) : (
                      <>
                        <div className="sticky top-0 bg-gray-50 px-3 py-2 border-b border-gray-200 text-xs text-gray-600 font-medium">
                          {filteredProducts.length} produk ditemukan
                        </div>
                        {filteredProducts.map((product) => (
                          <div
                            key={product.product_id}
                            onClick={() => handleSelectProduct(product)}
                            className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-all hover:pl-5"
                          >
                            <p className="font-medium text-gray-900">{product.nama_barang}</p>
                            <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                              <span>Kode: {product.kode_barang}</span>
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-bold">
                                Stok: {product.stok}
                              </span>
                            </div>
                            {product.jenis_barang && (
                              <p className="text-xs text-gray-400 mt-1">Jenis: {product.jenis_barang}</p>
                            )}
                          </div>
                        ))}
                      </>
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
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Product Info Card */}
        {selectedProduct && (
          <div className="mb-4 p-5 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl shadow-md animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-bold text-blue-900 text-lg mb-3 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  {selectedProduct.nama_barang}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-gray-600 text-xs mb-1">Kode Barang</p>
                    <p className="font-semibold text-gray-900">{selectedProduct.kode_barang}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-gray-600 text-xs mb-1">Stok Saat Ini</p>
                    <p className="font-bold text-blue-600 text-lg">{selectedProduct.stok || 0}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-gray-600 text-xs mb-1">Satuan</p>
                    <p className="font-semibold text-gray-900">{selectedProduct.satuan || '-'}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-gray-600 text-xs mb-1">Jenis</p>
                    <p className="font-semibold text-gray-900">
                      {selectedProduct.jenis_barang || <span className="text-gray-400 italic">Belum diisi</span>}
                    </p>
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
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:scale-105 transform"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Menyimpan...' : 'Simpan'}
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all font-semibold shadow-md hover:shadow-lg"
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
                className="pl-11 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            <button 
              onClick={handleExport}
              disabled={filteredTransactions.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium shadow-md hover:shadow-lg"
              >
              <Download className="w-5 h-5" />
              Export Excel
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
                    className="border-b border-gray-100 hover:bg-blue-50 transition-colors"
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
                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all hover:scale-110"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(transaction.transaction_id)}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all hover:scale-110"
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
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Menampilkan {filteredTransactions.length} dari {pagination.totalItems} transaksi
                {pagination.totalPages > 1 && ` (Halaman ${pagination.currentPage} dari ${pagination.totalPages})`}
              </p>
              
              {/* Pagination Controls */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                    disabled={pagination.currentPage === 1}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    ← Prev
                  </button>
                  
                  {/* Page Numbers */}
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.currentPage >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = pagination.currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPagination(prev => ({ ...prev, currentPage: pageNum }))}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            pagination.currentPage === pageNum
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'border border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-600" />
                Edit Transaksi
              </h3>
              <button 
                onClick={() => setShowEditModal(false)} 
                className="p-2 hover:bg-gray-100 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700 font-medium">{editData.product_name}</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Jumlah</label>
                <input
                  type="number"
                  value={editData.jumlah}
                  onChange={(e) => setEditData({ ...editData, jumlah: e.target.value })}
                  min="1"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Catatan</label>
                <textarea
                  value={editData.catatan}
                  onChange={(e) => setEditData({ ...editData, catatan: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleUpdateTransaction}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:bg-gray-300 transition-all shadow-md hover:shadow-lg"
              >
                {loading ? 'Menyimpan...' : 'Simpan'}
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition-all"
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