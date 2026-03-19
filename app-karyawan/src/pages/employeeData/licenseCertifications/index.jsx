import { useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';

import Breadcrumbs from '@mui/material/Breadcrumbs';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import Link from '@mui/material/Link';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';

import CardHeader from '@/components/cardHeader';
import DeleteConfirmDialog from '@/components/masterData/deleteConfirmDialog';
import useUrlSearchKeyword from '@/hooks/useUrlSearchKeyword';
import PageHeader from '@/components/pageHeader';
import apiRequest from '@/services/api';

import LicenseCertificationFormDialog from './licenseCertificationFormDialog';
import LicenseCertificationTable from './licenseCertificationTable';
import { formatLicenseDate, getLicenseStatus, LICENSE_STATUS } from './utils';

async function fetchLicenseCertifications() {
	return apiRequest('/data-karyawan/license-certifications');
}

async function fetchEmployeeOptions() {
	return apiRequest('/master/employees');
}

async function fetchDocumentOptions() {
	return apiRequest('/master/employee-documents');
}

function LicenseCertificationsPage() {
	const { enqueueSnackbar } = useSnackbar();
	const [rows, setRows] = useState([]);
	const [employeeOptions, setEmployeeOptions] = useState([]);
	const [documentOptions, setDocumentOptions] = useState([]);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [formOpen, setFormOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [selectedItem, setSelectedItem] = useState(null);
	const [searchKeyword, setSearchKeyword] = useUrlSearchKeyword();
	const [dateFrom, setDateFrom] = useState('');
	const [dateTo, setDateTo] = useState('');
	const [statusFilter, setStatusFilter] = useState('ALL');
	const [selectedRowIds, setSelectedRowIds] = useState([]);

	useEffect(() => {
		const init = async () => {
			setLoading(true);

			try {
				const [licenseCertifications, employees, documents] = await Promise.all([
					fetchLicenseCertifications(),
					fetchEmployeeOptions(),
					fetchDocumentOptions(),
				]);

				setRows(licenseCertifications);
				setEmployeeOptions(employees);
				setDocumentOptions(documents);
			} catch (error) {
				enqueueSnackbar(error.message, { variant: 'error' });
			} finally {
				setLoading(false);
			}
		};

		init();
	}, [enqueueSnackbar]);

	const normalizedKeyword = searchKeyword.trim().toLowerCase();
	const filteredRows = rows.filter((row) => {
		const matchesDateFrom = dateFrom ? row.expiryDate >= dateFrom : true;
		const matchesDateTo = dateTo ? row.expiryDate <= dateTo : true;
		const matchesStatus = statusFilter === 'ALL' ? true : row.status === statusFilter;

		if (!matchesDateFrom || !matchesDateTo || !matchesStatus) {
			return false;
		}

		if (!normalizedKeyword) {
			return true;
		}

		const searchableValues = [
			row.id,
			row.employeeName,
			row.employeeNo,
			row.documentName,
			row.documentType,
			row.type,
			row.documentNumber,
			row.issuer,
			row.expiryDate,
			row.status,
			row.notes,
		];

		return searchableValues.some((value) =>
			String(value || '')
				.toLowerCase()
				.includes(normalizedKeyword),
		);
	});

	useEffect(() => {
		const filteredRowIdSet = new Set(filteredRows.map((row) => row.id));

		setSelectedRowIds((currentIds) => {
			const nextIds = currentIds.filter((id) => filteredRowIdSet.has(id));

			if (nextIds.length === currentIds.length && nextIds.every((id, index) => id === currentIds[index])) {
				return currentIds;
			}

			return nextIds;
		});
	}, [filteredRows]);

	const selectedRows = filteredRows.filter((row) => selectedRowIds.includes(row.id));
	const allRowsSelected = filteredRows.length > 0 && selectedRows.length === filteredRows.length;
	const someRowsSelected = selectedRows.length > 0 && selectedRows.length < filteredRows.length;

	const closeFormDialog = () => {
		setFormOpen(false);
		setSelectedItem(null);
	};

	const closeDeleteDialog = () => {
		setDeleteOpen(false);
		setSelectedItem(null);
	};

	const handleToggleSelectRow = (id, checked) => {
		setSelectedRowIds((currentIds) => {
			if (checked) {
				return currentIds.includes(id) ? currentIds : [...currentIds, id];
			}

			return currentIds.filter((currentId) => currentId !== id);
		});
	};

	const handleToggleSelectAll = (checked) => {
		setSelectedRowIds(checked ? filteredRows.map((row) => row.id) : []);
	};

	const handleSubmit = async (values) => {
		setSubmitting(true);

		try {
			let savedItem;

			if (selectedItem) {
				savedItem = await apiRequest(`/data-karyawan/license-certifications/${selectedItem.id}`, {
					method: 'PUT',
					body: JSON.stringify(values),
				});
			} else {
				savedItem = await apiRequest('/data-karyawan/license-certifications', {
					method: 'POST',
					body: JSON.stringify(values),
				});
			}

			setRows((currentRows) => {
				if (selectedItem) {
					return currentRows.map((item) => (item.id === savedItem.id ? savedItem : item));
				}

				return [savedItem, ...currentRows];
			});

			closeFormDialog();
			enqueueSnackbar(`Lisensi & Sertifikasi berhasil ${selectedItem ? 'diperbarui' : 'ditambahkan'}.`, {
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
			await apiRequest(`/data-karyawan/license-certifications/${selectedItem.id}`, {
				method: 'DELETE',
			});
			setRows((currentRows) => currentRows.filter((item) => item.id !== selectedItem.id));
			closeDeleteDialog();
			enqueueSnackbar('Data Lisensi & Sertifikasi berhasil dihapus.', { variant: 'error' });
		} catch (error) {
			enqueueSnackbar(error.message, { variant: 'error' });
		} finally {
			setSubmitting(false);
		}
	};

	const handleExportExcel = async () => {
		if (filteredRows.length === 0) {
			enqueueSnackbar('Tidak ada data untuk diexport.', { variant: 'error' });
			return;
		}

		const ExcelJS = await import('exceljs');
		const Workbook = ExcelJS.Workbook || ExcelJS.default?.Workbook;
		const workbook = new Workbook();
		const worksheet = workbook.addWorksheet('Lisensi & Sertifikasi');

		worksheet.columns = [
			{ header: 'NO', key: 'id', width: 10 },
			{ header: 'NAMA', key: 'employeeName', width: 28 },
			{ header: 'NIK', key: 'employeeNo', width: 18 },
			{ header: 'DOKUMEN', key: 'documentName', width: 28 },
			{ header: 'JENIS DOKUMEN', key: 'documentType', width: 20 },
			{ header: 'TYPE', key: 'type', width: 22 },
			{ header: 'NO. DOKUMEN', key: 'documentNumber', width: 24 },
			{ header: 'DITERBITKAN', key: 'issuer', width: 24 },
			{ header: 'MASA BERLAKU', key: 'expiryDate', width: 18 },
			{ header: 'STATUS', key: 'status', width: 14 },
			{ header: 'CATATAN', key: 'notes', width: 40 },
		];

		worksheet.getRow(1).font = { bold: true };
		worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

		filteredRows.forEach((row, index) => {
			worksheet.addRow({
				id: index + 1,
				employeeName: row.employeeName,
				employeeNo: row.employeeNo,
				documentName: row.documentName,
				documentType: row.documentType,
				type: row.type,
				documentNumber: row.documentNumber,
				issuer: row.issuer,
				expiryDate: formatLicenseDate(row.expiryDate),
				status: getLicenseStatus(row.expiryDate),
				notes: row.notes || '',
			});
		});

		worksheet.eachRow((worksheetRow, rowNumber) => {
			const targetRow = worksheetRow;

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
		const fileSuffix = dateFrom || dateTo ? `${dateFrom || 'all'}_${dateTo || 'all'}` : 'all-data';

		link.href = url;
		link.download = `lisensi-sertifikasi-${fileSuffix}.xlsx`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		window.URL.revokeObjectURL(url);
	};

	return (
		<>
			<PageHeader title="Lisensi & Sertifikasi">
				<Breadcrumbs aria-label="breadcrumb" sx={{ textTransform: 'uppercase' }}>
					<Link underline="hover" href="#!">
						Data Karyawan
					</Link>
					<Typography color="text.tertiary">Lisensi & Sertifikasi</Typography>
				</Breadcrumbs>
			</PageHeader>
			<Card sx={{ minHeight: '60vh', p: 3 }}>
				<CardHeader
					title="Lisensi & Sertifikasi"
					subtitle="Kelola data lisensi dan sertifikasi karyawan."
					size="small"
					sx={{
						flexDirection: 'column',
						alignItems: 'stretch',
						gap: 2,
						mb: 2.5,
					}}
				>
					<Grid container spacing={1.5} alignItems="center">
						<Grid item xs={12} md={5} lg={4}>
							<TextField
								fullWidth
								size="small"
								label="Cari Data"
								value={searchKeyword}
								onChange={(event) => setSearchKeyword(event.target.value)}
								placeholder="Nama, NIK, dokumen, penerbit..."
								InputProps={{
									startAdornment: (
										<InputAdornment position="start">
											<SearchOutlinedIcon fontSize="small" />
										</InputAdornment>
									),
								}}
							/>
						</Grid>
						<Grid item xs={12} sm={6} md={3} lg={2}>
							<TextField
								fullWidth
								size="small"
								type="date"
								label="Dari Tanggal"
								value={dateFrom}
								onChange={(event) => setDateFrom(event.target.value)}
								InputLabelProps={{ shrink: true }}
							/>
						</Grid>
						<Grid item xs={12} sm={6} md={3} lg={2}>
							<TextField
								fullWidth
								size="small"
								type="date"
								label="Sampai Tanggal"
								value={dateTo}
								onChange={(event) => setDateTo(event.target.value)}
								InputLabelProps={{ shrink: true }}
							/>
						</Grid>
						<Grid item xs={12} sm={6} md={3} lg={2}>
							<TextField
								fullWidth
								size="small"
								select
								label="Status"
								value={statusFilter}
								onChange={(event) => setStatusFilter(event.target.value)}
							>
								<MenuItem value="ALL">Semua</MenuItem>
								<MenuItem value={LICENSE_STATUS.ACTIVE}>{LICENSE_STATUS.ACTIVE}</MenuItem>
								<MenuItem value={LICENSE_STATUS.EXPIRING_SOON}>{LICENSE_STATUS.EXPIRING_SOON}</MenuItem>
								<MenuItem value={LICENSE_STATUS.EXPIRED}>{LICENSE_STATUS.EXPIRED}</MenuItem>
							</TextField>
						</Grid>
						<Grid item xs={12} md="auto" sx={{ ml: { md: 'auto' } }}>
							<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
								{selectedRows.length > 0 && (
									<Typography
										variant="body2"
										color="text.secondary"
										sx={{ alignSelf: 'center', minWidth: { sm: 120 } }}
									>
										{selectedRows.length} data dipilih
									</Typography>
								)}
								<Button
									variant="outlined"
									startIcon={<DownloadOutlinedIcon />}
									onClick={handleExportExcel}
									sx={{ minWidth: 170, whiteSpace: 'nowrap' }}
								>
									Export Excel
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
						</Grid>
					</Grid>
				</CardHeader>
				{loading ? (
					<Stack alignItems="center" justifyContent="center" py={10}>
						<CircularProgress />
					</Stack>
				) : (
					<LicenseCertificationTable
						rows={filteredRows}
						selectedRowIds={selectedRowIds}
						allRowsSelected={allRowsSelected}
						someRowsSelected={someRowsSelected}
						onToggleSelectAll={handleToggleSelectAll}
						onToggleSelectRow={handleToggleSelectRow}
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
			<LicenseCertificationFormDialog
				open={formOpen}
				loading={submitting}
				initialValue={selectedItem}
				employeeOptions={employeeOptions}
				documentOptions={documentOptions}
				onClose={closeFormDialog}
				onSubmit={handleSubmit}
			/>
			<DeleteConfirmDialog
				open={deleteOpen}
				loading={submitting}
				title="Lisensi & Sertifikasi"
				itemName={selectedItem?.employeeName}
				onClose={closeDeleteDialog}
				onConfirm={handleDelete}
			/>
		</>
	);
}

export default LicenseCertificationsPage;
