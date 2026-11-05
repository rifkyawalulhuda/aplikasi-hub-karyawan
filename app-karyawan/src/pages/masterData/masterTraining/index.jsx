import { useEffect, useMemo, useState } from 'react';
import { useSnackbar } from 'notistack';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';

import EnhancedTable, { createRowNumberColumn } from '@/components/dataTable';
import DeleteConfirmDialog from '@/components/masterData/deleteConfirmDialog';
import PageHeader from '@/components/pageHeader';
import { fetchJobRequirementProfiles } from '@/services/jobRequirement';
import {
	createMasterTraining,
	deleteMasterTraining,
	fetchMasterTrainings,
	fetchRequirementTrainingMap,
	saveRequirementTrainingMap,
	updateMasterTraining,
} from '@/services/masterTraining';

import SkillTab from './skillTab';
import SyaratGradeTab from './syaratGradeTab';
import TrainingMapTab from './trainingMapTab';

function getGradeLabel(grade = '') {
	const match = String(grade).match(/^RANK_(\d+)$/);
	return match ? `Rank ${match[1]}` : grade;
}

function MasterTrainingPage() {
	const { enqueueSnackbar } = useSnackbar();
	const [activeTab, setActiveTab] = useState('LIST');
	const [trainings, setTrainings] = useState([]);
	const [profiles, setProfiles] = useState([]);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [search, setSearch] = useState('');
	const [formOpen, setFormOpen] = useState(false);
	const [editing, setEditing] = useState(null);
	const [formValues, setFormValues] = useState({ name: '', category: '' });
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [selected, setSelected] = useState(null);
	const [grade, setGrade] = useState('');
	const [mapData, setMapData] = useState(null);
	const [mapLoading, setMapLoading] = useState(false);
	const [selectedIds, setSelectedIds] = useState([]);
	const [mapSearch, setMapSearch] = useState('');

	const loadTrainings = async () => {
		setLoading(true);

		try {
			const [trainingRows, profileRows] = await Promise.all([
				fetchMasterTrainings(),
				fetchJobRequirementProfiles(),
			]);
			setTrainings(trainingRows);
			setProfiles(profileRows);

			if (!grade && profileRows.length > 0) {
				setGrade(profileRows[0].grade);
			}
		} catch (error) {
			enqueueSnackbar(error.message, { variant: 'error' });
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadTrainings();
	}, []);

	useEffect(() => {
		if (activeTab !== 'MAP' || !grade) {
			return;
		}

		const loadMap = async () => {
			setMapLoading(true);

			try {
				const response = await fetchRequirementTrainingMap(grade);
				setMapData(response);
				setSelectedIds(response.selectedIds || []);
			} catch (error) {
				enqueueSnackbar(error.message, { variant: 'error' });
			} finally {
				setMapLoading(false);
			}
		};

		loadMap();
	}, [activeTab, grade, enqueueSnackbar]);

	const filteredTrainings = useMemo(() => {
		const keyword = search.trim().toLowerCase();

		if (!keyword) {
			return trainings;
		}

		return trainings.filter((training) => `${training.name} ${training.category}`.toLowerCase().includes(keyword));
	}, [trainings, search]);

	const columns = useMemo(
		() => [
			createRowNumberColumn(),
			{ field: 'name', headerName: 'NAMA TRAINING', minWidth: 280, flex: 1 },
			{ field: 'category', headerName: 'KATEGORI', minWidth: 200 },
			{ field: 'requirementCount', headerName: 'DIPAKAI DI GRADE', minWidth: 150, type: 'number' },
			{ field: 'skillMapCount', headerName: 'DIPAKAI DI SKILL', minWidth: 150, type: 'number' },
			{ field: 'trainingCount', headerName: 'RIWAYAT TRAINING', minWidth: 150, type: 'number' },
		],
		[],
	);

	const groupedTrainings = useMemo(() => {
		const keyword = mapSearch.trim().toLowerCase();
		const source = (mapData?.trainings || []).filter((training) =>
			keyword ? `${training.name} ${training.category}`.toLowerCase().includes(keyword) : true,
		);
		const groups = new Map();

		source.forEach((training) => {
			const key = training.category || 'Tanpa Kategori';

			if (!groups.has(key)) {
				groups.set(key, []);
			}

			groups.get(key).push(training);
		});

		return [...groups.entries()].sort((left, right) => left[0].localeCompare(right[0]));
	}, [mapData, mapSearch]);

	const openCreate = () => {
		setEditing(null);
		setFormValues({ name: '', category: '' });
		setFormOpen(true);
	};

	const openEdit = (row) => {
		setEditing(row);
		setFormValues({ name: row.name, category: row.category || '' });
		setFormOpen(true);
	};

	const handleSubmitForm = async () => {
		setSubmitting(true);

		try {
			if (editing) {
				await updateMasterTraining(editing.id, formValues);
				enqueueSnackbar('Master training berhasil diperbarui.', { variant: 'success' });
			} else {
				await createMasterTraining(formValues);
				enqueueSnackbar('Master training berhasil ditambahkan.', { variant: 'success' });
			}

			setFormOpen(false);
			await loadTrainings();
		} catch (error) {
			enqueueSnackbar(error.message, { variant: 'error' });
		} finally {
			setSubmitting(false);
		}
	};

	const handleConfirmDelete = async () => {
		if (!selected) {
			return;
		}

		setSubmitting(true);

		try {
			await deleteMasterTraining(selected.id);
			enqueueSnackbar('Master training berhasil dihapus.', { variant: 'success' });
			setDeleteOpen(false);
			setSelected(null);
			await loadTrainings();
		} catch (error) {
			enqueueSnackbar(error.message, { variant: 'error' });
		} finally {
			setSubmitting(false);
		}
	};

	const toggleTraining = (id) => {
		setSelectedIds((current) =>
			current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
		);
	};

	const handleSaveMap = async () => {
		setSubmitting(true);

		try {
			const response = await saveRequirementTrainingMap(grade, selectedIds);
			setMapData(response);
			setSelectedIds(response.selectedIds || []);
			enqueueSnackbar('Pemetaan training berhasil disimpan.', { variant: 'success' });
		} catch (error) {
			enqueueSnackbar(error.message, { variant: 'error' });
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<>
			<PageHeader title="Master Training">
				<Typography variant="body2" color="text.secondary">
					Kelola daftar training dan pemetaannya ke syarat jabatan.
				</Typography>
			</PageHeader>

			<Card sx={{ minHeight: '60vh', p: 3 }}>
				<Stack spacing={2.5}>
					<Tabs value={activeTab} onChange={(_event, value) => setActiveTab(value)}>
						<Tab value="LIST" label="Daftar Training" />
						<Tab value="SYARAT" label="Syarat Grade" />
						<Tab value="MAP" label="Pemetaan Grade" />
						<Tab value="SKILL" label="Skill" />
						<Tab value="TRAINING_MAP" label="Pemetaan Training" />
					</Tabs>

					{activeTab === 'LIST' ? (
						<>
							<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
								<TextField
									size="small"
									label="Cari Training"
									value={search}
									onChange={(event) => setSearch(event.target.value)}
									sx={{ minWidth: { xs: '100%', md: 320 } }}
									InputProps={{
										startAdornment: (
											<InputAdornment position="start">
												<SearchOutlinedIcon fontSize="small" />
											</InputAdornment>
										),
									}}
								/>
								<Box sx={{ flexGrow: 1 }} />
								<Button variant="contained" startIcon={<AddOutlinedIcon />} onClick={openCreate}>
									Tambah Training
								</Button>
							</Stack>

							{loading ? (
								<Stack alignItems="center" justifyContent="center" py={10}>
									<CircularProgress />
								</Stack>
							) : (
								<EnhancedTable
									rows={filteredTrainings}
									columns={columns}
									columnResizeKey="master-training-table"
									getContextMenuActions={(row) => [
										{
											label: 'Edit',
											icon: <EditOutlinedIcon fontSize="small" />,
											onClick: () => openEdit(row),
										},
										{
											label: 'Hapus',
											icon: <DeleteOutlineOutlinedIcon fontSize="small" />,
											onClick: () => {
												setSelected(row);
												setDeleteOpen(true);
											},
										},
									]}
								/>
							)}
						</>
					) : null}

					{activeTab === 'MAP' ? (
						<>
							<Grid container spacing={1.5}>
								<Grid item xs={12} md={4}>
									<TextField
										fullWidth
										size="small"
										select
										label="Grade"
										value={grade}
										onChange={(event) => setGrade(event.target.value)}
									>
										{profiles.map((profile) => (
											<MenuItem key={profile.grade} value={profile.grade}>
												{getGradeLabel(profile.grade)}
											</MenuItem>
										))}
									</TextField>
								</Grid>
								<Grid item xs={12} md={5}>
									<TextField
										fullWidth
										size="small"
										label="Cari Training"
										value={mapSearch}
										onChange={(event) => setMapSearch(event.target.value)}
										InputProps={{
											startAdornment: (
												<InputAdornment position="start">
													<SearchOutlinedIcon fontSize="small" />
												</InputAdornment>
											),
										}}
									/>
								</Grid>
								<Grid item xs={12} md={3}>
									<Button
										fullWidth
										variant="contained"
										startIcon={<SaveOutlinedIcon />}
										onClick={handleSaveMap}
										disabled={submitting || mapLoading || !grade}
										sx={{ height: '100%' }}
									>
										Simpan Pemetaan
									</Button>
								</Grid>
							</Grid>

							<Stack direction="row" spacing={1} alignItems="center">
								<Chip
									size="small"
									label={`${selectedIds.length} training wajib`}
									color="primary"
									variant="outlined"
								/>
								<Typography variant="caption" color="text.secondary">
									Centang training yang wajib untuk grade ini.
								</Typography>
							</Stack>

							{mapLoading ? (
								<Stack alignItems="center" justifyContent="center" py={10}>
									<CircularProgress />
								</Stack>
							) : (
								<Stack spacing={2}>
									{groupedTrainings.length === 0 ? (
										<Typography variant="body2" color="text.secondary">
											Tidak ada training yang cocok.
										</Typography>
									) : (
										groupedTrainings.map(([category, items]) => (
											<Box key={category}>
												<Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
													{category}
												</Typography>
												<Divider sx={{ mb: 1 }} />
												<Grid container spacing={0.5}>
													{items.map((training) => (
														<Grid item xs={12} sm={6} md={4} key={training.id}>
															<FormControlLabel
																control={
																	<Checkbox
																		size="small"
																		checked={selectedIds.includes(training.id)}
																		onChange={() => toggleTraining(training.id)}
																	/>
																}
																label={
																	<Typography variant="body2">
																		{training.name}
																	</Typography>
																}
															/>
														</Grid>
													))}
												</Grid>
											</Box>
										))
									)}
								</Stack>
							)}
						</>
					) : null}

					{activeTab === 'TRAINING_MAP' ? <TrainingMapTab /> : null}

					{activeTab === 'SYARAT' ? (
						<SyaratGradeTab profiles={profiles} grade={grade} onGradeChange={setGrade} />
					) : null}

					{activeTab === 'SKILL' ? (
						<SkillTab profiles={profiles} grade={grade} onGradeChange={setGrade} />
					) : null}
				</Stack>
			</Card>

			<Dialog open={formOpen} onClose={submitting ? undefined : () => setFormOpen(false)} fullWidth maxWidth="sm">
				<DialogTitle>{editing ? 'Edit Master Training' : 'Tambah Master Training'}</DialogTitle>
				<DialogContent dividers>
					<Stack spacing={2} sx={{ pt: 1 }}>
						<TextField
							fullWidth
							label="Nama Training"
							value={formValues.name}
							onChange={(event) => setFormValues((current) => ({ ...current, name: event.target.value }))}
						/>
						<TextField
							fullWidth
							label="Kategori"
							value={formValues.category}
							onChange={(event) =>
								setFormValues((current) => ({ ...current, category: event.target.value }))
							}
							helperText="Contoh: Leadership Training, Sistem Manajemen, Orientasi Training"
						/>
					</Stack>
				</DialogContent>
				<DialogActions sx={{ px: 3, py: 2 }}>
					<Button onClick={() => setFormOpen(false)} disabled={submitting}>
						Batal
					</Button>
					<Button variant="contained" onClick={handleSubmitForm} disabled={submitting}>
						{submitting ? 'Menyimpan...' : 'Simpan'}
					</Button>
				</DialogActions>
			</Dialog>

			<DeleteConfirmDialog
				open={deleteOpen}
				loading={submitting}
				title="Master Training"
				itemName={selected?.name}
				onClose={() => setDeleteOpen(false)}
				onConfirm={handleConfirmDelete}
			/>
		</>
	);
}

export default MasterTrainingPage;
