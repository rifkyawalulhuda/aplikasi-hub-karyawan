import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';

import Breadcrumbs from '@mui/material/Breadcrumbs';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';

import CardHeader from '@/components/cardHeader';
import DeleteConfirmDialog from '@/components/masterData/deleteConfirmDialog';
import PageHeader from '@/components/pageHeader';
import apiRequest from '@/services/api';

import WarningLetterFormDialog from './warningLetterFormDialog';
import WarningLetterTable from './warningLetterTable';

async function fetchWarningLetters() {
	return apiRequest('/data-karyawan/warning-letters');
}

async function fetchEmployeeOptions() {
	return apiRequest('/master/employees');
}

async function fetchMasterDokPkbOptions() {
	return apiRequest('/master/master-dok-pkb');
}

function WarningLettersPage() {
	const navigate = useNavigate();
	const { enqueueSnackbar } = useSnackbar();
	const [rows, setRows] = useState([]);
	const [employeeOptions, setEmployeeOptions] = useState([]);
	const [masterDokPkbOptions, setMasterDokPkbOptions] = useState([]);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [formOpen, setFormOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [selectedItem, setSelectedItem] = useState(null);
	const [searchKeyword, setSearchKeyword] = useState('');
	const [dateFrom, setDateFrom] = useState('');
	const [dateTo, setDateTo] = useState('');
	const [selectedRowIds, setSelectedRowIds] = useState([]);

	useEffect(() => {
		const init = async () => {
			setLoading(true);

			try {
				const [warningLetters, employees, masterDokPkb] = await Promise.all([
					fetchWarningLetters(),
					fetchEmployeeOptions(),
					fetchMasterDokPkbOptions(),
				]);

				setRows(warningLetters);
				setEmployeeOptions(employees);
				setMasterDokPkbOptions(masterDokPkb);
			} catch (error) {
				enqueueSnackbar(error.message, { variant: 'error' });
			} finally {
				setLoading(false);
			}
		};

		init();
	}, [enqueueSnackbar]);

	const closeFormDialog = () => {
		setFormOpen(false);
		setSelectedItem(null);
	};

	const closeDeleteDialog = () => {
		setDeleteOpen(false);
		setSelectedItem(null);
	};

	const normalizedKeyword = searchKeyword.trim().toLowerCase();
	const filteredRows = rows.filter((row) => {
		const matchesDateFrom = dateFrom ? row.letterDate >= dateFrom : true;
		const matchesDateTo = dateTo ? row.letterDate <= dateTo : true;

		if (!matchesDateFrom || !matchesDateTo) {
			return false;
		}

		if (!normalizedKeyword) {
			return true;
		}

		const searchableValues = [
			row.id,
			row.employeeName,
			row.employeeNo,
			row.warningLevel,
			row.letterNumber,
			row.letterDate,
			row.violation,
			row.articleLabel,
			row.articleContent,
			row.superiorName,
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
				savedItem = await apiRequest(`/data-karyawan/warning-letters/${selectedItem.id}`, {
					method: 'PUT',
					body: JSON.stringify(values),
				});
			} else {
				savedItem = await apiRequest('/data-karyawan/warning-letters', {
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
			enqueueSnackbar(`Data Surat Peringatan berhasil ${selectedItem ? 'diperbarui' : 'ditambahkan'}.`, {
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
			await apiRequest(`/data-karyawan/warning-letters/${selectedItem.id}`, {
				method: 'DELETE',
			});
			setRows((currentRows) => currentRows.filter((item) => item.id !== selectedItem.id));
			closeDeleteDialog();
			enqueueSnackbar('Data Surat Peringatan berhasil dihapus.', { variant: 'error' });
		} catch (error) {
			enqueueSnackbar(error.message, { variant: 'error' });
		} finally {
			setSubmitting(false);
		}
	};

	const handleBulkPrint = () => {
		if (selectedRows.length === 0) {
			enqueueSnackbar('Pilih minimal satu data atau gunakan checkbox pilih semua untuk print A4.', {
				variant: 'error',
			});
			return;
		}

		const selectedIds = selectedRows.map((row) => row.id).join(',');
		const printUrl = `/print/data-karyawan/data-surat-peringatan?ids=${selectedIds}`;

		window.open(printUrl, '_blank', 'noopener,noreferrer');
	};

	return (
		<>
			<PageHeader title="Data Surat Peringatan">
				<Breadcrumbs aria-label="breadcrumb" sx={{ textTransform: 'uppercase' }}>
					<Link underline="hover" href="#!">
						Data Karyawan
					</Link>
					<Typography color="text.tertiary">Data Surat Peringatan</Typography>
				</Breadcrumbs>
			</PageHeader>
			<Card sx={{ minHeight: '60vh', p: 3 }}>
				<CardHeader
					title="Data Surat Peringatan"
					subtitle="Kelola data surat peringatan karyawan dan cetak dokumen A4 dari halaman ini."
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
								placeholder="Nama, NIK, nomor surat, pasal..."
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
									color="secondary"
									startIcon={<PrintOutlinedIcon />}
									onClick={handleBulkPrint}
									sx={{ minWidth: 170, whiteSpace: 'nowrap' }}
								>
									Print A4 Terpilih
								</Button>
								<Button
									variant="contained"
									startIcon={<AddOutlinedIcon />}
									onClick={() => {
										setSelectedItem(null);
										setFormOpen(true);
									}}
									sx={{ minWidth: 220 }}
								>
									Form Surat Peringatan
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
					<WarningLetterTable
						rows={filteredRows}
						selectedRowIds={selectedRowIds}
						allRowsSelected={allRowsSelected}
						someRowsSelected={someRowsSelected}
						onToggleSelectAll={handleToggleSelectAll}
						onToggleSelectRow={handleToggleSelectRow}
						onView={(item) => navigate(`/data-karyawan/data-surat-peringatan/${item.id}`)}
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
			<WarningLetterFormDialog
				open={formOpen}
				loading={submitting}
				initialValue={selectedItem}
				employeeOptions={employeeOptions}
				masterDokPkbOptions={masterDokPkbOptions}
				onClose={closeFormDialog}
				onSubmit={handleSubmit}
			/>
			<DeleteConfirmDialog
				open={deleteOpen}
				loading={submitting}
				title="Data Surat Peringatan"
				itemName={selectedItem?.employeeName}
				onClose={closeDeleteDialog}
				onConfirm={handleDelete}
			/>
		</>
	);
}

export default WarningLettersPage;
