import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSnackbar } from 'notistack';

import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';

import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import DeleteSweepOutlinedIcon from '@mui/icons-material/DeleteSweepOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';

import EnhancedTable, { createRowNumberColumn } from '@/components/dataTable';
import DeleteConfirmDialog from '@/components/masterData/deleteConfirmDialog';
import {
	createMasterSkill,
	deleteMasterSkill,
	deleteSkillAssessments,
	fetchMasterSkills,
	fetchSkillMapping,
	saveSkillMapping,
	updateMasterSkill,
} from '@/services/masterSkill';

const CATEGORY_LABELS = {
	SOFT_SKILL: 'Soft Skill',
	HARD_SKILL: 'Hard Skill',
};

function getGradeLabel(grade = '') {
	const match = String(grade).match(/^RANK_(\d+)$/);
	return match ? `Rank ${match[1]}` : grade;
}

function SkillTab({ profiles, grade, onGradeChange }) {
	const { enqueueSnackbar } = useSnackbar();
	const [category, setCategory] = useState('SOFT_SKILL');
	const [skills, setSkills] = useState([]);
	const [mapping, setMapping] = useState(null);
	const [selectedIds, setSelectedIds] = useState([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [search, setSearch] = useState('');
	const [formOpen, setFormOpen] = useState(false);
	const [editing, setEditing] = useState(null);
	const [formName, setFormName] = useState('');
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [selected, setSelected] = useState(null);
	const [assessDeleteOpen, setAssessDeleteOpen] = useState(false);
	const [assessSelected, setAssessSelected] = useState(null);

	const loadSkills = useCallback(async () => {
		setLoading(true);

		try {
			const rows = await fetchMasterSkills();
			setSkills(rows);
		} catch (error) {
			enqueueSnackbar(error.message, { variant: 'error' });
		} finally {
			setLoading(false);
		}
	}, [enqueueSnackbar]);

	const loadMapping = useCallback(async () => {
		if (!grade) {
			return;
		}

		try {
			const response = await fetchSkillMapping(grade);
			setMapping(response);
		} catch (error) {
			enqueueSnackbar(error.message, { variant: 'error' });
		}
	}, [grade, enqueueSnackbar]);

	useEffect(() => {
		loadSkills();
	}, [loadSkills]);

	useEffect(() => {
		loadMapping();
	}, [loadMapping]);

	useEffect(() => {
		if (!mapping) {
			return;
		}

		setSelectedIds(
			mapping.skills.filter((skill) => skill.category === category && skill.required).map((skill) => skill.id),
		);
	}, [mapping, category]);

	const filteredSkills = useMemo(() => {
		const keyword = search.trim().toLowerCase();

		return skills
			.filter((skill) => skill.category === category)
			.filter((skill) => (keyword ? skill.name.toLowerCase().includes(keyword) : true));
	}, [skills, category, search]);

	const toggleSkill = (id) => {
		setSelectedIds((current) =>
			current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
		);
	};

	const columns = useMemo(
		() => [
			createRowNumberColumn(),
			{ field: 'name', headerName: 'NAMA SKILL', minWidth: 240, flex: 1 },
			{
				field: 'required',
				headerName: `WAJIB DI ${getGradeLabel(grade).toUpperCase()}`,
				minWidth: 170,
				sortable: false,
				renderCell: (params) => (
					<Checkbox
						size="small"
						checked={selectedIds.includes(params.row.id)}
						onChange={() => toggleSkill(params.row.id)}
						inputProps={{ 'aria-label': `Wajib ${params.row.name}` }}
					/>
				),
			},
			{
				field: 'requirementCount',
				headerName: 'DIPAKAI DI GRADE',
				minWidth: 150,
				type: 'number',
				renderCell: (params) =>
					params.value > 0 ? <Chip size="small" label={`${params.value} grade`} variant="outlined" /> : '-',
			},
			{
				field: 'assessmentCount',
				headerName: 'ASESMEN',
				minWidth: 140,
				type: 'number',
				renderCell: (params) =>
					params.value > 0 ? (
						<Stack direction="row" spacing={0.5} alignItems="center">
							<Chip size="small" label={params.value} color="warning" variant="outlined" />
							<Button
								size="small"
								color="error"
								sx={{ minWidth: 0, fontSize: 11 }}
								onClick={(event) => {
									event.stopPropagation();
									setAssessSelected(params.row);
									setAssessDeleteOpen(true);
								}}
							>
								Hapus
							</Button>
						</Stack>
					) : (
						'-'
					),
			},
		],
		[grade, selectedIds],
	);

	const openCreate = () => {
		setEditing(null);
		setFormName('');
		setFormOpen(true);
	};

	const openEdit = (row) => {
		setEditing(row);
		setFormName(row.name);
		setFormOpen(true);
	};

	const handleSubmitForm = async () => {
		setSaving(true);

		try {
			if (editing) {
				await updateMasterSkill(editing.id, { name: formName });
				enqueueSnackbar('Skill berhasil diperbarui.', { variant: 'success' });
			} else {
				await createMasterSkill({ category, name: formName });
				enqueueSnackbar('Skill berhasil ditambahkan ke katalog.', { variant: 'success' });
			}

			setFormOpen(false);
			await loadSkills();
			await loadMapping();
		} catch (error) {
			enqueueSnackbar(error.message, { variant: 'error' });
		} finally {
			setSaving(false);
		}
	};

	const handleConfirmDelete = async () => {
		if (!selected) {
			return;
		}

		setSaving(true);

		try {
			await deleteMasterSkill(selected.id);
			enqueueSnackbar('Skill berhasil dihapus.', { variant: 'success' });
			setDeleteOpen(false);
			setSelected(null);
			await loadSkills();
			await loadMapping();
		} catch (error) {
			enqueueSnackbar(error.message, { variant: 'error' });
		} finally {
			setSaving(false);
		}
	};

	const handleConfirmDeleteAssessments = async () => {
		if (!assessSelected) {
			return;
		}

		setSaving(true);

		try {
			const result = await deleteSkillAssessments(assessSelected.id);
			enqueueSnackbar(`${result.deleted} asesmen untuk "${result.skillName}" dihapus.`, {
				variant: 'success',
			});
			setAssessDeleteOpen(false);
			setAssessSelected(null);
			await loadSkills();
			await loadMapping();
		} catch (error) {
			enqueueSnackbar(error.message, { variant: 'error' });
		} finally {
			setSaving(false);
		}
	};

	const handleSaveMapping = async () => {
		if (!grade) {
			return;
		}

		setSaving(true);

		try {
			const response = await saveSkillMapping(grade, {
				category,
				masterSkillIds: selectedIds,
			});
			setMapping(response);
			enqueueSnackbar(`Pemetaan ${CATEGORY_LABELS[category]} berhasil disimpan.`, {
				variant: 'success',
			});
		} catch (error) {
			enqueueSnackbar(error.message, { variant: 'error' });
		} finally {
			setSaving(false);
		}
	};

	return (
		<>
			<Stack spacing={2}>
				<Grid container spacing={1.5} alignItems="center">
					<Grid item xs={12} md={3}>
						<ToggleButtonGroup
							value={category}
							exclusive
							size="small"
							fullWidth
							onChange={(_event, value) => {
								if (value) {
									setCategory(value);
								}
							}}
						>
							<ToggleButton value="SOFT_SKILL">Soft Skill</ToggleButton>
							<ToggleButton value="HARD_SKILL">Hard Skill</ToggleButton>
						</ToggleButtonGroup>
					</Grid>
					<Grid item xs={12} md={3}>
						<TextField
							fullWidth
							size="small"
							select
							label="Grade"
							value={grade}
							onChange={(event) => onGradeChange(event.target.value)}
						>
							{profiles.map((profile) => (
								<MenuItem key={profile.grade} value={profile.grade}>
									{getGradeLabel(profile.grade)}
								</MenuItem>
							))}
						</TextField>
					</Grid>
					<Grid item xs={12} md={3}>
						<TextField
							fullWidth
							size="small"
							label="Cari Skill"
							value={search}
							onChange={(event) => setSearch(event.target.value)}
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
						<Stack direction="row" spacing={1} justifyContent="flex-end">
							<Button variant="outlined" startIcon={<AddOutlinedIcon />} onClick={openCreate}>
								Tambah
							</Button>
							<Button
								variant="contained"
								startIcon={<SaveOutlinedIcon />}
								onClick={handleSaveMapping}
								disabled={saving || !grade}
							>
								Simpan
							</Button>
						</Stack>
					</Grid>
				</Grid>

				<Stack direction="row" spacing={1} alignItems="center">
					<Chip
						size="small"
						color="primary"
						variant="outlined"
						label={`${selectedIds.length} ${CATEGORY_LABELS[category]} wajib`}
					/>
					<Typography variant="caption" color="text.secondary">
						Centang skill yang wajib untuk grade terpilih. Katalog bisa ditambah, diedit, atau dihapus lewat
						menu baris.
					</Typography>
				</Stack>

				{loading ? (
					<Stack alignItems="center" justifyContent="center" py={8}>
						<CircularProgress />
					</Stack>
				) : (
					<EnhancedTable
						rows={filteredSkills}
						columns={columns}
						getRowId={(row) => row.id}
						columnResizeKey="master-skill-table"
						getContextMenuActions={(row) => {
							const actions = [
								{
									label: 'Edit Nama',
									icon: <EditOutlinedIcon fontSize="small" />,
									onClick: () => openEdit(row),
								},
								{
									label: 'Hapus dari Katalog',
									icon: <DeleteOutlineOutlinedIcon fontSize="small" />,
									onClick: () => {
										setSelected(row);
										setDeleteOpen(true);
									},
								},
							];

							if (row.assessmentCount > 0) {
								actions.splice(1, 0, {
									label: `Hapus Asesmen (${row.assessmentCount})`,
									icon: <DeleteSweepOutlinedIcon fontSize="small" />,
									onClick: () => {
										setAssessSelected(row);
										setAssessDeleteOpen(true);
									},
								});
							}

							return actions;
						}}
					/>
				)}
			</Stack>

			<Dialog open={formOpen} onClose={saving ? undefined : () => setFormOpen(false)} fullWidth maxWidth="xs">
				<DialogTitle>{editing ? 'Edit Skill' : `Tambah ${CATEGORY_LABELS[category]}`}</DialogTitle>
				<DialogContent dividers>
					<TextField
						fullWidth
						autoFocus
						label="Nama Skill"
						value={formName}
						onChange={(event) => setFormName(event.target.value)}
						helperText={`Kategori: ${CATEGORY_LABELS[category]}`}
						sx={{ mt: 1 }}
					/>
				</DialogContent>
				<DialogActions sx={{ px: 3, py: 2 }}>
					<Button onClick={() => setFormOpen(false)} disabled={saving}>
						Batal
					</Button>
					<Button variant="contained" onClick={handleSubmitForm} disabled={saving}>
						{saving ? 'Menyimpan...' : 'Simpan'}
					</Button>
				</DialogActions>
			</Dialog>

			<DeleteConfirmDialog
				open={deleteOpen}
				loading={saving}
				title={`${CATEGORY_LABELS[selected?.category] || 'Skill'}`}
				itemName={selected?.name}
				onClose={() => setDeleteOpen(false)}
				onConfirm={handleConfirmDelete}
			/>

			<DeleteConfirmDialog
				open={assessDeleteOpen}
				loading={saving}
				title="Hapus Semua Asesmen Skill"
				itemName={
					assessSelected ? `${assessSelected.name} (${assessSelected.assessmentCount} asesmen karyawan)` : ''
				}
				onClose={() => setAssessDeleteOpen(false)}
				onConfirm={handleConfirmDeleteAssessments}
			/>
		</>
	);
}

export default SkillTab;
