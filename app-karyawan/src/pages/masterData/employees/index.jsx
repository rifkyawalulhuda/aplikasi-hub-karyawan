import { useEffect, useState } from 'react';
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
	const [searchKeyword, setSearchKeyword] = useState('');

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

	const normalizedKeyword = searchKeyword.trim().toLowerCase();
	const filteredRows = rows.filter((row) => {
		if (!normalizedKeyword) {
			return true;
		}

		const searchableValues = [
			row.id,
			row.employeeNo,
			row.fullName,
			row.employmentType,
			row.siteDiv,
			row.departmentName,
			row.lengthOfService,
			row.age,
			row.birthDate,
			row.gender,
			row.workLocationName,
			row.jobRoleName,
			row.jobLevelName,
			row.educationLevel,
			row.grade,
			row.joinDate,
			row.phoneNumber,
			row.email,
		];

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
					sx={{ mb: 2.5, alignItems: 'flex-start', gap: 1.5 }}
				>
					<Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5} alignItems={{ lg: 'center' }}>
						<TextField
							size="small"
							label="Cari Data"
							value={searchKeyword}
							onChange={(event) => setSearchKeyword(event.target.value)}
							placeholder="Nama, NIK, department, lokasi..."
							sx={{ minWidth: { xs: '100%', lg: 340 } }}
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
					<EmployeeTable
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
