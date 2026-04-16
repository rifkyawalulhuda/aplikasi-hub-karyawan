import { useEffect, useMemo, useState } from 'react';
import { useSnackbar } from 'notistack';

import Breadcrumbs from '@mui/material/Breadcrumbs';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';

import CardHeader from '@/components/cardHeader';
import DeleteConfirmDialog from '@/components/masterData/deleteConfirmDialog';
import MasterDataImportDialog from '@/components/masterData/masterDataImportDialog';
import PageHeader from '@/components/pageHeader';
import useUrlSearchKeyword from '@/hooks/useUrlSearchKeyword';
import apiRequest, { downloadFile, getApiBaseUrl } from '@/services/api';

import TrainingRecordDetailDialog from './trainingRecordDetailDialog';
import TrainingRecordFormDialog from './trainingRecordFormDialog';
import TrainingRecordTable from './trainingRecordTable';

async function fetchTrainingRecords() {
	return apiRequest('/data-karyawan/pelatihan-karyawan');
}

async function fetchEmployeeOptions() {
	return apiRequest('/master/employees');
}

function mergeImportedRows(currentRows, importedRows) {
	const mergedRows = [...currentRows];

	importedRows.forEach((row) => {
		const existingIndex = mergedRows.findIndex((item) => item.id === row.id);

		if (existingIndex >= 0) {
			mergedRows[existingIndex] = row;
			return;
		}

		mergedRows.unshift(row);
	});

	return mergedRows.sort((left, right) => right.id - left.id);
}

function TrainingRecordsPage() {
	const { enqueueSnackbar } = useSnackbar();
	const [rows, setRows] = useState([]);
	const [employeeOptions, setEmployeeOptions] = useState([]);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [formOpen, setFormOpen] = useState(false);
	const [importOpen, setImportOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [detailOpen, setDetailOpen] = useState(false);
	const [detailItem, setDetailItem] = useState(null);
	const [selectedItem, setSelectedItem] = useState(null);
	const [searchKeyword, setSearchKeyword] = useUrlSearchKeyword();

	const loadData = async () => {
		setLoading(true);

		try {
			const [data, employees] = await Promise.all([fetchTrainingRecords(), fetchEmployeeOptions()]);
			setRows(data);
			setEmployeeOptions(employees);
		} catch (error) {
			enqueueSnackbar(error.message, { variant: 'error' });
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadData();
	}, [enqueueSnackbar]);

	const filteredRows = useMemo(() => {
		const normalizedKeyword = searchKeyword.trim().toLowerCase();

		return rows.filter((row) => {
			if (!normalizedKeyword) {
				return true;
			}

			const searchableValues = [
				row.id,
				row.trainingType,
				row.participantSummary,
				row.participantNames?.join(' ; '),
				row.material,
				row.trainerInstitution,
				row.trainerName,
				row.startDate,
				row.endDate,
				row.dayCount,
				row.address,
				row.notes,
			];

			return searchableValues.some((value) =>
				String(value || '')
					.toLowerCase()
					.includes(normalizedKeyword),
			);
		});
	}, [rows, searchKeyword]);

	const closeFormDialog = () => {
		setFormOpen(false);
		setSelectedItem(null);
	};

	const closeDeleteDialog = () => {
		setDeleteOpen(false);
		setSelectedItem(null);
	};

	const closeDetailDialog = () => {
		setDetailOpen(false);
		setDetailItem(null);
	};

	const handleSubmit = async (values) => {
		setSubmitting(true);

		try {
			const payload = {
				trainingType: values.trainingType,
				participantEmployeeIds: values.participantEmployeeIds,
				material: values.material,
				trainerInstitution: values.trainerInstitution,
				trainerName: values.trainerName,
				startDate: values.startDate,
				endDate: values.endDate,
				address: values.address,
				notes: values.notes,
			};

			const savedItem = await apiRequest(
				selectedItem
					? `/data-karyawan/pelatihan-karyawan/${selectedItem.id}`
					: '/data-karyawan/pelatihan-karyawan',
				{
					method: selectedItem ? 'PUT' : 'POST',
					body: JSON.stringify(payload),
				},
			);

			setRows((currentRows) => {
				if (selectedItem) {
					return currentRows.map((item) => (item.id === savedItem.id ? savedItem : item));
				}

				return [savedItem, ...currentRows].sort((left, right) => right.id - left.id);
			});

			closeFormDialog();
			enqueueSnackbar(`Pelatihan Karyawan berhasil ${selectedItem ? 'diperbarui' : 'ditambahkan'}.`, {
				variant: 'success',
			});
		} catch (error) {
			enqueueSnackbar(error.message, { variant: 'error' });
		} finally {
			setSubmitting(false);
		}
	};

	const handleDelete = async () => {
		if (!selectedItem) {
			return;
		}

		setSubmitting(true);

		try {
			await apiRequest(`/data-karyawan/pelatihan-karyawan/${selectedItem.id}`, {
				method: 'DELETE',
			});

			setRows((currentRows) => currentRows.filter((item) => item.id !== selectedItem.id));
			closeDeleteDialog();
			enqueueSnackbar('Data Pelatihan Karyawan berhasil dihapus.', { variant: 'success' });
		} catch (error) {
			enqueueSnackbar(error.message, { variant: 'error' });
		} finally {
			setSubmitting(false);
		}
	};

	const handleImport = async (file) => {
		setSubmitting(true);

		try {
			const formData = new FormData();
			formData.append('file', file);

			const response = await apiRequest('/data-karyawan/pelatihan-karyawan/import', {
				method: 'POST',
				body: formData,
			});

			if (response.rows?.length) {
				setRows((currentRows) => mergeImportedRows(currentRows, response.rows));
			}

			setImportOpen(false);

			if (response.errorReportUrl) {
				await downloadFile(
					`${getApiBaseUrl()}${response.errorReportUrl}`,
					'pelatihan-karyawan-import-errors.xlsx',
				);
				enqueueSnackbar(
					`${response.message} Berhasil: ${response.importedCount}, gagal: ${response.failedCount}. File error diunduh otomatis.`,
					{ variant: 'warning' },
				);
			} else {
				enqueueSnackbar(`${response.message} Total import: ${response.importedCount}.`, {
					variant: 'success',
				});
			}

			return true;
		} catch (error) {
			enqueueSnackbar(error.message, { variant: 'error' });
			return false;
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<>
			<PageHeader title="Pelatihan Karyawan">
				<Breadcrumbs aria-label="breadcrumb" sx={{ textTransform: 'uppercase' }}>
					<Link underline="hover" href="#!">
						Data Karyawan
					</Link>
					<Typography color="text.tertiary">Pelatihan Karyawan</Typography>
				</Breadcrumbs>
			</PageHeader>
			<Card sx={{ minHeight: '60vh', p: 3 }}>
				<CardHeader
					title="Pelatihan Karyawan"
					subtitle="Kelola riwayat pelatihan karyawan dengan peserta multiple, trainer, dan periode pelatihan."
					size="small"
					sx={{
						flexDirection: 'column',
						alignItems: 'stretch',
						gap: 2,
						mb: 2.5,
					}}
				>
					<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
						<TextField
							fullWidth
							size="small"
							label="Cari Data"
							value={searchKeyword}
							onChange={(event) => setSearchKeyword(event.target.value)}
							placeholder="Peserta, materi, trainer, alamat..."
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<SearchOutlinedIcon fontSize="small" />
									</InputAdornment>
								),
							}}
						/>
						<Button
							variant="outlined"
							startIcon={<UploadFileOutlinedIcon />}
							onClick={() => setImportOpen(true)}
							sx={{ minWidth: 170, whiteSpace: 'nowrap' }}
						>
							Import Excel
						</Button>
						<Button
							variant="outlined"
							startIcon={<RefreshOutlinedIcon />}
							onClick={loadData}
							sx={{ minWidth: 150, whiteSpace: 'nowrap' }}
						>
							Refresh
						</Button>
						<Button
							variant="contained"
							startIcon={<AddOutlinedIcon />}
							onClick={() => setFormOpen(true)}
							sx={{ minWidth: 170, whiteSpace: 'nowrap' }}
						>
							Tambah Data
						</Button>
					</Stack>
				</CardHeader>
				{loading ? (
					<Stack alignItems="center" justifyContent="center" py={10}>
						<CircularProgress />
					</Stack>
				) : (
					<TrainingRecordTable
						rows={filteredRows}
						onDetail={(item) => {
							setDetailItem(item);
							setDetailOpen(true);
						}}
						onEdit={(item) => {
							setSelectedItem(item);
							setFormOpen(true);
						}}
						onDelete={(item) => {
							setSelectedItem(item);
							setDeleteOpen(true);
						}}
					/>
				)}
			</Card>
			<TrainingRecordFormDialog
				open={formOpen}
				loading={submitting}
				initialValue={selectedItem}
				employeeOptions={employeeOptions}
				onClose={closeFormDialog}
				onSubmit={handleSubmit}
			/>
			<TrainingRecordDetailDialog open={detailOpen} data={detailItem} onClose={closeDetailDialog} />
			<MasterDataImportDialog
				open={importOpen}
				loading={submitting}
				title="Import Pelatihan Karyawan"
				description="Unduh template Excel resmi, isi data pelatihan karyawan, lalu upload file `.xlsx` untuk import bulk ke database admin."
				templateHref={`${getApiBaseUrl()}/data-karyawan/pelatihan-karyawan/import-template`}
				onClose={() => setImportOpen(false)}
				onImport={handleImport}
			/>
			<DeleteConfirmDialog
				open={deleteOpen}
				loading={submitting}
				title="Pelatihan Karyawan"
				itemName={selectedItem?.participantSummary || selectedItem?.material}
				onClose={closeDeleteDialog}
				onConfirm={handleDelete}
			/>
		</>
	);
}

export default TrainingRecordsPage;
