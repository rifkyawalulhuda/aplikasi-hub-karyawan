import { useEffect, useMemo, useState } from 'react';
import { useSnackbar } from 'notistack';

import Breadcrumbs from '@mui/material/Breadcrumbs';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';

import CardHeader from '@/components/cardHeader';
import DeleteConfirmDialog from '@/components/masterData/deleteConfirmDialog';
import MasterDataImportDialog from '@/components/masterData/masterDataImportDialog';
import PageHeader from '@/components/pageHeader';
import apiRequest, { getApiBaseUrl } from '@/services/api';

import EmployeeLeaveDetailDialog from './employeeLeaveDetailDialog';
import EmployeeLeaveFormDialog from './employeeLeaveFormDialog';
import EmployeeLeaveTable from './employeeLeaveTable';

async function fetchLeaveDatabase() {
	return apiRequest('/data-karyawan/employee-leave-database');
}

async function fetchEmployeeOptions() {
	return apiRequest('/master/employees');
}

async function fetchLeaveTypeOptions() {
	return apiRequest('/master/master-cuti-karyawan');
}

function EmployeeLeavesPage() {
	const { enqueueSnackbar } = useSnackbar();
	const [rows, setRows] = useState([]);
	const [employeeOptions, setEmployeeOptions] = useState([]);
	const [leaveTypeOptions, setLeaveTypeOptions] = useState([]);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [formOpen, setFormOpen] = useState(false);
	const [importOpen, setImportOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [detailOpen, setDetailOpen] = useState(false);
	const [detailLoading, setDetailLoading] = useState(false);
	const [detailItem, setDetailItem] = useState(null);
	const [selectedItem, setSelectedItem] = useState(null);
	const [searchKeyword, setSearchKeyword] = useState('');

	const loadData = async () => {
		setLoading(true);

		try {
			const [leaveDatabase, employees, leaveTypes] = await Promise.all([
				fetchLeaveDatabase(),
				fetchEmployeeOptions(),
				fetchLeaveTypeOptions(),
			]);

			setRows(leaveDatabase);
			setEmployeeOptions(employees);
			setLeaveTypeOptions(leaveTypes);
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
				row.employeeName,
				row.employeeNo,
				row.leaveType,
				row.leaveDays,
				row.periodStart,
				row.periodEnd,
				row.remainingLeave,
				row.notes,
				row.year,
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

	const closeDetailDialog = () => {
		setDetailOpen(false);
		setDetailLoading(false);
		setDetailItem(null);
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

			return mergedRows.sort((left, right) => right.id - left.id);
		});
	};

	const handleImport = async (file) => {
		setSubmitting(true);

		try {
			const formData = new FormData();
			formData.append('file', file);

			const response = await apiRequest('/data-karyawan/employee-leave-database/import', {
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
			enqueueSnackbar('Tidak ada database cuti karyawan untuk diexport.', { variant: 'error' });
			return;
		}

		const formatExcelDate = (value) => {
			if (!value) {
				return '';
			}

			const raw = String(value);
			const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);

			if (isoMatch) {
				const [, year, month, day] = isoMatch;
				return `${day}/${month}/${year}`;
			}

			return raw;
		};

		const ExcelJS = await import('exceljs');
		const Workbook = ExcelJS.Workbook || ExcelJS.default?.Workbook;
		const workbook = new Workbook();
		const worksheet = workbook.addWorksheet('Database Cuti');

		worksheet.columns = [
			{ header: 'NO', key: 'id', width: 10 },
			{ header: 'Nama Karyawan', key: 'employeeName', width: 28 },
			{ header: 'NIK', key: 'employeeNo', width: 18 },
			{ header: 'Jenis Cuti', key: 'leaveType', width: 22 },
			{ header: 'Jumlah Cuti', key: 'leaveDays', width: 14 },
			{ header: 'Periode Dari', key: 'periodStart', width: 16 },
			{ header: 'Periode Sampai', key: 'periodEnd', width: 16 },
			{ header: 'Sisa Cuti', key: 'remainingLeave', width: 14 },
			{ header: 'Catatan', key: 'notes', width: 36 },
		];

		worksheet.getRow(1).font = { bold: true };
		worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

		filteredRows.forEach((row) => {
			worksheet.addRow({
				id: row.id,
				employeeName: row.employeeName,
				employeeNo: row.employeeNo,
				leaveType: row.leaveType,
				leaveDays: row.leaveDays,
				periodStart: formatExcelDate(row.periodStart),
				periodEnd: formatExcelDate(row.periodEnd),
				remainingLeave: row.remainingLeave,
				notes: row.notes || '',
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
		link.download = 'database-cuti-karyawan.xlsx';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		window.URL.revokeObjectURL(url);
	};

	const handleSubmit = async (values) => {
		setSubmitting(true);

		try {
			const savedItem = await apiRequest(
				selectedItem
					? `/data-karyawan/employee-leave-database/${selectedItem.id}`
					: '/data-karyawan/employee-leave-database',
				{
					method: selectedItem ? 'PUT' : 'POST',
					body: JSON.stringify(values),
				},
			);

			setRows((currentRows) => {
				if (selectedItem) {
					return currentRows.map((item) => (item.id === savedItem.id ? savedItem : item));
				}

				return [savedItem, ...currentRows];
			});

			closeFormDialog();
			enqueueSnackbar(`Database cuti karyawan berhasil ${selectedItem ? 'diperbarui' : 'ditambahkan'}.`, {
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
			await apiRequest(`/data-karyawan/employee-leave-database/${selectedItem.id}`, {
				method: 'DELETE',
			});
			setRows((currentRows) => currentRows.filter((item) => item.id !== selectedItem.id));
			setDeleteOpen(false);
			setSelectedItem(null);
			enqueueSnackbar('Database cuti karyawan berhasil dihapus.', { variant: 'success' });
		} catch (error) {
			enqueueSnackbar(error.message, { variant: 'error' });
		} finally {
			setSubmitting(false);
		}
	};

	const handleOpenDetail = async (item) => {
		setDetailOpen(true);
		setDetailLoading(true);
		setDetailItem(null);

		try {
			const detail = await apiRequest(`/data-karyawan/employee-leave-database/${item.id}`);
			setDetailItem(detail);
		} catch (error) {
			setDetailOpen(false);
			enqueueSnackbar(error.message, { variant: 'error' });
		} finally {
			setDetailLoading(false);
		}
	};

	return (
		<>
			<PageHeader title="Data Cuti Karyawan">
				<Breadcrumbs aria-label="breadcrumb" sx={{ textTransform: 'uppercase' }}>
					<Link underline="hover" href="#!">
						Data Karyawan
					</Link>
					<Typography color="text.tertiary">Data Cuti Karyawan</Typography>
				</Breadcrumbs>
			</PageHeader>
			<Card sx={{ minHeight: '60vh', p: 3 }}>
				<CardHeader
					title="Data Cuti Karyawan"
					subtitle="Kelola database cuti karyawan sebagai sumber saldo dan histori admin."
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
							placeholder="Nama, NIK, jenis cuti, catatan..."
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
							startIcon={<DownloadOutlinedIcon />}
							onClick={handleExportExcel}
							sx={{ minWidth: 170, whiteSpace: 'nowrap' }}
						>
							Export Excel
						</Button>
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
					<EmployeeLeaveTable
						rows={filteredRows}
						onDetail={handleOpenDetail}
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
			<EmployeeLeaveFormDialog
				open={formOpen}
				loading={submitting}
				initialValue={selectedItem}
				employeeOptions={employeeOptions}
				leaveTypeOptions={leaveTypeOptions}
				onClose={closeFormDialog}
				onSubmit={handleSubmit}
			/>
			<EmployeeLeaveDetailDialog
				open={detailOpen}
				loading={detailLoading}
				data={detailItem}
				onClose={closeDetailDialog}
			/>
			<MasterDataImportDialog
				open={importOpen}
				loading={submitting}
				title="Import Database Cuti Karyawan"
				description="Unduh template Excel resmi, isi data database cuti karyawan, lalu upload file `.xlsx` untuk import bulk ke database admin."
				templateHref={`${getApiBaseUrl()}/data-karyawan/employee-leave-database/import-template`}
				onClose={() => setImportOpen(false)}
				onImport={handleImport}
			/>
			<DeleteConfirmDialog
				open={deleteOpen}
				loading={submitting}
				title="Data Cuti Karyawan"
				itemName={selectedItem?.employeeName}
				onClose={() => {
					setDeleteOpen(false);
					setSelectedItem(null);
				}}
				onConfirm={handleDelete}
			/>
		</>
	);
}

export default EmployeeLeavesPage;
