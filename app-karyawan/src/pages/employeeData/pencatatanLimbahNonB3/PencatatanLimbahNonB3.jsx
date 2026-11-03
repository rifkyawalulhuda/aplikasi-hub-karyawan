import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSnackbar } from 'notistack';

import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';

import CardHeader from '@/components/cardHeader';
import EnhancedTable from '@/components/dataTable';
import DeleteConfirmDialog from '@/components/masterData/deleteConfirmDialog';
import { useAuth } from '@/contexts/authContext';
import { useSite } from '@/contexts/siteContext';
import { getSiteProfile } from '@/services/b3WasteService';
import {
	deleteNonB3WasteRecord,
	exportNonB3WasteRecords,
	getNonB3ExportYears,
	getNonB3WasteRecords,
} from '@/services/nonB3WasteService';

import CetakPencatatanNonB3Dialog from './CetakPencatatanNonB3Dialog';
import NonB3WasteRecordForm from './NonB3WasteRecordForm';

function formatAngka(value) {
	if (value == null || Number.isNaN(Number(value))) return '';
	return Number(value).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr) {
	if (!dateStr) return '-';
	const date = new Date(dateStr);
	return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const PAGE_SIZE_OPTIONS = [25, 50, 100];
const DEFAULT_PAGE_SIZE = 25;
const DEFAULT_SORT_FIELD = 'tanggalMasuk';
const DEFAULT_SORT_ORDER = 'desc';

function PencatatanLimbahNonB3() {
	const { enqueueSnackbar } = useSnackbar();
	const { currentSiteId, siteName } = useSite();
	const { user } = useAuth();

	const [rows, setRows] = useState([]);
	const [totalRows, setTotalRows] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: DEFAULT_PAGE_SIZE });
	const [sortModel, setSortModel] = useState([{ field: DEFAULT_SORT_FIELD, sort: DEFAULT_SORT_ORDER }]);

	const [formOpen, setFormOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [cetakOpen, setCetakOpen] = useState(false);
	const [responsibleName, setResponsibleName] = useState('');
	const [exportYears, setExportYears] = useState([]);
	const [exportYear, setExportYear] = useState('all');
	const [selectedRecord, setSelectedRecord] = useState(null);
	const [submitting, setSubmitting] = useState(false);

	const fetchData = useCallback(async () => {
		if (!currentSiteId) {
			setRows([]);
			setTotalRows(0);
			setLoading(false);
			setError(null);
			return;
		}

		setLoading(true);
		setError(null);

		try {
			const sortField = sortModel[0]?.field || DEFAULT_SORT_FIELD;
			const sortOrder = sortModel[0]?.sort || DEFAULT_SORT_ORDER;

			const response = await getNonB3WasteRecords(currentSiteId, {
				page: paginationModel.page,
				pageSize: paginationModel.pageSize,
				sortField,
				sortOrder,
			});

			setRows(response.data || []);
			setTotalRows(response.total || 0);
		} catch (err) {
			setError(err.message || 'Gagal memuat data');
			enqueueSnackbar(err.message || 'Gagal memuat data pencatatan limbah non-B3', {
				variant: 'error',
			});
		} finally {
			setLoading(false);
		}
	}, [currentSiteId, paginationModel.page, paginationModel.pageSize, sortModel, enqueueSnackbar]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const fetchExportYears = useCallback(async () => {
		if (!currentSiteId) {
			setExportYears([]);
			setExportYear('all');
			return;
		}

		try {
			const result = await getNonB3ExportYears(currentSiteId);
			setExportYears(result?.years || []);
		} catch {
			setExportYears([]);
		}
	}, [currentSiteId]);

	useEffect(() => {
		fetchExportYears();
	}, [fetchExportYears]);

	const handleAdd = () => {
		setSelectedRecord(null);
		setFormOpen(true);
	};

	const handleEdit = (record) => {
		setSelectedRecord(record);
		setFormOpen(true);
	};

	const handleDeleteClick = (record) => {
		setSelectedRecord(record);
		setDeleteOpen(true);
	};

	const handleDeleteConfirm = async () => {
		if (!selectedRecord) return;

		setSubmitting(true);

		try {
			await deleteNonB3WasteRecord(currentSiteId, selectedRecord.id);
			setDeleteOpen(false);
			setSelectedRecord(null);
			enqueueSnackbar('Pencatatan limbah non-B3 berhasil dihapus.', { variant: 'success' });
			fetchData();
		} catch (err) {
			enqueueSnackbar(err.message || 'Gagal menghapus data', { variant: 'error' });
		} finally {
			setSubmitting(false);
		}
	};

	const handleFormSuccess = () => {
		setFormOpen(false);
		setSelectedRecord(null);
		fetchData();
	};

	const handleExportExcel = async () => {
		if (!currentSiteId) return;

		try {
			enqueueSnackbar('Menyiapkan file export Excel...', { variant: 'info' });
			await exportNonB3WasteRecords(currentSiteId, exportYear === 'all' ? null : exportYear);
		} catch (err) {
			enqueueSnackbar(err.message || 'Gagal mengekspor data', { variant: 'error' });
		}
	};

	const handleOpenCetak = async () => {
		if (!currentSiteId) return;

		try {
			const profile = await getSiteProfile(currentSiteId);
			setResponsibleName(profile?.responsibleName || '');
		} catch {
			setResponsibleName('');
		}

		setCetakOpen(true);
	};

	const columns = useMemo(
		() => [
			{
				field: 'jenisLimbah',
				headerName: 'JENIS LIMBAH NON-B3',
				minWidth: 200,
				flex: 1,
				sortable: false,
				valueGetter: (params) => {
					const { jenisLimbah } = params.row;
					return jenisLimbah ? `${jenisLimbah.kode} - ${jenisLimbah.nama}` : '-';
				},
			},
			{
				field: 'tanggalMasuk',
				headerName: 'TGL MASUK',
				width: 120,
				sortable: true,
				valueFormatter: (params) => formatDate(params.value),
			},
			{
				field: 'tanggalKeluar',
				headerName: 'TGL KELUAR',
				width: 120,
				sortable: true,
				valueFormatter: (params) => formatDate(params.value),
			},
			{
				field: 'jumlahKg',
				headerName: 'JUMLAH (KG)',
				width: 130,
				sortable: false,
				align: 'right',
				headerAlign: 'right',
				valueFormatter: (params) => formatAngka(params.value),
			},
			{
				field: 'vendor',
				headerName: 'PENGELOLA',
				minWidth: 180,
				sortable: false,
				valueGetter: (params) => params.row.vendor?.vendorName || '-',
			},
			{
				field: 'nopolKendaraan',
				headerName: 'NOPOL',
				width: 130,
				sortable: false,
				valueGetter: (params) => params.row.nopolKendaraan || '-',
			},
			{
				field: 'nomorDokumen',
				headerName: 'NO. DOKUMEN',
				minWidth: 150,
				sortable: false,
				valueGetter: (params) => params.row.nomorDokumen || '-',
			},
			{
				field: 'nomorSuratJalan',
				headerName: 'SURAT JALAN',
				minWidth: 150,
				sortable: false,
				valueGetter: (params) => params.row.nomorSuratJalan || '-',
			},
		],
		[],
	);

	const renderContent = () => {
		if (!currentSiteId) {
			return (
				<Stack py={8} alignItems="center" spacing={1}>
					<Typography variant="h6">Pilih site terlebih dahulu</Typography>
					<Typography variant="body2" color="text.secondary">
						Silakan pilih site pada selektor di bagian atas untuk menampilkan data.
					</Typography>
				</Stack>
			);
		}

		if (error && rows.length === 0) {
			return (
				<Stack alignItems="center" justifyContent="center" py={10} spacing={2}>
					<Typography variant="body1" color="error">
						{error}
					</Typography>
					<Button variant="outlined" startIcon={<RefreshOutlinedIcon />} onClick={fetchData}>
						Coba Lagi
					</Button>
				</Stack>
			);
		}

		if (!loading && rows.length === 0 && !error) {
			return (
				<Stack py={8} alignItems="center" spacing={1}>
					<Typography variant="h6">Belum ada data pencatatan limbah non-B3</Typography>
					<Typography variant="body2" color="text.secondary">
						Tambahkan data pencatatan limbah non-B3 pertama dari halaman ini.
					</Typography>
				</Stack>
			);
		}

		return (
			<EnhancedTable
				rows={rows}
				columns={columns}
				columnResizeKey="pencatatan-limbah-non-b3-table"
				getContextMenuActions={() => [
					{
						key: 'edit',
						label: 'Edit',
						icon: <EditOutlinedIcon fontSize="small" color="primary" />,
						onClick: handleEdit,
					},
					{
						key: 'delete',
						label: 'Hapus',
						icon: <DeleteOutlineOutlinedIcon fontSize="small" color="error" />,
						onClick: handleDeleteClick,
					},
				]}
				paginationMode="server"
				rowCount={totalRows}
				paginationModel={paginationModel}
				onPaginationModelChange={setPaginationModel}
				pageSizeOptions={PAGE_SIZE_OPTIONS}
				sortingMode="server"
				sortModel={sortModel}
				onSortModelChange={setSortModel}
				height={600}
			/>
		);
	};

	return (
		<>
			<Card sx={{ minHeight: '60vh', p: 3 }}>
				<CardHeader
					title="Pencatatan Limbah Non-B3"
					subtitle="Kelola catatan pengelolaan limbah non-B3: tanggal masuk, tanggal keluar, pengelola pihak ke-3, dan dokumen pengiriman."
					size="small"
					sx={{ flexDirection: 'column', alignItems: 'stretch', gap: 2, mb: 2.5 }}
				>
					<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
						<TextField
							select
							size="small"
							label="Tahun Export"
							value={exportYear}
							onChange={(event) => setExportYear(event.target.value)}
							sx={{ minWidth: 150 }}
						>
							<MenuItem value="all">Semua Tahun</MenuItem>
							{exportYears.map((year) => (
								<MenuItem key={year} value={year}>
									{year}
								</MenuItem>
							))}
						</TextField>
						<Button
							variant="outlined"
							startIcon={<DownloadOutlinedIcon />}
							onClick={handleExportExcel}
							disabled={!currentSiteId}
							sx={{ minWidth: 170, whiteSpace: 'nowrap' }}
						>
							Ekspor Excel
						</Button>
						<Button
							variant="outlined"
							startIcon={<PrintOutlinedIcon />}
							onClick={handleOpenCetak}
							disabled={!currentSiteId}
							sx={{ minWidth: 130, whiteSpace: 'nowrap' }}
						>
							Cetak
						</Button>
						<Button
							variant="outlined"
							startIcon={<RefreshOutlinedIcon />}
							onClick={fetchData}
							sx={{ minWidth: 130, whiteSpace: 'nowrap' }}
						>
							Refresh
						</Button>
						<Button
							variant="contained"
							startIcon={<AddOutlinedIcon />}
							onClick={handleAdd}
							sx={{ minWidth: 200, whiteSpace: 'nowrap' }}
						>
							Tambah Pencatatan
						</Button>
					</Stack>
				</CardHeader>
				{loading && rows.length === 0 ? (
					<Stack alignItems="center" justifyContent="center" py={10}>
						<CircularProgress />
					</Stack>
				) : (
					renderContent()
				)}
			</Card>

			<NonB3WasteRecordForm
				open={formOpen}
				onClose={() => {
					setFormOpen(false);
					setSelectedRecord(null);
				}}
				onSuccess={handleFormSuccess}
				editData={selectedRecord}
				siteId={currentSiteId}
				adminName={user?.name || ''}
			/>

			<CetakPencatatanNonB3Dialog
				open={cetakOpen}
				onClose={() => setCetakOpen(false)}
				siteId={currentSiteId}
				siteName={siteName || ''}
				adminName={user?.name || ''}
				responsibleName={responsibleName}
			/>

			<DeleteConfirmDialog
				open={deleteOpen}
				loading={submitting}
				title="Pencatatan Limbah Non-B3"
				itemName={
					selectedRecord
						? `${selectedRecord.jenisLimbah?.nama || ''} (${formatDate(selectedRecord.tanggalMasuk)})`
						: ''
				}
				onClose={() => {
					setDeleteOpen(false);
					setSelectedRecord(null);
				}}
				onConfirm={handleDeleteConfirm}
			/>
		</>
	);
}

export default PencatatanLimbahNonB3;
