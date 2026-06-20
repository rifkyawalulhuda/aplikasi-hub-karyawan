import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSnackbar } from 'notistack';

import Breadcrumbs from '@mui/material/Breadcrumbs';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import OutputOutlinedIcon from '@mui/icons-material/OutputOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';

import EnhancedTable from '@/components/dataTable';

import CardHeader from '@/components/cardHeader';
import DeleteConfirmDialog from '@/components/masterData/deleteConfirmDialog';
import PageHeader from '@/components/pageHeader';
import { useAuth } from '@/contexts/authContext';
import { useSite } from '@/contexts/siteContext';
import { deleteWasteRecord, exportWasteRecords, getWasteRecords } from '@/services/b3WasteService';

import WasteOutRecordForm from './WasteOutRecordForm';
import WasteRecordForm from './WasteRecordForm';

// --- Helpers ---

function formatAngka(value) {
	if (value == null || Number.isNaN(Number(value))) return '';
	const num = Number(value);
	return num.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr) {
	if (!dateStr) return '-';
	const date = new Date(dateStr);
	return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getStatusColor(status) {
	if (status === 'overdue') return 'error';
	if (status === 'warning') return 'warning';
	return 'default';
}

// --- Constants ---

const PAGE_SIZE_OPTIONS = [25, 50, 100];
const DEFAULT_PAGE_SIZE = 25;
const DEFAULT_SORT_FIELD = 'tanggalMasuk';
const DEFAULT_SORT_ORDER = 'desc';

function PencatatanLimbahB3() {
	const { enqueueSnackbar } = useSnackbar();
	const { currentSiteId } = useSite();
	const { user } = useAuth();

	// --- State ---
	const [rows, setRows] = useState([]);
	const [totalRows, setTotalRows] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const [paginationModel, setPaginationModel] = useState({
		page: 0,
		pageSize: DEFAULT_PAGE_SIZE,
	});
	const [sortModel, setSortModel] = useState([{ field: DEFAULT_SORT_FIELD, sort: DEFAULT_SORT_ORDER }]);

	// Dialog states
	const [formOpen, setFormOpen] = useState(false);
	const [outFormOpen, setOutFormOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [selectedRecord, setSelectedRecord] = useState(null);
	const [submitting, setSubmitting] = useState(false);

	// --- Data Fetching ---

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

			const response = await getWasteRecords(currentSiteId, {
				page: paginationModel.page,
				pageSize: paginationModel.pageSize,
				sortField,
				sortOrder,
			});

			setRows(response.data || []);
			setTotalRows(response.total || 0);
		} catch (err) {
			setError(err.message || 'Gagal memuat data');
			enqueueSnackbar(err.message || 'Gagal memuat data pencatatan limbah B3', { variant: 'error' });
		} finally {
			setLoading(false);
		}
	}, [currentSiteId, paginationModel.page, paginationModel.pageSize, sortModel, enqueueSnackbar]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	// --- Event Handlers ---

	const handleSortModelChange = (newSortModel) => {
		setSortModel(newSortModel);
	};

	const handlePaginationModelChange = (newPaginationModel) => {
		setPaginationModel(newPaginationModel);
	};

	const handleAddIncoming = () => {
		setSelectedRecord(null);
		setFormOpen(true);
	};

	const handleAddOutgoing = (record) => {
		setSelectedRecord(record);
		setOutFormOpen(true);
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
			await deleteWasteRecord(currentSiteId, selectedRecord.id);
			setDeleteOpen(false);
			setSelectedRecord(null);
			enqueueSnackbar('Data limbah B3 berhasil dihapus.', { variant: 'success' });
			fetchData();
		} catch (err) {
			enqueueSnackbar(err.message || 'Gagal menghapus data', { variant: 'error' });
		} finally {
			setSubmitting(false);
		}
	};

	const handleExportExcel = async () => {
		try {
			enqueueSnackbar('Menyiapkan file export Excel...', { variant: 'info' });
			await exportWasteRecords(currentSiteId);
		} catch (err) {
			enqueueSnackbar(err.message || 'Gagal mengekspor data', { variant: 'error' });
		}
	};

	const handleFormSuccess = () => {
		setFormOpen(false);
		setSelectedRecord(null);
		fetchData();
	};

	const handleOutFormSuccess = () => {
		setOutFormOpen(false);
		setSelectedRecord(null);
		fetchData();
	};

	// --- Columns ---

	const columns = useMemo(
		() => [
			{
				field: 'jenisLimbah',
				headerName: 'JENIS LIMBAH B3',
				minWidth: 180,
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
				field: 'sumberLimbah',
				headerName: 'SUMBER',
				minWidth: 120,
				sortable: false,
			},
			{
				field: 'jumlahMasuk',
				headerName: 'MASUK (KG)',
				width: 130,
				sortable: false,
				align: 'right',
				headerAlign: 'right',
				valueFormatter: (params) => formatAngka(params.value),
			},
			{
				field: 'jumlahKeluar',
				headerName: 'KELUAR (KG)',
				width: 130,
				sortable: false,
				align: 'right',
				headerAlign: 'right',
				valueGetter: (params) => {
					const { outRecords } = params.row;
					if (!outRecords || outRecords.length === 0) return 0;
					return outRecords.reduce((sum, rec) => sum + Number(rec.jumlahKeluar || 0), 0);
				},
				valueFormatter: (params) => (params.value > 0 ? formatAngka(params.value) : '-'),
			},
			{
				field: 'sisaLimbah',
				headerName: 'SISA (KG)',
				width: 130,
				sortable: false,
				align: 'right',
				headerAlign: 'right',
				renderCell: (params) => {
					const { sisaLimbah } = params.row;
					const isFullyOut = sisaLimbah <= 0;
					return (
						<Typography
							variant="body2"
							fontWeight={600}
							color={isFullyOut ? 'success.main' : 'text.primary'}
						>
							{isFullyOut ? 'Habis' : formatAngka(sisaLimbah)}
						</Typography>
					);
				},
			},
			{
				field: 'sisaHari',
				headerName: 'SISA HARI',
				width: 120,
				sortable: false,
				align: 'center',
				headerAlign: 'center',
				renderCell: (params) => {
					const { sisaHari, statusPenyimpanan, sisaLimbah } = params.row;
					if (sisaLimbah <= 0) {
						return (
							<Typography variant="body2" color="text.secondary">
								-
							</Typography>
						);
					}
					return (
						<Chip
							size="small"
							label={`${sisaHari} hari`}
							color={getStatusColor(statusPenyimpanan)}
							variant={statusPenyimpanan === 'normal' ? 'outlined' : 'filled'}
						/>
					);
				},
			},
			{
				field: 'tanggalBatas',
				headerName: 'TGL BATAS',
				width: 120,
				sortable: true,
				valueFormatter: (params) => formatDate(params.value),
			},
			{
				field: 'maksimalPenyimpanan',
				headerName: 'MAKS',
				width: 80,
				sortable: false,
				align: 'center',
				headerAlign: 'center',
				valueFormatter: (params) => (params.value ? `${params.value}h` : '-'),
			},
			{
				field: 'tanggalKeluar',
				headerName: 'TGL KELUAR',
				width: 120,
				sortable: false,
				valueGetter: (params) => {
					const { outRecords } = params.row;
					if (!outRecords || outRecords.length === 0) return '-';
					const latest = outRecords[outRecords.length - 1];
					return formatDate(latest.tanggalKeluar);
				},
			},
			{
				field: 'tujuanPenyerahan',
				headerName: 'TUJUAN',
				minWidth: 140,
				sortable: false,
				valueGetter: (params) => {
					const { outRecords } = params.row;
					if (!outRecords || outRecords.length === 0) return '-';
					const latest = outRecords[outRecords.length - 1];
					return latest.tujuanPenyerahan || '-';
				},
			},
			{
				field: 'nomorDokumen',
				headerName: 'NO. DOKUMEN',
				minWidth: 140,
				sortable: false,
				valueGetter: (params) => {
					const { outRecords } = params.row;
					if (!outRecords || outRecords.length === 0) return '-';
					const latest = outRecords[outRecords.length - 1];
					return latest.nomorDokumen || '-';
				},
			},
			{
				field: 'vendor',
				headerName: 'PENGELOLA',
				minWidth: 160,
				sortable: false,
				valueGetter: (params) => {
					const { outRecords } = params.row;
					if (!outRecords || outRecords.length === 0) return '-';
					const latest = outRecords[outRecords.length - 1];
					return latest.vendor?.vendorName || '-';
				},
			},
		],
		[],
	);

	// --- Row styling for visual indicators ---

	const getRowClassName = (params) => {
		const { statusPenyimpanan, sisaLimbah } = params.row;
		if (sisaLimbah <= 0) return '';
		if (statusPenyimpanan === 'overdue') return 'row-overdue';
		if (statusPenyimpanan === 'warning') return 'row-warning';
		return '';
	};

	// --- Render ---

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
					<Typography variant="h6">Belum ada data pencatatan limbah B3</Typography>
					<Typography variant="body2" color="text.secondary">
						Tambahkan data pencatatan limbah B3 pertama dari halaman ini.
					</Typography>
				</Stack>
			);
		}

		return (
			<EnhancedTable
				rows={rows}
				columns={columns}
				columnResizeKey="pencatatan-limbah-b3-table"
				getRowClassName={getRowClassName}
				getContextMenuActions={(row) => [
					{
						key: 'add-out',
						label: 'Tambah Limbah Keluar',
						icon: <OutputOutlinedIcon fontSize="small" color="success" />,
						onClick: handleAddOutgoing,
						disabled: row.sisaLimbah <= 0,
					},
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
						disabled: row.outRecords?.length > 0,
					},
				]}
				paginationMode="server"
				rowCount={totalRows}
				paginationModel={paginationModel}
				onPaginationModelChange={handlePaginationModelChange}
				pageSizeOptions={PAGE_SIZE_OPTIONS}
				sortingMode="server"
				sortModel={sortModel}
				onSortModelChange={handleSortModelChange}
				height={600}
				sx={{
					'& .row-warning': {
						backgroundColor: 'rgba(255, 167, 38, 0.08)',
						'&:hover': {
							backgroundColor: 'rgba(255, 167, 38, 0.14)',
						},
					},
					'& .row-overdue': {
						backgroundColor: 'rgba(244, 67, 54, 0.08)',
						'&:hover': {
							backgroundColor: 'rgba(244, 67, 54, 0.14)',
						},
					},
				}}
			/>
		);
	};

	return (
		<>
			<PageHeader title="Pencatatan Limbah B3">
				<Breadcrumbs aria-label="breadcrumb" sx={{ textTransform: 'uppercase' }}>
					<Link underline="hover" href="#!">
						Limbah B3
					</Link>
					<Typography color="text.tertiary">Pencatatan Limbah B3</Typography>
				</Breadcrumbs>
			</PageHeader>
			<Card sx={{ minHeight: '60vh', p: 3 }}>
				<CardHeader
					title="Pencatatan Limbah B3"
					subtitle="Kelola data pencatatan limbah B3 masuk dan keluar TPS dengan monitoring batas penyimpanan."
					size="small"
					sx={{
						flexDirection: 'column',
						alignItems: 'stretch',
						gap: 2,
						mb: 2.5,
					}}
				>
					<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
						<Button
							variant="outlined"
							startIcon={<DownloadOutlinedIcon />}
							onClick={handleExportExcel}
							sx={{ minWidth: 170, whiteSpace: 'nowrap' }}
						>
							Ekspor Excel
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
							onClick={handleAddIncoming}
							sx={{ minWidth: 200, whiteSpace: 'nowrap' }}
						>
							Tambah Limbah Masuk
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
			<WasteRecordForm
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
			<WasteOutRecordForm
				open={outFormOpen}
				onClose={() => {
					setOutFormOpen(false);
					setSelectedRecord(null);
				}}
				onSuccess={handleOutFormSuccess}
				wasteRecord={selectedRecord}
				siteId={currentSiteId}
				adminName={user?.name || ''}
			/>
			<DeleteConfirmDialog
				open={deleteOpen}
				loading={submitting}
				title="Pencatatan Limbah B3"
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

export default PencatatanLimbahB3;
