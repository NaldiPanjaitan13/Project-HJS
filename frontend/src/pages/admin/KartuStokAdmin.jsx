import React, { useState, useEffect } from 'react';
import { Eye, Printer, FileText } from 'lucide-react';
import { productapi } from '../../services/productapi';
import { stocktransactionapi } from '../../services/stocktransactionapi';

const KartuStokAdmin = () => {
  const [filters, setFilters] = useState({
    kode_barang: '',
    tanggal_mulai: '',
    tanggal_selesai: ''
  });

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stokAwal, setStokAwal] = useState(0);

  useEffect(() => {
    // Set default date range (last 7 days)
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    
    setFilters(prev => ({
      ...prev,
      tanggal_mulai: lastWeek.toISOString().split('T')[0],
      tanggal_selesai: today.toISOString().split('T')[0]
    }));
  }, []);

  const handleTampilkan = async () => {
    if (!filters.kode_barang.trim()) {
      setError('Kode barang harus diisi!');
      return;
    }

    if (!filters.tanggal_mulai || !filters.tanggal_selesai) {
      setError('Tanggal mulai dan selesai harus diisi!');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // 1. Cari produk berdasarkan kode barang
      const productResponse = await productapi.getAll({ search: filters.kode_barang });
      const products = productResponse.data?.data || productResponse.data || [];
      const product = products.find(p => p.kode_barang === filters.kode_barang);

      if (!product) {
        setError('Produk tidak ditemukan!');
        setSelectedProduct(null);
        setTransactions([]);
        setLoading(false);
        return;
      }

      setSelectedProduct(product);

      // 2. Ambil SEMUA transaksi produk ini menggunakan endpoint khusus
      const kartuStokResponse = await stocktransactionapi.getKartuStok(product.product_id);
      
      const allTransactions = kartuStokResponse.data?.transactions || 
                             kartuStokResponse.transactions || [];

      // 3. Pisahkan transaksi berdasarkan periode
      const startDate = new Date(filters.tanggal_mulai);
      const endDate = new Date(filters.tanggal_selesai);
      endDate.setHours(23, 59, 59, 999); // Set to end of day

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

      // 4. Hitung stok awal dari transaksi sebelum periode
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

      // 5. Sort transaksi dalam periode by date ascending
      const sortedTransactions = transactionsInPeriod.sort((a, b) => 
        new Date(a.created_at) - new Date(b.created_at)
      );

      // 6. Hitung running balance untuk setiap transaksi
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
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
          
          .print-area {
            background: white !important;
            color: black !important;
          }
          
          .print-area table {
            border-collapse: collapse;
            width: 100%;
            border: 2px solid black !important;
          }
          
          .print-area th {
            background: #e0e0e0 !important;
            color: black !important;
            border: 1px solid black !important;
            padding: 8px !important;
            font-weight: bold !important;
          }
          
          .print-area td {
            border: 1px solid black !important;
            padding: 6px 8px !important;
            color: black !important;
          }
          
          .print-header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid black;
            padding-bottom: 10px;
          }
          
          .print-header h1 {
            font-size: 24px;
            font-weight: bold;
            margin: 0 0 10px 0;
          }
          
          .print-info {
            margin-bottom: 15px;
            font-size: 14px;
          }
          
          @page {
            margin: 1cm;
            size: landscape;
          }
        }
      `}</style>

      <div className="space-y-6">
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

          {/* Filter Section */}
          <div className="bg-gray-50 rounded-lg p-5 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Laporan</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Kode Barang
                </label>
                <input
                  type="text"
                  value={filters.kode_barang}
                  onChange={(e) => setFilters({ ...filters, kode_barang: e.target.value.toUpperCase() })}
                  placeholder="BR-101"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  value={filters.tanggal_mulai}
                  onChange={(e) => setFilters({ ...filters, tanggal_mulai: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tanggal Selesai
                </label>
                <input
                  type="date"
                  value={filters.tanggal_selesai}
                  onChange={(e) => setFilters({ ...filters, tanggal_selesai: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleTampilkan}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-gray-400"
                >
                  <Eye className="w-5 h-5" />
                  {loading ? 'Memuat...' : 'Tampilkan'}
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Action Button */}
          {selectedProduct && (
            <div className="flex gap-3">
              <button
                onClick={handleCetak}
                className="flex items-center gap-2 px-6 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
              >
                <Printer className="w-5 h-5" />
                Cetak
              </button>
            </div>
          )}
        </div>

        {/* Print Area */}
        {selectedProduct && (
          <div className="print-area">
            {/* Print Header */}
            <div className="print-header no-print">
              <h1>Laporan Kartu Stok per Barang</h1>
            </div>

            {/* Product Info Header - Screen & Print */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Kode Barang:</p>
                  <p className="font-bold text-xl text-gray-900">{selectedProduct.kode_barang}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Periode Laporan:</p>
                  <p className="font-bold text-xl text-gray-900">
                    {formatDateLong(filters.tanggal_mulai)} - {formatDateLong(filters.tanggal_selesai)}
                  </p>
                </div>
              </div>
            </div>

            {/* Product Detail */}
            <div className="bg-white rounded-lg border-2 border-gray-200 p-5 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{selectedProduct.nama_barang}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Kode Barang:</p>
                  <p className="font-semibold text-lg text-gray-900">{selectedProduct.kode_barang}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Jenis:</p>
                  <p className="font-semibold text-lg text-gray-900">{selectedProduct.jenis_barang || 'Furniture'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Satuan:</p>
                  <p className="font-semibold text-lg text-gray-900">{selectedProduct.satuan || 'Unit'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Stok Saat Ini:</p>
                  <p className="font-semibold text-blue-600 text-2xl">{selectedProduct.stok || 0}</p>
                </div>
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
                  {/* Stok Awal dengan Border Tebal */}
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