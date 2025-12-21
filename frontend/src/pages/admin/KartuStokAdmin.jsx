import React, { useState, useEffect, useRef } from 'react';
import { Eye, Printer, FileText, Download, Search, ChevronDown, X, PackageMinus } from 'lucide-react';
import { productapi } from '../../services/productapi';
import { stocktransactionapi } from '../../services/stocktransactionapi';
import * as XLSX from 'xlsx';

const KartuStokAdmin = () => {
  const [filters, setFilters] = useState({
    product_id: '',
    tanggal_mulai: '',
    tanggal_selesai: ''
  });

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchProduct, setSearchProduct] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stokAwal, setStokAwal] = useState(0);

  useEffect(() => {
    fetchProducts();
    
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    
    setFilters(prev => ({
      ...prev,
      tanggal_mulai: lastWeek.toISOString().split('T')[0],
      tanggal_selesai: today.toISOString().split('T')[0]
    }));
  }, []);

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

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setFilters(prev => ({ ...prev, product_id: product.product_id }));
    setSearchProduct(product.nama_barang);
    setShowDropdown(false);
  };

  const handleClearSelection = () => {
    setSelectedProduct(null);
    setFilters(prev => ({ ...prev, product_id: '' }));
    setSearchProduct('');
    setTransactions([]);
    setStokAwal(0);
  };

  const handleTampilkan = async () => {
    if (!selectedProduct) {
      setError('Silakan pilih produk terlebih dahulu!');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (!filters.tanggal_mulai || !filters.tanggal_selesai) {
      setError('Tanggal mulai dan selesai harus diisi!');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setError('');
    setLoading(true);

    try {
      const kartuStokResponse = await stocktransactionapi.getKartuStok(selectedProduct.product_id);
      
      const allTransactions = kartuStokResponse.data?.transactions || 
                             kartuStokResponse.transactions || [];

      const startDate = new Date(filters.tanggal_mulai);
      const endDate = new Date(filters.tanggal_selesai);
      endDate.setHours(23, 59, 59, 999); 

      const transactionsBeforePeriod = [];
      const transactionsInPeriod = [];

      allTransactions.forEach(t => {
        const transDate = new Date(t.created_at);
        if (transDate < startDate) {
          transactionsBeforePeriod.push(t);
        } else if (transDate >= startDate && transDate <= endDate) {
          transactionsInPeriod.push(t);
        }
      });

      let calculatedStokAwal = 0;
      transactionsBeforePeriod.forEach(t => {
        if (t.jenis_transaksi === 'IN') {
          calculatedStokAwal += parseInt(t.jumlah);
        } else if (t.jenis_transaksi === 'OUT') {
          calculatedStokAwal -= parseInt(t.jumlah);
        } else if (t.jenis_transaksi === 'ADJUST') {
          calculatedStokAwal = parseInt(t.jumlah);
        }
      });

      setStokAwal(calculatedStokAwal);

      const sortedTransactions = transactionsInPeriod.sort((a, b) => 
        new Date(a.created_at) - new Date(b.created_at)
      );
      
      let runningBalance = calculatedStokAwal;
      const transactionsWithBalance = sortedTransactions.map(t => {
        let masuk = 0;
        let keluar = 0;

        if (t.jenis_transaksi === 'IN') {
          masuk = parseInt(t.jumlah);
          runningBalance += masuk;
        } else if (t.jenis_transaksi === 'OUT') {
          keluar = parseInt(t.jumlah);
          runningBalance -= keluar;
        } else if (t.jenis_transaksi === 'ADJUST') {
          const oldBalance = runningBalance;
          const newBalance = parseInt(t.jumlah);
          const diff = newBalance - oldBalance;
          
          if (diff > 0) {
            masuk = diff;
          } else if (diff < 0) {
            keluar = Math.abs(diff);
          }
          runningBalance = newBalance;
        }

        return {
          ...t,
          masuk,
          keluar,
          sisa_stok: runningBalance
        };
      });

      setTransactions(transactionsWithBalance);

    } catch (err) {
      console.error('Error fetching kartu stok:', err);
      setError('Gagal memuat data kartu stok: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    try {
      const exportData = [
        {
          'Tanggal': 'STOK AWAL',
          'Keterangan': 'Stok Awal Periode',
          'Masuk': '',
          'Keluar': '',
          'Sisa Stok': stokAwal
        },
        ...transactions.map((transaction) => ({
          'Tanggal': formatDate(transaction.created_at),
          'Keterangan': getKeterangan(transaction),
          'Masuk': transaction.masuk > 0 ? transaction.masuk : '',
          'Keluar': transaction.keluar > 0 ? transaction.keluar : '',
          'Sisa Stok': transaction.sisa_stok
        }))
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      ws['!cols'] = [
        { wch: 12 },
        { wch: 40 },
        { wch: 10 },
        { wch: 10 },
        { wch: 12 }
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
          } else if (R === 1) {
            ws[cellAddress].s = {
              font: { bold: true },
              fill: { fgColor: { rgb: "E0E0E0" } },
              alignment: { horizontal: C === 4 ? "center" : "left", vertical: "center" },
              border: {
                top: { style: "medium", color: { rgb: "000000" } },
                bottom: { style: "medium", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "CCCCCC" } },
                right: { style: "thin", color: { rgb: "CCCCCC" } }
              }
            };
          } else {
            ws[cellAddress].s = {
              alignment: { 
                horizontal: C === 2 || C === 3 || C === 4 ? "center" : "left",
                vertical: "center" 
              },
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

      XLSX.utils.book_append_sheet(wb, ws, "Kartu Stok");
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `Kartu_Stok_${selectedProduct.kode_barang}_${timestamp}.xlsx`;
      XLSX.writeFile(wb, filename);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error exporting:', err);
      setError('Gagal export data');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleCetak = () => {
    window.print();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateLong = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getKeterangan = (transaction) => {
    let keterangan = '';
    
    if (transaction.jenis_transaksi === 'IN') {
      keterangan = 'Barang Masuk';
    } else if (transaction.jenis_transaksi === 'OUT') {
      keterangan = 'Barang Keluar';
    } else if (transaction.jenis_transaksi === 'ADJUST') {
      keterangan = 'Penyesuaian Stok';
    }
    
    if (transaction.catatan) {
      keterangan += ' - ' + transaction.catatan;
    }
    
    if (transaction.penanggung_jawab) {
      keterangan += ' (' + transaction.penanggung_jawab + ')';
    }
    
    return keterangan || '-';
  };

  return (
    <>
      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 30px;
          }
          .no-print {
            display: none !important;
          }
          
          .print-area {
            background: white !important;
            color: black !important;
          }
          
          .print-header {
            text-align: center;
            margin-bottom: 25px;
            border-bottom: 3px solid black;
            padding-bottom: 15px;
          }
          
          .print-header h1 {
            font-size: 28px;
            font-weight: bold;
            margin: 0 0 5px 0;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          
          .print-header p {
            font-size: 12px;
            margin: 0;
            color: #666;
          }
          
          .print-product-info {
            background: #f8f9fa !important;
            border: 2px solid #000 !important;
            padding: 20px !important;
            margin-bottom: 20px !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .print-product-info h2 {
            font-size: 20px;
            margin: 0 0 15px 0;
            padding-bottom: 10px;
            border-bottom: 2px solid #333;
          }
          
          .print-info-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 15px;
          }
          
          .print-info-item label {
            font-size: 11px;
            color: #666;
            display: block;
            margin-bottom: 3px;
          }
          
          .print-info-item span {
            font-size: 14px;
            font-weight: bold;
            color: #000;
          }
          
          .print-periode {
            padding-top: 15px;
            border-top: 1px solid #ddd;
            font-size: 12px;
          }
          
          .print-area table {
            border-collapse: collapse;
            width: 100%;
            border: 2px solid black !important;
            margin-bottom: 15px;
          }
          
          .print-area th {
            background: #000 !important;
            color: white !important;
            border: 1px solid black !important;
            padding: 10px 8px !important;
            font-weight: bold !important;
            font-size: 12px !important;
            text-transform: uppercase;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .print-area td {
            border: 1px solid #999 !important;
            padding: 8px !important;
            color: black !important;
            font-size: 11px !important;
          }
          
          .print-area tbody tr:nth-child(even) {
            background: #f9f9f9 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .print-stok-awal {
            background: #e0e0e0 !important;
            font-weight: bold !important;
            border-top: 3px solid #000 !important;
            border-bottom: 3px solid #000 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .print-footer {
            margin-top: 15px;
            padding: 10px 15px;
            background: #f0f0f0 !important;
            border: 1px solid #999;
            font-size: 11px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          @page {
            margin: 1.5cm;
            size: landscape;
          }
        }
      `}</style>

      <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
        {/* Header - No Print */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 no-print">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-600" />
                Laporan Kartu Stok per Barang
              </h1>
              <p className="text-gray-600 mt-1">Riwayat mutasi stok barang per periode</p>
            </div>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              {success}
            </div>
          )}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              {error}
            </div>
          )}

          {/* Filter Section */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 mb-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-600" />
              Filter Laporan
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              
              {/* Pilih Barang Dropdown - 4 columns */}
              <div className="relative md:col-span-4" ref={dropdownRef}>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pilih Barang <span className="text-red-500">*</span>
                </label>
                
                <div className="relative">
                  {!selectedProduct ? (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-left bg-white hover:bg-gray-50 transition-all shadow-sm"
                      >
                        <span className="text-gray-500">Pilih produk...</span>
                      </button>
                      <ChevronDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <div className="flex-1 px-4 py-2.5 border-2 border-blue-400 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg shadow-sm">
                        <p className="font-semibold text-blue-900 text-sm">{selectedProduct.nama_barang}</p>
                        <p className="text-xs text-blue-600 mt-0.5">Kode: {selectedProduct.kode_barang}</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearSelection}
                        className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all shadow-sm"
                        title="Hapus pilihan"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  )}

                  {/* Dropdown Content */}
                  {showDropdown && !selectedProduct && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl overflow-hidden">
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
                              <p className="font-medium text-gray-900 text-sm">{product.nama_barang}</p>
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

              {/* Tanggal Mulai - 3 columns */}
              <div className="md:col-span-3">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tanggal Mulai <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={filters.tanggal_mulai}
                  onChange={(e) => setFilters({ ...filters, tanggal_mulai: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
              </div>

              {/* Tanggal Selesai - 3 columns */}
              <div className="md:col-span-3">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tanggal Selesai <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={filters.tanggal_selesai}
                  onChange={(e) => setFilters({ ...filters, tanggal_selesai: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
              </div>

              {/* Button Tampilkan - 2 columns */}
              <div className="flex items-end md:col-span-2">
                <button
                  onClick={handleTampilkan}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                  <Eye className="w-4 h-4" />
                  {loading ? 'Memuat...' : 'Tampilkan'}
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {selectedProduct && transactions.length > 0 && (
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={handleCetak}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-all font-semibold shadow-md hover:shadow-lg"
              >
                <Printer className="w-4 h-4" />
                Cetak Laporan
              </button>
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-semibold shadow-md hover:shadow-lg"
              >
                <Download className="w-4 h-4" />
                Export Excel
              </button>
            </div>
          )}
        </div>

        {/* Print Area */}
        {selectedProduct && (
          <div className="print-area">
            {/* Print Header */}
            <div className="print-header">
              <h1>Laporan Kartu Stok per Barang</h1>
              <p>Periode: {formatDateLong(filters.tanggal_mulai)} - {formatDateLong(filters.tanggal_selesai)}</p>
            </div>

            {/* Product Info */}
            <div className="print-product-info bg-white rounded-xl border-2 border-gray-200 p-6 mb-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4 pb-3 border-b-2 border-gray-300">{selectedProduct.nama_barang}</h2>
              <div className="print-info-grid grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="print-info-item">
                  <label className="text-xs text-gray-600 mb-1 block font-medium">Kode Barang:</label>
                  <span className="font-bold text-base text-gray-900">{selectedProduct.kode_barang}</span>
                </div>
                <div className="print-info-item">
                  <label className="text-xs text-gray-600 mb-1 block font-medium">Jenis:</label>
                  <span className="font-bold text-base text-gray-900">{selectedProduct.jenis_barang || '-'}</span>
                </div>
                <div className="print-info-item">
                  <label className="text-xs text-gray-600 mb-1 block font-medium">Satuan:</label>
                  <span className="font-bold text-base text-gray-900">{selectedProduct.satuan || 'Unit'}</span>
                </div>
                <div className="print-info-item">
                  <label className="text-xs text-gray-600 mb-1 block font-medium">Stok Saat Ini:</label>
                  <span className="font-bold text-xl text-blue-600">{selectedProduct.stok || 0}</span>
                </div>
              </div>
              <div className="print-periode mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Periode Laporan:</span> {formatDateLong(filters.tanggal_mulai)} sampai {formatDateLong(filters.tanggal_selesai)}
                </p>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-blue-600">
                    <th className="text-left py-4 px-4 border-2 border-gray-300 text-sm font-bold text-white">Tanggal</th>
                    <th className="text-left py-4 px-4 border-2 border-gray-300 text-sm font-bold text-white">Keterangan</th>
                    <th className="text-center py-4 px-4 border-2 border-gray-300 text-sm font-bold text-white">Masuk</th>
                    <th className="text-center py-4 px-4 border-2 border-gray-300 text-sm font-bold text-white">Keluar</th>
                    <th className="text-center py-4 px-4 border-2 border-gray-300 text-sm font-bold text-white">Sisa Stok</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Stok Awal */}
                  <tr className="bg-gray-200 border-t-4 border-b-4 border-gray-400">
                    <td className="py-4 px-4 border-2 border-gray-300 font-bold text-gray-900" colSpan="4">
                      Stok Awal Periode
                    </td>
                    <td className="py-4 px-4 border-2 border-gray-300 text-center font-bold text-blue-700 text-lg">
                      {stokAwal}
                    </td>
                  </tr>

                  {/* Transactions */}
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="text-center py-12 border-2 border-gray-300">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-2 text-gray-600">Memuat data...</p>
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-12 text-gray-500 border-2 border-gray-300">
                        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300 no-print" />
                        <p className="text-lg font-medium">Tidak ada transaksi dalam periode ini</p>
                      </td>
                    </tr>
                  ) : (
                    transactions.map((transaction, index) => (
                      <tr key={transaction.transaction_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="py-3 px-4 text-sm text-gray-900 border-2 border-gray-300">
                          {formatDate(transaction.created_at)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900 border-2 border-gray-300">
                          {getKeterangan(transaction)}
                        </td>
                        <td className="py-3 px-4 text-center text-sm border-2 border-gray-300">
                          {transaction.masuk > 0 ? (
                            <span className="font-bold text-green-600 text-base">{transaction.masuk}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center text-sm border-2 border-gray-300">
                          {transaction.keluar > 0 ? (
                            <span className="font-bold text-red-600 text-base">{transaction.keluar}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-blue-600 text-base border-2 border-gray-300">
                          {transaction.sisa_stok}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {transactions.length > 0 && (
              <div className="mt-4 px-6 py-4 bg-gray-100 border-2 border-gray-300 text-sm text-gray-700 rounded-lg">
                <p className="font-medium">
                  Menampilkan {transactions.length} transaksi dari {formatDateLong(filters.tanggal_mulai)} sampai {formatDateLong(filters.tanggal_selesai)}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default KartuStokAdmin;