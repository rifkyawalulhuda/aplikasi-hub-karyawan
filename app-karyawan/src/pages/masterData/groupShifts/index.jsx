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
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';

import CardHeader from '@/components/cardHeader';
import DeleteConfirmDialog from '@/components/masterData/deleteConfirmDialog';
import PageHeader from '@/components/pageHeader';
import apiRequest, { downloadFile, getApiBaseUrl } from '@/services/api';

import GroupShiftFormDialog from './groupShiftFormDialog';
import GroupShiftImportDialog from './groupShiftImportDialog';
import GroupShiftTable from './groupShiftTable';

async function fetchGroupShifts() {
	return apiRequest('/master/group-shifts');
}

async function fetchEmployeeOptions() {
	return apiRequest('/master/employees');
}

function sortEmployeeOptions(items = []) {
	return items.slice().sort((left, right) => {
		const leftName = String(left.fullName || '').toLowerCase();
		const rightName = String(right.fullName || '').toLowerCase();

		if (leftName !== rightName) {
			return leftName.localeCompare(rightName);
		}

		return left.id - right.id;
	});
}

function GroupShiftsPage() {
	const { enqueueSnackbar } = useSnackbar();
	const [rows, setRows] = useState([]);
	const [employeeOptions, setEmployeeOptions] = useState([]);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [formOpen, setFormOpen] = useState(false);
	const [importOpen, setImportOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [selectedItem, setSelectedItem] = useState(null);
	const [searchKeyword, setSearchKeyword] = useState('');

	const refreshPageData = async () => {
		const [groupShifts, employees] = await Promise.all([fetchGroupShifts(), fetchEmployeeOptions()]);
		setRows(groupShifts);
		setEmployeeOptions(sortEmployeeOptions(employees));
	};

	useEffect(() => {
		const init = async () => {
			setLoading(true);

			try {
				await refreshPageData();
			} catch (error) {
				enqueueSnackbar(error.message, { variant: 'error' });
			} finally {
				setLoading(false);
			}
		};

		init();
	}, [enqueueSnackbar]);

	const foremanOptions = useMemo(
		() =>
			employeeOptions.filter(
				(item) =>
					String(item.jobLevelName || '')
						.trim()
						.toLowerCase() === 'foreman',
			),
		[employeeOptions],
	);

	const normalizedKeyword = searchKeyword.trim().toLowerCase();
	const filteredRows = rows.filter((row) => {
		if (!normalizedKeyword) {
			return true;
		}

		const searchableValues = [row.id, row.groupShiftName, row.foremanNames, row.employeeNames];

		return searchableValues.some((value) =>
			String(value || '')
				.toLowerCase()
				.includes(normalizedKeyword),
		);
	});

	const closeFormDialog = () => {
		setFormOpen(false);
		setSelectedItem(null);
	};

	const closeDeleteDialog = () => {
		setDeleteOpen(false);
		setSelectedItem(null);
	};

	const handleSubmit = async (values) => {
		setSubmitting(true);

		try {
			if (selectedItem) {
				await apiRequest(`/master/group-shifts/${selectedItem.id}`, {
					method: 'PUT',
					body: JSON.stringify(values),
				});
			} else {
				await apiRequest('/master/group-shifts', {
					method: 'POST',
					body: JSON.stringify(values),
				});
			}

			await refreshPageData();
			closeFormDialog();
			enqueueSnackbar(`Master Group Shift berhasil ${selectedItem ? 'diperbarui' : 'ditambahkan'}.`, {
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
			await apiRequest(`/master/group-shifts/${selectedItem.id}`, {
				method: 'DELETE',
			});
			await refreshPageData();
			closeDeleteDialog();
			enqueueSnackbar('Master Group Shift berhasil dihapus.', { variant: 'error' });
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

			const response = await apiRequest('/master/group-shifts/import', {
				method: 'POST',
				body: formData,
			});

			await refreshPageData();
			setImportOpen(false);

			if (response.errorReportUrl) {
				await downloadFile(
					`${getApiBaseUrl()}${response.errorReportUrl}`,
					'master-group-shifts-import-errors.xlsx',
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
			<PageHeader title="Master Group Shift">
				<Breadcrumbs aria-label="breadcrumb" sx={{ textTransform: 'uppercase' }}>
					<Link underline="hover" href="#!">
						Data Master
					</Link>
					<Typography color="text.tertiary">Master Data Karyawan</Typography>
					<Typography color="text.tertiary">Master Group Shift</Typography>
				</Breadcrumbs>
			</PageHeader>
			<Card sx={{ minHeight: '60vh', p: 3 }}>
				<CardHeader
					title="Master Group Shift"
					subtitle="Kelola daftar group shift, foreman, dan assignment karyawan yang terhubung ke masing-masing group."
					size="small"
					sx={{ mb: 2.5, alignItems: 'flex-start', gap: 1.5 }}
				>
					<Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5} alignItems={{ lg: 'center' }}>
						<TextField
							size="small"
							label="Cari Data"
							value={searchKeyword}
							onChange={(event) => setSearchKeyword(event.target.value)}
							placeholder="Nama group shift, foreman, karyawan..."
							sx={{ minWidth: { xs: '100%', lg: 360 } }}
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<SearchOutlinedIcon fontSize="small" />
									</InputAdornment>
								),
							}}
						/>
						<Stack direction="row" spacing={1} flexWrap="wrap">
							<Button
								variant="outlined"
								startIcon={<UploadFileOutlinedIcon />}
								onClick={() => setImportOpen(true)}
							>
								Import Excel
							</Button>
							<Button
								variant="contained"
								startIcon={<AddOutlinedIcon />}
								onClick={() => setFormOpen(true)}
							>
								Tambah Data
							</Button>
						</Stack>
					</Stack>
				</CardHeader>
				{loading ? (
					<Stack alignItems="center" justifyContent="center" py={10}>
						<CircularProgress />
					</Stack>
				) : (
					<GroupShiftTable
						rows={filteredRows}
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
			<GroupShiftFormDialog
				open={formOpen}
				loading={submitting}
				initialValue={selectedItem}
				foremanOptions={foremanOptions}
				employeeOptions={employeeOptions}
				onClose={closeFormDialog}
				onSubmit={handleSubmit}
			/>
			<GroupShiftImportDialog
				open={importOpen}
				loading={submitting}
				onClose={() => setImportOpen(false)}
				onImport={handleImport}
			/>
			<DeleteConfirmDialog
				open={deleteOpen}
				loading={submitting}
				title="Master Group Shift"
				itemName={selectedItem?.groupShiftName}
				onClose={closeDeleteDialog}
				onConfirm={handleDelete}
			/>
		</>
	);
}

export default GroupShiftsPage;
