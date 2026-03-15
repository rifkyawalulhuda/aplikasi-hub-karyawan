import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';

import Breadcrumbs from '@mui/material/Breadcrumbs';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CircularProgress from '@mui/material/CircularProgress';
import Link from '@mui/material/Link';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import ArrowDropDownOutlinedIcon from '@mui/icons-material/ArrowDropDownOutlined';

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
					subtitle="Kelola data bimbingan dan pengarahan, lalu pilih formulir yang ingin diinput dari tombol berikut."
					size="small"
				>
					<Button
						variant="contained"
						startIcon={<AddOutlinedIcon />}
						endIcon={<ArrowDropDownOutlinedIcon />}
						onClick={handleOpenCreateMenu}
					>
						Input Formulir
					</Button>
					<Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={handleCloseCreateMenu}>
						{guidanceCategoryOptions.map((option) => (
							<MenuItem key={option.value} onClick={() => handleOpenCreateForm(option.value)}>
								{option.formTitle}
							</MenuItem>
						))}
					</Menu>
				</CardHeader>
				{loading ? (
					<Stack alignItems="center" justifyContent="center" py={10}>
						<CircularProgress />
					</Stack>
				) : (
					<GuidanceTable
						rows={rows}
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
