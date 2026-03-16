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

import CardHeader from '@/components/cardHeader';
import PageHeader from '@/components/pageHeader';
import DeleteConfirmDialog from '@/components/masterData/deleteConfirmDialog';
import MasterDataFormDialog from '@/components/masterData/masterDataFormDialog';
import MasterDataTable from '@/components/masterData/masterDataTable';
import apiRequest from '@/services/api';

async function fetchMasterData(resource) {
	return apiRequest(`/master/${resource}`);
}

function MasterDataPage({ config }) {
	const { enqueueSnackbar } = useSnackbar();
	const [rows, setRows] = useState([]);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [selectedItem, setSelectedItem] = useState(null);
	const [formOpen, setFormOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [searchKeyword, setSearchKeyword] = useState('');

	const closeFormDialog = () => {
		setFormOpen(false);
		setSelectedItem(null);
	};

	const closeDeleteDialog = () => {
		setDeleteOpen(false);
		setSelectedItem(null);
	};

	const loadData = async () => {
		setLoading(true);

		try {
			const response = await fetchMasterData(config.resource);
			setRows(response);
		} catch (error) {
			enqueueSnackbar(error.message, {
				variant: 'error',
			});
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadData();
	}, [config.resource]);

	const normalizedKeyword = searchKeyword.trim().toLowerCase();
	const filteredRows = rows.filter((row) => {
		if (!normalizedKeyword) {
			return true;
		}

		const searchableFields = config.fields?.filter((field) => field.searchable).map((field) => row[field.name]) || [
			row.name,
		];

		return [...searchableFields, String(row.id)].some((value) =>
			String(value || '')
				.toLowerCase()
				.includes(normalizedKeyword),
		);
	});

	const handleCreate = () => {
		setSelectedItem(null);
		setFormOpen(true);
	};

	const handleEdit = (item) => {
		setSelectedItem(item);
		setFormOpen(true);
	};

	const handleDelete = (item) => {
		setSelectedItem(item);
		setDeleteOpen(true);
	};

	const handleFormSubmit = async (values) => {
		setSubmitting(true);

		try {
			let savedItem;

			if (selectedItem) {
				savedItem = await apiRequest(`/master/${config.resource}/${selectedItem.id}`, {
					method: 'PUT',
					body: JSON.stringify(values),
				});
			} else {
				savedItem = await apiRequest(`/master/${config.resource}`, {
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
			enqueueSnackbar(`${config.fieldLabel} berhasil ${selectedItem ? 'diperbarui' : 'ditambahkan'}.`, {
				variant: 'success',
			});
		} catch (error) {
			enqueueSnackbar(error.message, {
				variant: 'error',
			});
		} finally {
			setSubmitting(false);
		}
	};

	const handleConfirmDelete = async () => {
		if (!selectedItem) {
			return;
		}

		setSubmitting(true);

		try {
			await apiRequest(`/master/${config.resource}/${selectedItem.id}`, {
				method: 'DELETE',
			});
			setRows((currentRows) => currentRows.filter((item) => item.id !== selectedItem.id));
			closeDeleteDialog();
			enqueueSnackbar(`${config.fieldLabel} berhasil dihapus.`, {
				variant: 'error',
			});
		} catch (error) {
			enqueueSnackbar(error.message, {
				variant: 'error',
			});
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<>
			<PageHeader title={config.title}>
				<Breadcrumbs
					aria-label="breadcrumb"
					sx={{
						textTransform: 'uppercase',
					}}
				>
					<Link underline="hover" href="#!">
						Data Master
					</Link>
					<Typography color="text.tertiary">{config.groupBreadcrumb || 'Master Data Karyawan'}</Typography>
					<Typography color="text.tertiary">{config.breadcrumb}</Typography>
				</Breadcrumbs>
			</PageHeader>
			<Card
				type="section"
				sx={{
					minHeight: '60vh',
					p: 3,
				}}
			>
				<CardHeader
					title={config.title}
					subtitle={config.description}
					size="small"
					sx={{ mb: 2.5, alignItems: 'flex-start', gap: 1.5 }}
				>
					<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
						<TextField
							size="small"
							label="Cari Data"
							value={searchKeyword}
							onChange={(event) => setSearchKeyword(event.target.value)}
							placeholder={config.searchPlaceholder || `${config.fieldLabel}, nomor...`}
							sx={{ minWidth: { xs: '100%', md: 320 } }}
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<SearchOutlinedIcon fontSize="small" />
									</InputAdornment>
								),
							}}
						/>
						<Button variant="contained" startIcon={<AddOutlinedIcon />} onClick={handleCreate}>
							Tambah Data
						</Button>
					</Stack>
				</CardHeader>
				{loading ? (
					<Stack alignItems="center" justifyContent="center" py={10}>
						<CircularProgress />
					</Stack>
				) : (
					<MasterDataTable
						rows={filteredRows}
						loading={loading}
						config={config}
						onEdit={handleEdit}
						onDelete={handleDelete}
					/>
				)}
			</Card>
			<MasterDataFormDialog
				config={config}
				open={formOpen}
				loading={submitting}
				initialValue={selectedItem}
				onClose={closeFormDialog}
				onSubmit={handleFormSubmit}
			/>
			<DeleteConfirmDialog
				open={deleteOpen}
				loading={submitting}
				title={config.fieldLabel}
				itemName={selectedItem?.name}
				onClose={closeDeleteDialog}
				onConfirm={handleConfirmDelete}
			/>
		</>
	);
}

export default MasterDataPage;
