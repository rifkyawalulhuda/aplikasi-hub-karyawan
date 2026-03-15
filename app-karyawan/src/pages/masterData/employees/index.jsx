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
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';

import CardHeader from '@/components/cardHeader';
import DeleteConfirmDialog from '@/components/masterData/deleteConfirmDialog';
import PageHeader from '@/components/pageHeader';
import apiRequest, { getApiBaseUrl } from '@/services/api';
import { formatEmploymentTypeLabel, formatGradeLabel } from '@/constants/employeeMaster';

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

function formatEmployeeDate(value) {
	if (!value) {
		return '';
	}

	const raw = String(value).trim();
	const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);

	if (isoMatch) {
		const [, year, month, day] = isoMatch;
		return `${day}/${month}/${year}`;
	}

	return raw;
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

	const handleExportExcel = async () => {
		if (filteredRows.length === 0) {
			enqueueSnackbar('Tidak ada data master karyawan untuk diexport.', { variant: 'error' });
			return;
		}

		const ExcelJS = await import('exceljs');
		const Workbook = ExcelJS.Workbook || ExcelJS.default?.Workbook;
		const workbook = new Workbook();
		const worksheet = workbook.addWorksheet('Master Karyawan');

		worksheet.columns = [
			{ header: 'NO', key: 'id', width: 10 },
			{ header: 'Employee No', key: 'employeeNo', width: 18 },
			{ header: 'Password', key: 'password', width: 18 },
			{ header: 'Fullname', key: 'fullName', width: 28 },
			{ header: 'Employment Type', key: 'employmentType', width: 18 },
			{ header: 'Site / Div', key: 'siteDiv', width: 14 },
			{ header: 'Department', key: 'departmentName', width: 20 },
			{ header: 'Length Of Service', key: 'lengthOfService', width: 20 },
			{ header: 'Age', key: 'age', width: 10 },
			{ header: 'Birth Date', key: 'birthDate', width: 14 },
			{ header: 'Gender', key: 'gender', width: 12 },
			{ header: 'Work Location', key: 'workLocationName', width: 22 },
			{ header: 'Job Role', key: 'jobRoleName', width: 18 },
			{ header: 'Job Level', key: 'jobLevelName', width: 18 },
			{ header: 'Education Level', key: 'educationLevel', width: 18 },
			{ header: 'Grade', key: 'grade', width: 12 },
			{ header: 'Join Date', key: 'joinDate', width: 14 },
			{ header: 'Phone Number', key: 'phoneNumber', width: 18 },
			{ header: 'Email', key: 'email', width: 28 },
		];

		worksheet.getRow(1).font = { bold: true };
		worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

		filteredRows.forEach((row) => {
			worksheet.addRow({
				id: row.id,
				employeeNo: row.employeeNo,
				password: row.password,
				fullName: row.fullName,
				employmentType: formatEmploymentTypeLabel(row.employmentType),
				siteDiv: row.siteDiv,
				departmentName: row.departmentName,
				lengthOfService: row.lengthOfService,
				age: row.age,
				birthDate: formatEmployeeDate(row.birthDate),
				gender: row.gender,
				workLocationName: row.workLocationName,
				jobRoleName: row.jobRoleName,
				jobLevelName: row.jobLevelName,
				educationLevel: row.educationLevel,
				grade: formatGradeLabel(row.grade),
				joinDate: formatEmployeeDate(row.joinDate),
				phoneNumber: row.phoneNumber,
				email: row.email || '',
			});
		});

		worksheet.eachRow((row, rowNumber) => {
			const targetRow = row;

			targetRow.alignment = {
				vertical: rowNumber === 1 ? 'middle' : 'top',
				horizontal: rowNumber === 1 ? 'center' : 'left',
				wrapText: true,
			};

			if (rowNumber === 1) {
				targetRow.fill = {
					type: 'pattern',
					pattern: 'solid',
					fgColor: { argb: 'DDE4EE' },
				};
			}
		});

		const buffer = await workbook.xlsx.writeBuffer();
		const blob = new Blob([buffer], {
			type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		});
		const url = window.URL.createObjectURL(blob);
		const link = document.createElement('a');

		link.href = url;
		link.download = 'master-karyawan.xlsx';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		window.URL.revokeObjectURL(url);
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
							<Button variant="outlined" startIcon={<DownloadOutlinedIcon />} onClick={handleExportExcel}>
								Export Excel
							</Button>
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
