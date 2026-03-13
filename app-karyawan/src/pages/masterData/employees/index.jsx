import { useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';

import Breadcrumbs from '@mui/material/Breadcrumbs';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CircularProgress from '@mui/material/CircularProgress';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';

import CardHeader from '@/components/cardHeader';
import DeleteConfirmDialog from '@/components/masterData/deleteConfirmDialog';
import PageHeader from '@/components/pageHeader';
import apiRequest, { getApiBaseUrl } from '@/services/api';

import EmployeeFormDialog from './employeeFormDialog';
import EmployeeImportDialog from './employeeImportDialog';
import EmployeeTable from './employeeTable';

async function fetchEmployees() {
	return apiRequest('/master/employees');
}

async function fetchLookupOptions() {
	const [departments, workLocations, jobRoles, jobLevels] = await Promise.all([
		apiRequest('/master/departments'),
		apiRequest('/master/work-locations'),
		apiRequest('/master/job-roles'),
		apiRequest('/master/job-levels'),
	]);

	return { departments, workLocations, jobRoles, jobLevels };
}

function EmployeesPage() {
	const { enqueueSnackbar } = useSnackbar();
	const [rows, setRows] = useState([]);
	const [options, setOptions] = useState({
		departments: [],
		workLocations: [],
		jobRoles: [],
		jobLevels: [],
	});
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [formOpen, setFormOpen] = useState(false);
	const [importOpen, setImportOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [selectedItem, setSelectedItem] = useState(null);

	useEffect(() => {
		const init = async () => {
			setLoading(true);

			try {
				const [employees, lookupOptions] = await Promise.all([fetchEmployees(), fetchLookupOptions()]);
				setRows(employees);
				setOptions(lookupOptions);
			} catch (error) {
				enqueueSnackbar(error.message, { variant: 'error' });
			} finally {
				setLoading(false);
			}
		};

		init();
	}, []);

	const closeFormDialog = () => {
		setFormOpen(false);
		setSelectedItem(null);
	};

	const closeDeleteDialog = () => {
		setDeleteOpen(false);
		setSelectedItem(null);
	};

	const mergeImportedRows = (importedRows) => {
		setRows((currentRows) => {
			const mergedRows = [...currentRows];

			importedRows.forEach((row) => {
				const existingIndex = mergedRows.findIndex((item) => item.id === row.id);

				if (existingIndex >= 0) {
					mergedRows[existingIndex] = row;
				} else {
					mergedRows.push(row);
				}
			});

			return mergedRows.sort((a, b) => a.id - b.id);
		});
	};

	const handleSubmit = async (values) => {
		setSubmitting(true);

		try {
			let savedItem;

			if (selectedItem) {
				savedItem = await apiRequest(`/master/employees/${selectedItem.id}`, {
					method: 'PUT',
					body: JSON.stringify(values),
				});
			} else {
				savedItem = await apiRequest('/master/employees', {
					method: 'POST',
					body: JSON.stringify(values),
				});
			}

			setRows((currentRows) => {
				if (selectedItem) {
					return currentRows.map((item) => (item.id === savedItem.id ? savedItem : item));
				}

				return [...currentRows, savedItem].sort((a, b) => a.id - b.id);
			});
			closeFormDialog();
			enqueueSnackbar(`Master Karyawan berhasil ${selectedItem ? 'diperbarui' : 'ditambahkan'}.`, {
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
			await apiRequest(`/master/employees/${selectedItem.id}`, {
				method: 'DELETE',
			});
			setRows((currentRows) => currentRows.filter((item) => item.id !== selectedItem.id));
			closeDeleteDialog();
			enqueueSnackbar('Master Karyawan berhasil dihapus.', { variant: 'error' });
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

			const response = await apiRequest('/master/employees/import', {
				method: 'POST',
				body: formData,
			});

			if (response.rows?.length) {
				mergeImportedRows(response.rows);
			}

			setImportOpen(false);

			if (response.errorReportUrl) {
				const downloadUrl = `${getApiBaseUrl()}${response.errorReportUrl}`;
				const link = document.createElement('a');
				link.href = downloadUrl;
				link.target = '_blank';
				link.rel = 'noreferrer';
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);

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
			<PageHeader title="Master Karyawan">
				<Breadcrumbs aria-label="breadcrumb" sx={{ textTransform: 'uppercase' }}>
					<Link underline="hover" href="#!">
						Data Master
					</Link>
					<Typography color="text.tertiary">Master Data Karyawan</Typography>
					<Typography color="text.tertiary">Master Karyawan</Typography>
				</Breadcrumbs>
			</PageHeader>
			<Card sx={{ minHeight: '60vh', p: 3 }}>
				<CardHeader
					title="Master Karyawan"
					subtitle="Kelola data induk karyawan berdasarkan struktur file Excel master karyawan."
					size="small"
				>
					<Stack direction="row" spacing={1} flexWrap="wrap">
						<Button
							component="a"
							href="/templates/master-karyawan-import-template.xlsx"
							download
							variant="outlined"
							startIcon={<DownloadOutlinedIcon />}
						>
							Download Template
						</Button>
						<Button
							variant="outlined"
							startIcon={<UploadFileOutlinedIcon />}
							onClick={() => setImportOpen(true)}
						>
							Import Excel
						</Button>
						<Button variant="contained" startIcon={<AddOutlinedIcon />} onClick={() => setFormOpen(true)}>
							Tambah Data
						</Button>
					</Stack>
				</CardHeader>
				{loading ? (
					<Stack alignItems="center" justifyContent="center" py={10}>
						<CircularProgress />
					</Stack>
				) : (
					<EmployeeTable
						rows={rows}
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
			<EmployeeFormDialog
				open={formOpen}
				loading={submitting}
				initialValue={selectedItem}
				options={options}
				onClose={closeFormDialog}
				onSubmit={handleSubmit}
			/>
			<EmployeeImportDialog
				open={importOpen}
				loading={submitting}
				onClose={() => setImportOpen(false)}
				onImport={handleImport}
			/>
			<DeleteConfirmDialog
				open={deleteOpen}
				loading={submitting}
				title="Master Karyawan"
				itemName={selectedItem?.fullName}
				onClose={closeDeleteDialog}
				onConfirm={handleDelete}
			/>
		</>
	);
}

export default EmployeesPage;
