import React, { useState, useEffect } from 'react';
import { 
  PackageMinus, X, AlertCircle, CheckCircle,
  Package, User, Hash
} from 'lucide-react';
import { productapi } from '../../services/productapi';
import { stockapi } from '../../services/stockapi';

const BarangKeluarUser = () => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState({
    product_id: '',
    jumlah: '',
    keterangan: '',
    penanggung_jawab: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [showAlert, setShowAlert] = useState({ show: false, type: '', message: '' });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productapi.getForDropdown({ only_available: true });
      setProducts(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      showAlertMessage('error', 'Gagal memuat data produk');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProduct = (productId) => {
    const product = products.find(p => p.product_id === parseInt(productId));
    setSelectedProduct(product || null);
    setFormData({ ...formData, product_id: productId });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const showAlertMessage = (type, message) => {
    setShowAlert({ show: true, type, message });
    setTimeout(() => setShowAlert({ show: false, type: '', message: '' }), 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedProduct) {
      showAlertMessage('error', 'Pilih produk terlebih dahulu');
      return;
    }

    if (!formData.jumlah || formData.jumlah <= 0) {
      showAlertMessage('error', 'Jumlah barang harus lebih dari 0');
      return;
    }

    if (parseInt(formData.jumlah) > selectedProduct.stok) {
      showAlertMessage('error', `Stok tidak mencukupi. Stok tersedia: ${selectedProduct.stok}`);
      return;
    }

    if (!formData.penanggung_jawab.trim()) {
      showAlertMessage('error', 'Penanggung jawab harus diisi');
      return;
    }

    try {
      setSubmitLoading(true);

      const payload = {
        product_id: formData.product_id,
        jenis_transaksi: 'OUT',
        jumlah: parseInt(formData.jumlah),
        keterangan: formData.keterangan || '',
        penanggung_jawab: formData.penanggung_jawab.trim()
      };

      await stockapi.create(payload);

      showAlertMessage('success', 'Barang keluar berhasil ditambahkan');
 
      setFormData({
        product_id: '',
        jumlah: '',
        keterangan: '',
        penanggung_jawab: ''
      });
      setSelectedProduct(null);
       
      fetchProducts();

    } catch (error) {
      console.error('Error submitting:', error);
      showAlertMessage('error', error.response?.data?.message || 'Gagal menambahkan barang keluar');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      product_id: '',
      jumlah: '',
      keterangan: '',
      penanggung_jawab: ''
    });
    setSelectedProduct(null);
  };

  return (
    <div className="space-y-6">
      {/* Alert */}
      {showAlert.show && (
        <div className={`rounded-xl p-4 border ${
          showAlert.type === 'success' 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-3">
            {showAlert.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <p className={`text-sm font-medium ${
              showAlert.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {showAlert.message}
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-800 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-xl">
            <PackageMinus className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-1">Barang Keluar</h1>
            <p className="text-red-100">Input transaksi barang keluar dari gudang</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Select Product Dropdown */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Pilih Produk <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
              <select
                value={formData.product_id}
                onChange={(e) => handleSelectProduct(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent appearance-none bg-white"
                disabled={loading}
              >
                <option value="">
                  {loading ? 'Memuat produk...' : 'Pilih produk'}
                </option>
                {products.map((product) => (
                  <option key={product.product_id} value={product.product_id}>
                    {product.kode_barang} - {product.nama_barang} (Stok: {product.stok})
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Selected Product Info */}
          {selectedProduct && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="bg-red-100 p-2 rounded-lg">
                    <Package className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{selectedProduct.nama_barang}</h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-sm">
                      <div className="text-gray-600">
                        <span className="font-medium">Kode:</span> {selectedProduct.kode_barang}
                      </div>
                      <div className="text-gray-600">
                        <span className="font-medium">Jenis:</span> {selectedProduct.jenis_barang || '-'}
                      </div>
                      <div className="text-gray-600">
                        <span className="font-medium">Satuan:</span> {selectedProduct.satuan}
                      </div>
                      <div className={`font-semibold ${
                        selectedProduct.stok > 10 ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        <span className="font-medium text-gray-600">Stok Tersedia:</span> {selectedProduct.stok}
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProduct(null);
                    setFormData({ ...formData, product_id: '' });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Jumlah */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Jumlah <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                name="jumlah"
                value={formData.jumlah}
                onChange={handleInputChange}
                min="1"
                max={selectedProduct?.stok || 999999}
                placeholder="Masukkan jumlah barang"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            {selectedProduct && (
              <p className="text-xs text-gray-500 mt-1">
                Maksimal: {selectedProduct.stok} {selectedProduct.satuan}
              </p>
            )}
          </div>

          {/* Penanggung Jawab */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Penanggung Jawab <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="penanggung_jawab"
                value={formData.penanggung_jawab}
                onChange={handleInputChange}
                placeholder="Nama penanggung jawab"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Keterangan */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Keterangan (Opsional)
            </label>
            <textarea
              name="keterangan"
              value={formData.keterangan}
              onChange={handleInputChange}
              rows="3"
              placeholder="Tambahkan keterangan jika diperlukan..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleReset}
              disabled={submitLoading}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={submitLoading || !selectedProduct}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <PackageMinus className="w-5 h-5" />
                  <span>Tambah Barang Keluar</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BarangKeluarUser;