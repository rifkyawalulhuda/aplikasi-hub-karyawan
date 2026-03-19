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

import UnitLicenseCertificationFormDialog from './unitLicenseCertificationFormDialog';
import UnitLicenseCertificationTable from './unitLicenseCertificationTable';
import { formatUnitLicenseDate, getUnitLicenseStatus, UNIT_LICENSE_STATUS } from './utils';

async function fetchUnitLicenseCertifications() {
	return apiRequest('/data-unit/license-certifications');
}

async function fetchUnitOptions() {
	return apiRequest('/master/master-units');
}

async function fetchVendorOptions() {
	return apiRequest('/master/master-vendors');
}

function UnitLicenseCertificationsPage() {
	const { enqueueSnackbar } = useSnackbar();
	const [rows, setRows] = useState([]);
	const [unitOptions, setUnitOptions] = useState([]);
	const [vendorOptions, setVendorOptions] = useState([]);
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
				const [certifications, units, vendors] = await Promise.all([
					fetchUnitLicenseCertifications(),
					fetchUnitOptions(),
					fetchVendorOptions(),
				]);

				setRows(certifications);
				setUnitOptions(units);
				setVendorOptions(vendors);
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
			row.unitName,
			row.assetNo,
			row.unitType,
			row.capacity,
			row.unitSerialNumber,
			row.documentNumber,
			row.issuedBy,
			row.vendorName,
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
				savedItem = await apiRequest(`/data-unit/license-certifications/${selectedItem.id}`, {
					method: 'PUT',
					body: JSON.stringify(values),
				});
			} else {
				savedItem = await apiRequest('/data-unit/license-certifications', {
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
			enqueueSnackbar(`Lisensi & Sertifikasi Unit berhasil ${selectedItem ? 'diperbarui' : 'ditambahkan'}.`, {
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
			await apiRequest(`/data-unit/license-certifications/${selectedItem.id}`, {
				method: 'DELETE',
			});
			setRows((currentRows) => currentRows.filter((item) => item.id !== selectedItem.id));
			closeDeleteDialog();
			enqueueSnackbar('Data Lisensi & Sertifikasi Unit berhasil dihapus.', { variant: 'error' });
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
		const worksheet = workbook.addWorksheet('Lisensi & Sertifikasi Unit');

		worksheet.columns = [
			{ header: 'NO', key: 'id', width: 10 },
			{ header: 'NAMA UNIT', key: 'unitName', width: 28 },
			{ header: 'ASSET NO', key: 'assetNo', width: 18 },
			{ header: 'JENIS UNIT', key: 'unitType', width: 18 },
			{ header: 'KAPASITAS', key: 'capacity', width: 16 },
			{ header: 'UNIT/SERIAL NUMBER', key: 'unitSerialNumber', width: 24 },
			{ header: 'NO. DOKUMEN', key: 'documentNumber', width: 24 },
			{ header: 'DITERBITKAN', key: 'issuedBy', width: 24 },
			{ header: 'VENDOR PENGURUS', key: 'vendorName', width: 24 },
			{ header: 'MASA BERLAKU', key: 'expiryDate', width: 18 },
			{ header: 'STATUS', key: 'status', width: 16 },
			{ header: 'CATATAN', key: 'notes', width: 40 },
		];

		worksheet.getRow(1).font = { bold: true };
		worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

		filteredRows.forEach((row, index) => {
			worksheet.addRow({
				id: index + 1,
				unitName: row.unitName,
				assetNo: row.assetNo,
				unitType: row.unitType,
				capacity: row.capacity,
				unitSerialNumber: row.unitSerialNumber,
				documentNumber: row.documentNumber,
				issuedBy: row.issuedBy,
				vendorName: row.vendorName,
				expiryDate: formatUnitLicenseDate(row.expiryDate),
				status: getUnitLicenseStatus(row.expiryDate),
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
		link.download = `lisensi-sertifikasi-unit-${fileSuffix}.xlsx`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		window.URL.revokeObjectURL(url);
	};

	return (
		<>
			<PageHeader title="Lisensi & Sertifikasi Unit">
				<Breadcrumbs aria-label="breadcrumb" sx={{ textTransform: 'uppercase' }}>
					<Link underline="hover" href="#!">
						Data Unit
					</Link>
					<Typography color="text.tertiary">Lisensi & Sertifikasi Unit</Typography>
				</Breadcrumbs>
			</PageHeader>
			<Card sx={{ minHeight: '60vh', p: 3 }}>
				<CardHeader
					title="Lisensi & Sertifikasi Unit"
					subtitle="Kelola data lisensi dan sertifikasi unit."
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
								placeholder="Nama unit, asset no, vendor, dokumen..."
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
								<MenuItem value={UNIT_LICENSE_STATUS.ACTIVE}>{UNIT_LICENSE_STATUS.ACTIVE}</MenuItem>
								<MenuItem value={UNIT_LICENSE_STATUS.EXPIRING_SOON}>
									{UNIT_LICENSE_STATUS.EXPIRING_SOON}
								</MenuItem>
								<MenuItem value={UNIT_LICENSE_STATUS.EXPIRED}>{UNIT_LICENSE_STATUS.EXPIRED}</MenuItem>
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
					<UnitLicenseCertificationTable
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
			<UnitLicenseCertificationFormDialog
				open={formOpen}
				loading={submitting}
				initialValue={selectedItem}
				unitOptions={unitOptions}
				vendorOptions={vendorOptions}
				onClose={closeFormDialog}
				onSubmit={handleSubmit}
			/>
			<DeleteConfirmDialog
				open={deleteOpen}
				loading={submitting}
				title="Lisensi & Sertifikasi Unit"
				itemName={selectedItem?.unitName}
				onClose={closeDeleteDialog}
				onConfirm={handleDelete}
			/>
		</>
	);
}

export default UnitLicenseCertificationsPage;
