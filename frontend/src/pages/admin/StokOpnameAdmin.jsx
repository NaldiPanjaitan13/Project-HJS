import React, { useState, useEffect, useRef } from 'react';
import { Search, Save, RotateCcw, ClipboardCheck, AlertCircle, Download, CheckCircle, XCircle, ChevronDown, X, PackageMinus, QrCode } from 'lucide-react';
import { productapi } from '../../services/productapi';
import { stockopnameapi } from '../../services/stockopnameapi';

const StokOpnameAdmin = () => {
  const [formData, setFormData] = useState({
    tanggal_opname: new Date().toISOString().split('T')[0],
    kode_barang: '',
    product_id: '',
    stok_fisik: '',
    nama_petugas: '',
    catatan: '',
    sesuaikan_stok: false
  });
  
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchProduct, setSearchProduct] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const dropdownRef = useRef(null);

  const [opnames, setOpnames] = useState([]);
  const [filteredOpnames, setFilteredOpnames] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchOpnames();
  }, []);

  useEffect(() => {
    filterOpnames();
  }, [searchTerm, statusFilter, opnames]);

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
    }
  };

  const fetchOpnames = async () => {
    try {
      const response = await stockopnameapi.getAll();
      const allOpnames = response.data?.data || [];
      setOpnames(allOpnames);
      setFilteredOpnames(allOpnames);
    } catch (err) {
      console.error('Error fetching opnames:', err);
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

  const filterOpnames = () => {
    let filtered = opnames;

    if (searchTerm.trim()) {
      filtered = filtered.filter(o => 
        o.product?.kode_barang?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.product?.nama_barang?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.nama_petugas?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(o => {
        if (statusFilter === 'disesuaikan') return o.status_penyesuaian === 'Disesuaikan';
        if (statusFilter === 'belum') return o.status_penyesuaian === 'Belum Disesuaikan';
        return true;
      });
    }

    setFilteredOpnames(filtered);
  };

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setFormData(prev => ({
        ...prev,
        product_id: product.product_id,
        kode_barang: product.kode_barang
    }));
    setSearchProduct(product.nama_barang);
    setShowDropdown(false);
    setSuccess(`Produk dipilih: ${product.nama_barang}`);
    setTimeout(() => setSuccess(''), 2000);
  };

  const handleClearSelection = () => {
    setSelectedProduct(null);
    setFormData(prev => ({ ...prev, product_id: '', kode_barang: '' }));
    setSearchProduct('');
  };

  const calculateSelisih = () => {
    if (!selectedProduct || formData.stok_fisik === '') return 0;
    return parseInt(formData.stok_fisik) - (selectedProduct.stok || 0);
  };

  const handleSimpan = async () => {
    setError('');
    setSuccess('');

    if (!formData.tanggal_opname) return setError('Tanggal opname harus diisi!');
    if (!selectedProduct) return setError('Silakan pilih produk terlebih dahulu!');
    if (formData.stok_fisik === '' || formData.stok_fisik < 0) return setError('Stok fisik harus diisi dengan nilai valid!');

    try {
      setLoading(true);
      const freshProductResponse = await productapi.getById(selectedProduct.product_id);
      const freshProduct = freshProductResponse.data || freshProductResponse;
      setSelectedProduct(freshProduct);
      
      const dataToSubmit = {
        product_id: parseInt(freshProduct.product_id),
        tanggal_opname: formData.tanggal_opname,
        stok_fisik: parseInt(formData.stok_fisik),
        nama_petugas: formData.nama_petugas || null,
        catatan: formData.catatan || null,
        sesuaikan_stok: formData.sesuaikan_stok
      };

      await stockopnameapi.create(dataToSubmit);
      
      const message = formData.sesuaikan_stok 
        ? 'Stok opname berhasil disimpan dan disesuaikan dengan sistem!' 
        : 'Stok opname berhasil disimpan!';
      
      setSuccess(message);
      
      setTimeout(() => {
        handleReset();
        fetchOpnames();
        fetchProducts();
      }, 1500);

    } catch (err) {
      console.error('Error saving opname:', err);
      let errorMessage = 'Gagal menyimpan stok opname';
      if (err.response?.status === 422) {
        const validationErrors = err.response?.data?.errors || {};
        const errorMessages = Object.entries(validationErrors)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join(' | ');
        errorMessage = `Validasi gagal: ${errorMessages}`;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustStock = async (opnameId) => {
    if (!window.confirm('Apakah Anda yakin ingin menyesuaikan stok dengan hasil opname ini?')) return;

    try {
      await stockopnameapi.adjustStock(opnameId);
      setSuccess('Stok berhasil disesuaikan!');
      fetchOpnames();
      fetchProducts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`Gagal menyesuaikan stok: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data opname ini?')) {
      try {
        await stockopnameapi.delete(id);
        setSuccess('Data opname berhasil dihapus!');
        fetchOpnames();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(`Gagal menghapus data: ${err.response?.data?.message || err.message}`);
      }
    }
  };

  const handleReset = () => {
    setFormData({
      tanggal_opname: new Date().toISOString().split('T')[0],
      kode_barang: '',
      product_id: '',
      stok_fisik: '',
      nama_petugas: '',
      catatan: '',
      sesuaikan_stok: false
    });
    setSelectedProduct(null);
    setSearchProduct('');
    setError('');
    setSuccess('');
  };

  const handleExport = () => {
    const csvContent = [
      ['Tanggal', 'Kode', 'Nama Barang', 'Sistem', 'Fisik', 'Selisih', 'Petugas', 'Status', 'Catatan'],
      ...filteredOpnames.map(o => [
        formatDate(o.tanggal_opname),
        o.product?.kode_barang || '',
        o.product?.nama_barang || '',
        o.stok_sistem,
        o.stok_fisik,
        o.selisih,
        o.nama_petugas || '',
        o.status_penyesuaian,
        o.catatan || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `stok_opname_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const selisih = calculateSelisih();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <ClipboardCheck className="w-8 h-8 text-purple-600" />
              Stok Opname
            </h1>
            <p className="text-gray-600 mt-1">Form pengecekan stok fisik gudang</p>
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

        {/* Form Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          
          {/* 1. Tanggal Opname */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tanggal Opname <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.tanggal_opname}
              onChange={(e) => setFormData({ ...formData, tanggal_opname: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                    className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-left bg-white hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-gray-500">Pilih produk...</span>
                  </button>
                  <ChevronDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="flex-1 px-4 py-2.5 border border-purple-300 bg-purple-50 rounded-lg">
                    <p className="font-semibold text-purple-900">{selectedProduct.nama_barang}</p>
                    <p className="text-xs text-purple-600">Kode: {selectedProduct.kode_barang}</p>
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
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
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
                          className="p-3 hover:bg-purple-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                        >
                          <p className="font-medium text-gray-900">{product.nama_barang}</p>
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>Kode: {product.kode_barang}</span>
                            <span className="text-purple-600 font-bold">
                              Stok Sistem: {product.stok}
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

          {/* 3. Nama Petugas */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nama Petugas
            </label>
            <input
              type="text"
              value={formData.nama_petugas}
              onChange={(e) => setFormData({ ...formData, nama_petugas: e.target.value })}
              placeholder="Nama petugas"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Product Info Card */}
        {selectedProduct && (
          <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h3 className="font-bold text-purple-900 text-lg mb-3">{selectedProduct.nama_barang}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
              <div>
                <p className="text-gray-600">Kode:</p>
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
                <div className="flex items-center gap-2">
                  <p className="text-gray-600">Stok di Sistem:</p>
                  <button
                    onClick={async () => {
                      const fresh = await productapi.getById(selectedProduct.product_id);
                      setSelectedProduct(fresh.data || fresh);
                      setSuccess('Stok diperbarui!');
                      setTimeout(() => setSuccess(''), 2000);
                    }}
                    className="text-blue-500 hover:text-blue-700"
                    title="Refresh stok terbaru"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
                <p className="font-semibold text-purple-600 text-lg">{selectedProduct.stok || 0}</p>
              </div>
            </div>
            {selectedProduct.qr_code && (
                <div className="mt-2">
                  <QrCode className="w-12 h-12 text-purple-600" />
                </div>
            )}

            {/* Stok Fisik Input & Selisih */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 mt-4 pt-4 border-t border-purple-200">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Stok Fisik (Hasil Hitung) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.stok_fisik}
                  onChange={(e) => setFormData({ ...formData, stok_fisik: e.target.value })}
                  min="0"
                  placeholder="0"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Selisih</label>
                <div className={`px-4 py-2.5 rounded-lg font-bold text-lg ${
                  selisih === 0 ? 'bg-gray-100 text-gray-700' :
                  selisih > 0 ? 'bg-green-100 text-green-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {selisih > 0 ? '+' : ''}{selisih}
                </div>
              </div>
            </div>

            {/* Catatan */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Catatan (Opsional)
              </label>
              <textarea
                value={formData.catatan}
                onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                placeholder="Catatan tambahan..."
                rows="3"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Checkbox Penyesuaian */}
            <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <input
                type="checkbox"
                id="sesuaikan"
                checked={formData.sesuaikan_stok}
                onChange={(e) => setFormData({ ...formData, sesuaikan_stok: e.target.checked })}
                className="mt-1 w-5 h-5 text-purple-600 focus:ring-purple-500 rounded"
              />
              <label htmlFor="sesuaikan" className="flex-1 cursor-pointer">
                <span className="font-semibold text-red-700">
                  Ya, sesuaikan stok di sistem dengan hasil hitung fisik.
                </span>
                <p className="text-sm text-gray-600 mt-1">
                  Jika dicentang, stok di sistem akan otomatis disesuaikan dengan stok fisik yang diinput.
                  Jika tidak, data hanya disimpan tanpa mengubah stok sistem.
                </p>
              </label>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSimpan}
            disabled={loading || !selectedProduct}
            className="flex items-center gap-2 px-6 py-2.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Menyimpan...' : 'Simpan Hasil'}
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-6 py-2.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-semibold"
          >
            <RotateCcw className="w-5 h-5" />
            Batal
          </button>
        </div>
      </div>

      {/* Riwayat Stok Opname */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-gray-900">Riwayat Stok Opname</h2>
            <div className="flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">Semua Status</option>
                <option value="disesuaikan">Disesuaikan</option>
                <option value="belum">Belum Disesuaikan</option>
              </select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari kode/nama..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-11 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-purple-600 text-white">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold">Tanggal</th>
                <th className="text-left py-4 px-6 text-sm font-semibold">Kode Barang</th>
                <th className="text-left py-4 px-6 text-sm font-semibold">Nama Barang</th>
                <th className="text-center py-4 px-6 text-sm font-semibold">Sistem</th>
                <th className="text-center py-4 px-6 text-sm font-semibold">Fisik</th>
                <th className="text-center py-4 px-6 text-sm font-semibold">Selisih</th>
                <th className="text-left py-4 px-6 text-sm font-semibold">Petugas</th>
                <th className="text-center py-4 px-6 text-sm font-semibold">Penyesuaian</th>
                <th className="text-center py-4 px-6 text-sm font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredOpnames.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-12 text-gray-500">
                    <ClipboardCheck className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">Belum ada data stok opname</p>
                  </td>
                </tr>
              ) : (
                filteredOpnames.map((opname) => (
                  <tr key={opname.opname_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6 text-sm text-gray-700">
                      {formatDate(opname.tanggal_opname)}
                    </td>
                    <td className="py-4 px-6 text-sm font-medium text-gray-900">
                      {opname.product?.kode_barang || '-'}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-700">
                      {opname.product?.nama_barang || '-'}
                    </td>
                    <td className="py-4 px-6 text-center text-sm font-semibold text-gray-900">
                      {opname.stok_sistem}
                    </td>
                    <td className="py-4 px-6 text-center text-sm font-semibold text-gray-900">
                      {opname.stok_fisik}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full font-semibold text-sm ${
                        opname.selisih === 0 ? 'bg-gray-100 text-gray-700' :
                        opname.selisih > 0 ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {opname.selisih > 0 ? '+' : ''}{opname.selisih}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-700">
                      {opname.nama_petugas || '-'}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {opname.status_penyesuaian === 'Disesuaikan' ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full font-semibold text-sm">
                          <CheckCircle className="w-4 h-4" />
                          Disesuaikan
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full font-semibold text-sm">
                          <AlertCircle className="w-4 h-4" />
                          Belum Disesuaikan
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        {opname.status_penyesuaian === 'Belum Disesuaikan' && (
                          <button
                            onClick={() => handleAdjustStock(opname.opname_id)}
                            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                            title="Sesuaikan Stok"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {opname.status_penyesuaian === 'Belum Disesuaikan' && (
                          <button
                            onClick={() => handleDelete(opname.opname_id)}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                            title="Hapus"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        {opname.status_penyesuaian === 'Disesuaikan' && (
                          <span className="text-xs text-gray-400">Sudah disesuaikan</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredOpnames.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Menampilkan {filteredOpnames.length} data opname
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StokOpnameAdmin;