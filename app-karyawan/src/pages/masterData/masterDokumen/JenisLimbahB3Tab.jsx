import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSnackbar } from 'notistack';
import { useFormik } from 'formik';
import * as yup from 'yup';

import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';

import EnhancedTable from '@/components/dataTable';
import CardHeader from '@/components/cardHeader';
import DeleteConfirmDialog from '@/components/masterData/deleteConfirmDialog';
import { useSite } from '@/contexts/siteContext';
import { createWasteType, deleteWasteType, getWasteTypes, updateWasteType } from '@/services/b3WasteService';

// --- Component ---

const createSchema = yup.object({
	kode: yup.string().required('Kode limbah wajib diisi').max(20, 'Kode limbah maksimal 20 karakter'),
	nama: yup.string().required('Jenis limbah B3 wajib diisi').max(200, 'Jenis limbah B3 maksimal 200 karakter'),
});

// --- Component ---

function JenisLimbahB3Tab() {
	const { enqueueSnackbar } = useSnackbar();
	const { currentSiteId } = useSite();

	// --- State ---
	const [rows, setRows] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchKeyword, setSearchKeyword] = useState('');

	// Dialog states
	const [formOpen, setFormOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [selectedItem, setSelectedItem] = useState(null);
	const [submitting, setSubmitting] = useState(false);

	const isEditMode = Boolean(selectedItem);

	// --- Data Fetching ---

	const fetchData = useCallback(async () => {
		if (!currentSiteId) {
			setRows([]);
			setLoading(false);
			return;
		}

		setLoading(true);

		try {
			const response = await getWasteTypes(currentSiteId, { page: 0, pageSize: 999 });
			setRows(response.data || []);
		} catch (err) {
			enqueueSnackbar(err.message || 'Gagal memuat data jenis limbah B3', { variant: 'error' });
		} finally {
			setLoading(false);
		}
	}, [currentSiteId, enqueueSnackbar]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	// --- Client-side search filter ---

	const filteredRows = useMemo(() => {
		const keyword = searchKeyword.trim().toLowerCase();
		if (!keyword) return rows;
		return rows.filter(
			(row) =>
				String(row.kode || '')
					.toLowerCase()
					.includes(keyword) ||
				String(row.nama || '')
					.toLowerCase()
					.includes(keyword),
		);
	}, [rows, searchKeyword]);

	// --- Formik ---

	const formik = useFormik({
		initialValues: {
			kode: selectedItem?.kode || '',
			nama: selectedItem?.nama || '',
		},
		validationSchema: createSchema,
		enableReinitialize: true,
		onSubmit: async (values, { resetForm }) => {
			setSubmitting(true);

			try {
				if (isEditMode) {
					await updateWasteType(currentSiteId, selectedItem.id, { nama: values.nama });
					enqueueSnackbar('Jenis limbah B3 berhasil diperbarui.', { variant: 'success' });
				} else {
					await createWasteType(currentSiteId, values);
					enqueueSnackbar('Jenis limbah B3 berhasil ditambahkan.', { variant: 'success' });
				}

				setFormOpen(false);
				setSelectedItem(null);
				resetForm();
				fetchData();
			} catch (err) {
				if (err.status === 409 || err.statusCode === 409) {
					enqueueSnackbar('Kode limbah sudah terdaftar', { variant: 'error' });
				} else {
					enqueueSnackbar(err.message || 'Gagal menyimpan data', { variant: 'error' });
				}
			} finally {
				setSubmitting(false);
			}
		},
	});

	// --- Event Handlers ---

	const handleAdd = () => {
		setSelectedItem(null);
		formik.resetForm({ values: { kode: '', nama: '' } });
		setFormOpen(true);
	};

	const handleEdit = (item) => {
		setSelectedItem(item);
		formik.resetForm({ values: { kode: item.kode, nama: item.nama } });
		setFormOpen(true);
	};

	const handleCloseForm = () => {
		setFormOpen(false);
		setSelectedItem(null);
		formik.resetForm();
	};

	const handleDeleteClick = (item) => {
		setSelectedItem(item);
		setDeleteOpen(true);
	};

	const handleDeleteConfirm = async () => {
		if (!selectedItem) return;

		setSubmitting(true);

		try {
			await deleteWasteType(currentSiteId, selectedItem.id);
			setDeleteOpen(false);
			setSelectedItem(null);
			enqueueSnackbar('Jenis limbah B3 berhasil dihapus.', { variant: 'success' });
			fetchData();
		} catch (err) {
			if (err.status === 409 || err.statusCode === 409) {
				enqueueSnackbar('Data tidak dapat dihapus karena masih digunakan', { variant: 'error' });
			} else {
				enqueueSnackbar(err.message || 'Gagal menghapus data', { variant: 'error' });
			}
		} finally {
			setSubmitting(false);
		}
	};

	// --- Columns ---

	const columns = useMemo(
		() => [
			{
				field: 'kode',
				headerName: 'KODE LIMBAH',
				minWidth: 180,
				sortable: false,
			},
			{
				field: 'nama',
				headerName: 'JENIS LIMBAH B3',
				minWidth: 300,
				flex: 1,
				sortable: false,
			},
		],
		[],
	);

	// --- Render Helper ---

	const renderTableContent = () => {
		if (!currentSiteId) {
			return (
				<Stack py={8} alignItems="center" spacing={1}>
					<Typography variant="subtitle1" fontWeight={600}>
						Pilih site terlebih dahulu
					</Typography>
					<Typography variant="body2" color="text.secondary">
						Silakan pilih site pada selektor di bagian atas.
					</Typography>
				</Stack>
			);
		}

		if (loading) {
			return (
				<Stack alignItems="center" justifyContent="center" py={10}>
					<CircularProgress />
				</Stack>
			);
		}

		if (filteredRows.length === 0) {
			return (
				<Stack py={8} alignItems="center" spacing={1}>
					<Typography variant="subtitle1" fontWeight={600}>
						Belum ada data
					</Typography>
					<Typography variant="body2" color="text.secondary">
						Tambahkan data pertama untuk mulai menggunakan master ini.
					</Typography>
				</Stack>
			);
		}

		return (
			<EnhancedTable
				rows={filteredRows}
				columns={columns}
				columnResizeKey="master-data-jenis-limbah-b3-table"
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
				height={480}
			/>
		);
	};

	// --- Render ---

	return (
		<>
			<Card type="section" sx={{ minHeight: '60vh', p: 3 }}>
				<CardHeader
					title="JENIS LIMBAH B3"
					subtitle="Kelola daftar jenis limbah B3 untuk digunakan pada pencatatan limbah."
					size="small"
					sx={{ mb: 2.5, alignItems: 'flex-start', gap: 1.5 }}
				>
					<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
						<TextField
							size="small"
							label="Cari Data"
							value={searchKeyword}
							onChange={(event) => setSearchKeyword(event.target.value)}
							placeholder="Kode limbah, jenis limbah..."
							sx={{ minWidth: { xs: '100%', md: 320 } }}
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<SearchOutlinedIcon fontSize="small" />
									</InputAdornment>
								),
							}}
						/>
						<Button variant="contained" startIcon={<AddOutlinedIcon />} onClick={handleAdd}>
							Tambah Data
						</Button>
					</Stack>
				</CardHeader>

				{renderTableContent()}
			</Card>

			{/* Form Dialog */}
			<Dialog open={formOpen} onClose={submitting ? undefined : handleCloseForm} fullWidth maxWidth="sm">
				<form onSubmit={formik.handleSubmit}>
					<DialogTitle>{isEditMode ? 'Edit Jenis Limbah B3' : 'Tambah Jenis Limbah B3'}</DialogTitle>
					<DialogContent>
						<Stack spacing={2.5} sx={{ mt: 1 }}>
							<TextField
								fullWidth
								label="Kode Limbah"
								name="kode"
								value={formik.values.kode}
								onChange={formik.handleChange}
								onBlur={formik.handleBlur}
								error={formik.touched.kode && Boolean(formik.errors.kode)}
								helperText={formik.touched.kode && formik.errors.kode}
								disabled={isEditMode}
								inputProps={{ maxLength: 20 }}
							/>
							<TextField
								fullWidth
								label="Jenis Limbah B3"
								name="nama"
								value={formik.values.nama}
								onChange={formik.handleChange}
								onBlur={formik.handleBlur}
								error={formik.touched.nama && Boolean(formik.errors.nama)}
								helperText={formik.touched.nama && formik.errors.nama}
								inputProps={{ maxLength: 200 }}
							/>
						</Stack>
					</DialogContent>
					<DialogActions sx={{ px: 3, pb: 3 }}>
						<Button onClick={handleCloseForm} disabled={submitting} color="inherit">
							Batal
						</Button>
						<Button type="submit" variant="contained" disabled={submitting}>
							{submitting ? 'Menyimpan...' : 'Simpan'}
						</Button>
					</DialogActions>
				</form>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<DeleteConfirmDialog
				open={deleteOpen}
				loading={submitting}
				title="Jenis Limbah B3"
				itemName={selectedItem ? `${selectedItem.kode} - ${selectedItem.nama}` : ''}
				onClose={() => {
					setDeleteOpen(false);
					setSelectedItem(null);
				}}
				onConfirm={handleDeleteConfirm}
			/>
		</>
	);
}

export default JenisLimbahB3Tab;
