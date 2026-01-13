import React, { useState, useEffect } from 'react';
import { Search, Download, Eye, FileText, Printer } from 'lucide-react';
import { stockopnameapi } from '../../services/stockopnameapi';
import * as XLSX from 'xlsx';

const LaporanOpnameAdmin = () => {
  const [filteredData, setFilteredData] = useState([]);
  const [filters, setFilters] = useState({
    tanggal_mulai: '',
    tanggal_selesai: '',
    status_penyesuaian: 'all'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    
    setFilters({
      tanggal_mulai: lastWeek.toISOString().split('T')[0],
      tanggal_selesai: today.toISOString().split('T')[0],
      status_penyesuaian: 'all'
    });
  }, []);

  useEffect(() => {
    if (filters.tanggal_mulai && filters.tanggal_selesai) {
      fetchLaporan();
    }
  }, [filters]);

  const fetchLaporan = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await stockopnameapi.getAll();
      const allData = response.data?.data || [];
      
      let filtered = allData.filter(item => {
        const itemDate = new Date(item.tanggal_opname);
        const startDate = new Date(filters.tanggal_mulai);
        const endDate = new Date(filters.tanggal_selesai);
        return itemDate >= startDate && itemDate <= endDate;
      });

      if (filters.status_penyesuaian !== 'all') {
        filtered = filtered.filter(item => {
          if (filters.status_penyesuaian === 'disesuaikan') {
            return item.status_penyesuaian === 'Disesuaikan';
          } else if (filters.status_penyesuaian === 'belum') {
            return item.status_penyesuaian === 'Belum Disesuaikan';
          }
          return true;
        });
      }

      setFilteredData(filtered);
    } catch (err) {
      console.error('Error fetching laporan:', err);
      setError('Gagal memuat data laporan');
    } finally {
      setLoading(false);
    }
  };

  const handleTampilkanLaporan = () => {
    fetchLaporan();
  };

  // ✅ Fixed Export Function
  const handleExportExcel = () => {
    try {
      const exportData = filteredData.map((item, index) => ({
        'No': index + 1,
        'Tanggal': formatDate(item.tanggal_opname),
        'Kode Barang': item.product?.kode_barang || '-',
        'Nama Barang': item.product?.nama_barang || '-',
        'Stok Sistem': item.stok_sistem || 0,
        'Stok Fisik': item.stok_fisik || 0,
        'Selisih': item.selisih || 0,
        'Status Penyesuaian': item.status_penyesuaian || '-',
        'Petugas': item.nama_petugas || '-',
        'Catatan': item.catatan || '-'
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      ws['!cols'] = [
        { wch: 5 },  { wch: 12 }, { wch: 15 }, { wch: 30 },
        { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 18 },
        { wch: 20 }, { wch: 30 }
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
              alignment: { 
                horizontal: C === 0 || C === 4 || C === 5 || C === 6 ? "center" : "left",
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

      XLSX.utils.book_append_sheet(wb, ws, "Laporan Stok Opname");
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      XLSX.writeFile(wb, `Laporan_Stok_Opname_${timestamp}.xlsx`);
      
      setSuccess('✓ Data berhasil di-export!');
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

  const formatDateFull = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const totalItems = filteredData.length;
  const totalDisesuaikan = filteredData.filter(item => item.status_penyesuaian === 'Disesuaikan').length;
  const totalBelumDisesuaikan = filteredData.filter(item => item.status_penyesuaian === 'Belum Disesuaikan').length;
  const totalSelisihPositif = filteredData.filter(item => item.selisih > 0).length;
  const totalSelisihNegatif = filteredData.filter(item => item.selisih < 0).length;
  const totalSesuai = filteredData.filter(item => item.selisih === 0).length;

  return (
    <>
      {/* Professional Print Styles */}
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
            background: white;
          }
          .no-print {
            display: none !important;
          }
          
          /* Professional Header */
          .print-header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 15px;
            border-bottom: 3px double black;
          }
          
          .print-header h1 {
            font-size: 24px;
            font-weight: bold;
            margin: 0 0 8px 0;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          
          .print-header .company-name {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 5px;
          }
          
          .print-header .period {
            font-size: 12px;
            color: #333;
            margin-top: 8px;
          }
          

          /* Table Styles */
          .print-area table {
            border-collapse: collapse;
            width: 100%;
            border: 2px solid black;
            font-size: 10px;
          }
          
          .print-area thead {
            background: #000 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .print-area th {
            background: #000 !important;
            color: white !important;
            border: 1px solid black;
            padding: 8px 6px;
            font-weight: bold;
            text-align: center;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .print-area td {
            border: 1px solid black;
            padding: 6px;
            color: black;
          }
          
          .print-area tbody tr:nth-child(even) {
            background: #f9f9f9 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          /* Status Badges */
          .badge-disesuaikan {
            display: inline-block;
            padding: 3px 8px;
            border: 1px solid black;
            background: #e0e0e0 !important;
            color: black !important;
            border-radius: 4px;
            font-weight: bold;
            font-size: 9px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .badge-belum {
            display: inline-block;
            padding: 3px 8px;
            border: 1px solid black;
            background: white !important;
            color: black !important;
            border-radius: 4px;
            font-size: 9px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .selisih-positive, .selisih-negative {
            font-weight: bold;
          }
          
          /* Footer */
          .print-footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 2px solid black;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            text-align: center;
          }
          
          .print-footer .signature {
            padding-top: 60px;
            border-top: 1px solid black;
            margin-top: 10px;
          }
          
          .print-footer .signature-label {
            font-size: 11px;
            font-weight: bold;
            margin-bottom: 50px;
          }
          
          .print-footer .signature-name {
            font-size: 11px;
          }
          
          @page {
            margin: 1.5cm;
            size: A4 landscape;
          }
        }
      `}</style>

      <div className="space-y-6">
        {/* Header - No Print */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 no-print">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <FileText className="w-8 h-8 text-indigo-600" />
                Laporan Stok Opname
              </h1>
              <p className="text-gray-600 mt-1">Laporan hasil pengecekan stok fisik gudang</p>
            </div>
          </div>

          {/* Success/Error Messages */}
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

          {/* Filter Section */}
          <div className="bg-gray-50 rounded-lg p-5 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Laporan</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  value={filters.tanggal_mulai}
                  onChange={(e) => setFilters({ ...filters, tanggal_mulai: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Status Penyesuaian
                </label>
                <select
                  value={filters.status_penyesuaian}
                  onChange={(e) => setFilters({ ...filters, status_penyesuaian: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Semua Status</option>
                  <option value="disesuaikan">Stok Disesuaikan</option>
                  <option value="belum">Tidak Disesuaikan</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleTampilkanLaporan}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-gray-400"
                >
                  <Eye className="w-5 h-5" />
                  {loading ? 'Memuat...' : 'Tampilkan Laporan'}
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleCetak}
              disabled={filteredData.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer className="w-5 h-5" />
              Cetak Laporan
            </button>
            <button
              onClick={handleExportExcel}
              disabled={filteredData.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5" />
              Export Excel
            </button>
          </div>
        </div>

        {/* Statistics Summary - No Print */}
        {filteredData.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 no-print">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <p className="text-sm text-gray-600 mb-1">Total Data</p>
              <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
            </div>
            <div className="bg-green-50 rounded-lg shadow-sm border border-green-200 p-4">
              <p className="text-sm text-green-600 mb-1">Disesuaikan</p>
              <p className="text-2xl font-bold text-green-700">{totalDisesuaikan}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg shadow-sm border border-yellow-200 p-4">
              <p className="text-sm text-yellow-600 mb-1">Belum Disesuaikan</p>
              <p className="text-2xl font-bold text-yellow-700">{totalBelumDisesuaikan}</p>
            </div>
            <div className="bg-blue-50 rounded-lg shadow-sm border border-blue-200 p-4">
              <p className="text-sm text-blue-600 mb-1">Selisih +</p>
              <p className="text-2xl font-bold text-blue-700">{totalSelisihPositif}</p>
            </div>
            <div className="bg-red-50 rounded-lg shadow-sm border border-red-200 p-4">
              <p className="text-sm text-red-600 mb-1">Selisih -</p>
              <p className="text-2xl font-bold text-red-700">{totalSelisihNegatif}</p>
            </div>
            <div className="bg-gray-50 rounded-lg shadow-sm border border-gray-200 p-4">
              <p className="text-sm text-gray-600 mb-1">Sesuai (0)</p>
              <p className="text-2xl font-bold text-gray-700">{totalSesuai}</p>
            </div>
          </div>
        )}

        {/* Print Area */}
        <div className="print-area">
          {/* Professional Print Header */}
          <div className="print-header">
            <div className="company-name">PT. INVENTARIS SYSTEM</div>
            <h1>Laporan Stok Opname</h1>
            {filters.tanggal_mulai && filters.tanggal_selesai && (
              <div className="period">
                Periode: {formatDateFull(filters.tanggal_mulai)} - {formatDateFull(filters.tanggal_selesai)}
              </div>
            )}
          </div>



          {/* Report Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-indigo-600 text-white">
                    <th className="text-left py-3 px-4 border border-gray-300 text-sm font-bold">Tanggal</th>
                    <th className="text-left py-3 px-4 border border-gray-300 text-sm font-bold">Kode</th>
                    <th className="text-left py-3 px-4 border border-gray-300 text-sm font-bold">Nama Barang</th>
                    <th className="text-center py-3 px-4 border border-gray-300 text-sm font-bold">Sistem</th>
                    <th className="text-center py-3 px-4 border border-gray-300 text-sm font-bold">Fisik</th>
                    <th className="text-center py-3 px-4 border border-gray-300 text-sm font-bold">Selisih</th>
                    <th className="text-center py-3 px-4 border border-gray-300 text-sm font-bold">Penyesuaian</th>
                    <th className="text-left py-3 px-4 border border-gray-300 text-sm font-bold">Petugas</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="text-center py-12 border border-gray-300">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        <p className="mt-2 text-gray-600">Memuat data...</p>
                      </td>
                    </tr>
                  ) : filteredData.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-12 text-gray-500 border border-gray-300">
                        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300 no-print" />
                        <p className="text-lg font-medium">Tidak ada data untuk periode yang dipilih</p>
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item, index) => (
                      <tr key={item.opname_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="py-2.5 px-4 text-sm text-gray-900 border border-gray-300">
                          {formatDate(item.tanggal_opname)}
                        </td>
                        <td className="py-2.5 px-4 text-sm font-medium text-gray-900 border border-gray-300">
                          {item.product?.kode_barang || '-'}
                        </td>
                        <td className="py-2.5 px-4 text-sm text-gray-900 border border-gray-300">
                          {item.product?.nama_barang || '-'}
                        </td>
                        <td className="py-2.5 px-4 text-center text-sm font-semibold text-gray-900 border border-gray-300">
                          {item.stok_sistem}
                        </td>
                        <td className="py-2.5 px-4 text-center text-sm font-semibold text-gray-900 border border-gray-300">
                          {item.stok_fisik}
                        </td>
                        <td className="py-2.5 px-4 text-center border border-gray-300">
                          <span className={`font-semibold text-sm ${
                            item.selisih > 0 ? 'selisih-positive text-green-700' :
                            item.selisih < 0 ? 'selisih-negative text-red-700' :
                            'text-gray-700'
                          }`}>
                            {item.selisih > 0 ? '+' : ''}{item.selisih}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center border border-gray-300">
                          <span className={item.status_penyesuaian === 'Disesuaikan' ? 'badge-disesuaikan' : 'badge-belum'}>
                            {item.status_penyesuaian === 'Disesuaikan' ? '✓ Disesuaikan' : '⊗ Belum'}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-sm text-gray-900 border border-gray-300">
                          {item.nama_petugas || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {filteredData.length > 0 && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-300 text-sm text-gray-700">
                Menampilkan {filteredData.length} data dari {formatDateFull(filters.tanggal_mulai)} sampai {formatDateFull(filters.tanggal_selesai)}
              </div>
            )}
          </div>

          {/* Professional Footer with Signatures */}
          {filteredData.length > 0 && (
            <div className="print-footer">
              <div>
                <div className="signature-label">Dibuat Oleh,</div>
                <div className="signature">
                  <div className="signature-name">(_________________)</div>
                  <div style={{fontSize: '10px', marginTop: '5px'}}>Admin Gudang</div>
                </div>
              </div>
              <div>
                <div className="signature-label">Diperiksa Oleh,</div>
                <div className="signature">
                  <div className="signature-name">(_________________)</div>
                  <div style={{fontSize: '10px', marginTop: '5px'}}>Supervisor</div>
                </div>
              </div>
              <div>
                <div className="signature-label">Disetujui Oleh,</div>
                <div className="signature">
                  <div className="signature-name">(_________________)</div>
                  <div style={{fontSize: '10px', marginTop: '5px'}}>Manager</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default LaporanOpnameAdmin;