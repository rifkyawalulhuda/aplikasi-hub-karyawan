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
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import ArrowDropDownOutlinedIcon from '@mui/icons-material/ArrowDropDownOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';

import CardHeader from '@/components/cardHeader';
import DeleteConfirmDialog from '@/components/masterData/deleteConfirmDialog';
import PageHeader from '@/components/pageHeader';
import apiRequest from '@/services/api';

import { guidanceCategoryOptions, getGuidanceCategoryConfig, GUIDANCE_RECORD_CATEGORY } from './constants';
import GuidanceFormDialog from './guidanceFormDialog';
import GuidanceTable from './guidanceTable';

async function fetchGuidanceRecords() {
	return apiRequest('/data-karyawan/guidance-records');
}

async function fetchEmployeeOptions() {
	return apiRequest('/master/employees');
}

function GuidanceRecordsPage() {
	const navigate = useNavigate();
	const { enqueueSnackbar } = useSnackbar();
	const [rows, setRows] = useState([]);
	const [employeeOptions, setEmployeeOptions] = useState([]);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [formOpen, setFormOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [selectedItem, setSelectedItem] = useState(null);
	const [formCategory, setFormCategory] = useState(GUIDANCE_RECORD_CATEGORY.GUIDANCE);
	const [menuAnchorEl, setMenuAnchorEl] = useState(null);
	const [searchKeyword, setSearchKeyword] = useState('');
	const [categoryFilter, setCategoryFilter] = useState('ALL');
	const [dateFrom, setDateFrom] = useState('');
	const [dateTo, setDateTo] = useState('');

	useEffect(() => {
		const init = async () => {
			setLoading(true);

			try {
				const [records, employees] = await Promise.all([fetchGuidanceRecords(), fetchEmployeeOptions()]);
				setRows(records);
				setEmployeeOptions(employees);
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

	const handleOpenCreateMenu = (event) => {
		setMenuAnchorEl(event.currentTarget);
	};

	const handleCloseCreateMenu = () => {
		setMenuAnchorEl(null);
	};

	const handleOpenCreateForm = (category) => {
		setSelectedItem(null);
		setFormCategory(category);
		setFormOpen(true);
		handleCloseCreateMenu();
	};

	const normalizedKeyword = searchKeyword.trim().toLowerCase();
	const filteredRows = rows.filter((row) => {
		const matchesCategory = categoryFilter === 'ALL' ? true : row.category === categoryFilter;
		const matchesDateFrom = dateFrom ? row.meetingDate >= dateFrom : true;
		const matchesDateTo = dateTo ? row.meetingDate <= dateTo : true;

		if (!matchesCategory || !matchesDateFrom || !matchesDateTo) {
			return false;
		}

		if (!normalizedKeyword) {
			return true;
		}

		const searchableValues = [
			row.categoryLabel,
			row.employeeName,
			row.employeeNo,
			row.departmentName,
			row.positionName,
			row.rank,
			row.location,
			row.meetingDate,
			row.meetingTime,
			String(row.meetingNumber),
			String(row.id),
		];

		return searchableValues.some((value) =>
			String(value || '')
				.toLowerCase()
				.includes(normalizedKeyword),
		);
	});

	const handleExportExcel = async () => {
		if (filteredRows.length === 0) {
			enqueueSnackbar('Tidak ada data untuk diexport.', { variant: 'error' });
			return;
		}

		const ExcelJS = await import('exceljs');
		const Workbook = ExcelJS.Workbook || ExcelJS.default?.Workbook;
		const workbook = new Workbook();
		const worksheet = workbook.addWorksheet('Bimbingan & Pengarahan');

		worksheet.columns = [
			{ header: 'NO', key: 'id', width: 10 },
			{ header: 'KATEGORI', key: 'categoryLabel', width: 16 },
			{ header: 'PERTEMUAN KE', key: 'meetingNumber', width: 16 },
			{ header: 'TANGGAL', key: 'meetingDate', width: 14 },
			{ header: 'JAM', key: 'meetingTime', width: 12 },
			{ header: 'TEMPAT', key: 'location', width: 24 },
			{ header: 'NAMA KARYAWAN', key: 'employeeName', width: 28 },
			{ header: 'NIK', key: 'employeeNo', width: 18 },
			{ header: 'DEPARTEMEN', key: 'departmentName', width: 20 },
			{ header: 'JABATAN', key: 'positionName', width: 18 },
			{ header: 'RANK', key: 'rank', width: 14 },
			{ header: 'A.1 / PERMASALAHAN', key: 'problemFaced', width: 36 },
			{ header: 'A.2 / TANGGUNG JAWAB PEKERJAAN', key: 'problemFacedSecondary', width: 36 },
			{ header: 'B. PENYEBAB MASALAH', key: 'problemCause', width: 36 },
			{ header: 'C. PEMECAHAN MASALAH', key: 'problemSolving', width: 36 },
		];

		worksheet.getRow(1).font = { bold: true };
		worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

		filteredRows.forEach((row) => {
			worksheet.addRow({
				id: row.id,
				categoryLabel: row.categoryLabel,
				meetingNumber: row.meetingNumber,
				meetingDate: row.meetingDate,
				meetingTime: row.meetingTime,
				location: row.location,
				employeeName: row.employeeName,
				employeeNo: row.employeeNo,
				departmentName: row.departmentName,
				positionName: row.positionName,
				rank: row.rank,
				problemFaced: row.problemFaced,
				problemFacedSecondary: row.problemFacedSecondary || '',
				problemCause: row.problemCause,
				problemSolving: row.problemSolving,
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
		const fileSuffix = dateFrom || dateTo ? `${dateFrom || 'all'}_${dateTo || 'all'}` : 'all-data';

		link.href = url;
		link.download = `bimbingan-pengarahan-${fileSuffix}.xlsx`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		window.URL.revokeObjectURL(url);
	};

	const handleSubmit = async (values) => {
		setSubmitting(true);
		const categoryConfig = getGuidanceCategoryConfig(values.category || selectedItem?.category || formCategory);

		try {
			let savedItem;

			if (selectedItem) {
				savedItem = await apiRequest(`/data-karyawan/guidance-records/${selectedItem.id}`, {
					method: 'PUT',
					body: JSON.stringify(values),
				});
			} else {
				savedItem = await apiRequest('/data-karyawan/guidance-records', {
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
			enqueueSnackbar(`${categoryConfig.recordTitle} berhasil ${selectedItem ? 'diperbarui' : 'ditambahkan'}.`, {
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
		const categoryConfig = getGuidanceCategoryConfig(selectedItem.category);

		try {
			await apiRequest(`/data-karyawan/guidance-records/${selectedItem.id}`, {
				method: 'DELETE',
			});
			setRows((currentRows) => currentRows.filter((item) => item.id !== selectedItem.id));
			closeDeleteDialog();
			enqueueSnackbar(`${categoryConfig.recordTitle} berhasil dihapus.`, { variant: 'error' });
		} catch (error) {
			enqueueSnackbar(error.message, { variant: 'error' });
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<>
			<PageHeader title="Bimbingan & Pengarahan">
				<Breadcrumbs aria-label="breadcrumb" sx={{ textTransform: 'uppercase' }}>
					<Link underline="hover" href="#!">
						Data Karyawan
					</Link>
					<Typography color="text.tertiary">Bimbingan & Pengarahan</Typography>
				</Breadcrumbs>
			</PageHeader>
			<Card sx={{ minHeight: '60vh', p: 3 }}>
				<CardHeader
					title="Bimbingan & Pengarahan"
					subtitle="Kelola data bimbingan dan pengarahan karyawan"
					size="small"
					sx={{
						flexDirection: 'column',
						alignItems: 'stretch',
						gap: 2,
						mb: 2.5,
					}}
				>
					<Grid container spacing={1.5} alignItems="center">
						<Grid item xs={12} xl={4}>
							<TextField
								fullWidth
								size="small"
								label="Cari Data"
								value={searchKeyword}
								onChange={(event) => setSearchKeyword(event.target.value)}
								placeholder="Nama, NIK, departemen, tempat..."
								InputProps={{
									startAdornment: (
										<InputAdornment position="start">
											<SearchOutlinedIcon fontSize="small" />
										</InputAdornment>
									),
								}}
							/>
						</Grid>
						<Grid item xs={12} sm={6} md={4} lg={2} xl={2}>
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
						<Grid item xs={12} sm={6} md={4} lg={2} xl={2}>
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
						<Grid item xs={12} sm={6} md={4} lg={2} xl={2}>
							<TextField
								fullWidth
								size="small"
								select
								label="Kategori"
								value={categoryFilter}
								onChange={(event) => setCategoryFilter(event.target.value)}
							>
								<MenuItem value="ALL">Semua</MenuItem>
								<MenuItem value={GUIDANCE_RECORD_CATEGORY.GUIDANCE}>Bimbingan</MenuItem>
								<MenuItem value={GUIDANCE_RECORD_CATEGORY.DIRECTION}>Pengarahan</MenuItem>
							</TextField>
						</Grid>
						<Grid item xs={12} lg="auto" sx={{ ml: { lg: 'auto' } }}>
							<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
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
									endIcon={<ArrowDropDownOutlinedIcon />}
									onClick={handleOpenCreateMenu}
									sx={{ minWidth: 190, whiteSpace: 'nowrap' }}
								>
									Input Formulir
								</Button>
								<Menu
									anchorEl={menuAnchorEl}
									open={Boolean(menuAnchorEl)}
									onClose={handleCloseCreateMenu}
								>
									{guidanceCategoryOptions.map((option) => (
										<MenuItem key={option.value} onClick={() => handleOpenCreateForm(option.value)}>
											{option.formTitle}
										</MenuItem>
									))}
								</Menu>
							</Stack>
						</Grid>
					</Grid>
				</CardHeader>
				{loading ? (
					<Stack alignItems="center" justifyContent="center" py={10}>
						<CircularProgress />
					</Stack>
				) : (
					<GuidanceTable
						rows={filteredRows}
						onView={(item) => {
							navigate(`/data-karyawan/bimbingan-pengarahan/${item.id}`);
						}}
						onEdit={(item) => {
							setSelectedItem(item);
							setFormCategory(item.category);
							setFormOpen(true);
						}}
						onDelete={(item) => {
							setSelectedItem(item);
							setDeleteOpen(true);
						}}
					/>
				)}
			</Card>
			<GuidanceFormDialog
				open={formOpen}
				loading={submitting}
				initialValue={selectedItem}
				employeeOptions={employeeOptions}
				category={formCategory}
				onClose={closeFormDialog}
				onSubmit={handleSubmit}
			/>
			<DeleteConfirmDialog
				open={deleteOpen}
				loading={submitting}
				title={getGuidanceCategoryConfig(selectedItem?.category).recordTitle}
				itemName={selectedItem?.employeeName}
				onClose={closeDeleteDialog}
				onConfirm={handleDelete}
			/>
		</>
	);
}

export default GuidanceRecordsPage;
