import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSnackbar } from 'notistack';
import { alpha } from '@mui/material/styles';

import Box from '@mui/material/Box';
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
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import DeleteSweepOutlinedIcon from '@mui/icons-material/DeleteSweepOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import PlaylistAddCheckOutlinedIcon from '@mui/icons-material/PlaylistAddCheckOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import TrackChangesOutlinedIcon from '@mui/icons-material/TrackChangesOutlined';

import EnhancedTable, { createRowNumberColumn } from '@/components/dataTable';
import DeleteConfirmDialog from '@/components/masterData/deleteConfirmDialog';
import {
	copySkillMappingFromAbove,
	createMasterSkill,
	deleteMasterSkill,
	deleteSkillAssessments,
	fetchMasterSkills,
	fetchSkillMapping,
	saveSkillMapping,
	saveSkillTargets,
	updateMasterSkill,
} from '@/services/masterSkill';

const CATEGORY_LABELS = {
	SOFT_SKILL: 'Soft Skill',
	HARD_SKILL: 'Hard Skill',
};

const LEVEL_OPTIONS = [0, 1, 2, 3, 4, 5];

function getGradeLabel(grade = '') {
	const match = String(grade).match(/^RANK_(\d+)$/);
	return match ? `Rank ${match[1]}` : grade;
}

function getGradeAbove(grade = '') {
	const match = String(grade).match(/^RANK_(\d+)$/);

	if (!match) {
		return null;
	}

	const rank = Number(match[1]);
	return rank >= 11 ? null : `RANK_${rank + 1}`;
}

function SkillTab({ profiles, grade, onGradeChange }) {
	const { enqueueSnackbar } = useSnackbar();
	const [category, setCategory] = useState('SOFT_SKILL');
	const [skills, setSkills] = useState([]);
	const [mapping, setMapping] = useState(null);
	const [selectedIds, setSelectedIds] = useState([]);
	const [targetDraft, setTargetDraft] = useState({});
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
	const [baseline, setBaseline] = useState({ requiredIds: [], targets: {} });
	const [pendingSelectId, setPendingSelectId] = useState(null);

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

		const requiredIds = mapping.skills
			.filter((skill) => skill.category === category && skill.required)
			.map((skill) => skill.id);

		const nextDraft = {};

		(mapping.skills || [])
			.filter((skill) => skill.category === category)
			.forEach((skill) => {
				nextDraft[skill.id] = {
					targetLevel: skill.targetLevel ?? 3,
				};
			});

		setSelectedIds(requiredIds);
		setTargetDraft(nextDraft);
		setBaseline({ requiredIds, targets: nextDraft });
	}, [mapping, category]);

	const filteredSkills = useMemo(() => {
		const keyword = search.trim().toLowerCase();

		return skills
			.filter((skill) => skill.category === category)
			.filter((skill) => (keyword ? skill.name.toLowerCase().includes(keyword) : true));
	}, [skills, category, search]);

	const gradeAbove = useMemo(() => getGradeAbove(grade), [grade]);

	const submitLabel = useMemo(() => {
		if (saving) {
			return 'Menyimpan...';
		}

		return editing ? 'Simpan Perubahan' : 'Tambah ke Katalog';
	}, [saving, editing]);

	// A freshly created skill is not yet a requirement of any grade. Tick it so the
	// user immediately sees it as part of the pending list instead of hunting for it.
	useEffect(() => {
		if (!pendingSelectId || !mapping) {
			return;
		}

		setSelectedIds((current) => (current.includes(pendingSelectId) ? current : [...current, pendingSelectId]));
		setTargetDraft((current) => ({
			...current,
			[pendingSelectId]: current[pendingSelectId] || { targetLevel: 3 },
		}));
		setPendingSelectId(null);
	}, [pendingSelectId, mapping]);

	// Changes that would be lost if the user switches grade/category right now.
	const dirty = useMemo(() => {
		const baselineRequired = new Set(baseline.requiredIds);
		const currentRequired = new Set(selectedIds);

		const requiredChanged =
			baselineRequired.size !== currentRequired.size ||
			[...currentRequired].some((id) => !baselineRequired.has(id));

		const targetChanged = selectedIds.some((id) => {
			const before = baseline.targets[id]?.targetLevel;
			const now = targetDraft[id]?.targetLevel;

			return before != null && now != null && Number(before) !== Number(now);
		});

		return { requiredChanged, targetChanged };
	}, [baseline, selectedIds, targetDraft]);

	const hasUnsavedChanges = dirty.requiredChanged || dirty.targetChanged;

	const toggleSkill = (id) => {
		setSelectedIds((current) =>
			current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
		);
	};

	const updateTargetDraft = (id, patch) => {
		setTargetDraft((current) => ({
			...current,
			[id]: { ...(current[id] || {}), ...patch },
		}));
	};

	const columns = useMemo(
		() => [
			createRowNumberColumn(),
			{ field: 'name', headerName: 'NAMA SKILL', minWidth: 220, flex: 1 },
			{
				field: 'required',
				headerName: `WAJIB DI ${getGradeLabel(grade).toUpperCase()}`,
				minWidth: 130,
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
				field: 'targetLevel',
				headerName: 'TARGET',
				minWidth: 110,
				sortable: false,
				renderCell: (params) => {
					if (!selectedIds.includes(params.row.id)) {
						return (
							<Typography variant="caption" color="text.disabled">
								-
							</Typography>
						);
					}

					const draft = targetDraft[params.row.id] || {};

					return (
						<TextField
							select
							size="small"
							value={draft.targetLevel ?? 3}
							onChange={(event) =>
								updateTargetDraft(params.row.id, { targetLevel: Number(event.target.value) })
							}
							inputProps={{ 'aria-label': `Target ${params.row.name}` }}
							sx={{ minWidth: 78 }}
						>
							{LEVEL_OPTIONS.map((level) => (
								<MenuItem key={level} value={level}>
									{level}
								</MenuItem>
							))}
						</TextField>
					);
				},
			},
			{
				field: 'requirementCount',
				headerName: 'DIPAKAI DI GRADE',
				minWidth: 140,
				type: 'number',
				renderCell: (params) =>
					params.value > 0 ? <Chip size="small" label={`${params.value} grade`} variant="outlined" /> : '-',
			},
			{
				field: 'assessmentCount',
				headerName: 'ASESMEN',
				minWidth: 130,
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
		[grade, selectedIds, targetDraft],
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
		const name = formName.trim();

		if (!name) {
			return;
		}

		setSaving(true);

		try {
			if (editing) {
				await updateMasterSkill(editing.id, { name });
				enqueueSnackbar(`Nama skill diubah menjadi "${name}".`, { variant: 'success' });
			} else {
				const created = await createMasterSkill({ category, name });

				setPendingSelectId(created?.id ?? null);
				enqueueSnackbar(
					`"${name}" ditambahkan ke katalog ${CATEGORY_LABELS[category]}. Centang lalu simpan daftar wajib.`,
					{ variant: 'success' },
				);
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
			setBaseline((current) => ({ ...current, requiredIds: [...selectedIds] }));
			enqueueSnackbar(
				`Daftar wajib ${CATEGORY_LABELS[category]} untuk ${getGradeLabel(grade)} disimpan (${
					selectedIds.length
				} skill).`,
				{ variant: 'success' },
			);
		} catch (error) {
			enqueueSnackbar(error.message, { variant: 'error' });
		} finally {
			setSaving(false);
		}
	};

	const handleSaveTargets = async () => {
		if (!grade) {
			return;
		}

		const items = selectedIds
			.map((id) => {
				const draft = targetDraft[id];

				if (!draft) {
					return null;
				}

				return {
					masterSkillId: id,
					targetLevel: draft.targetLevel,
				};
			})
			.filter(Boolean);

		if (items.length === 0) {
			enqueueSnackbar('Tidak ada skill wajib untuk disimpan targetnya.', { variant: 'warning' });
			return;
		}

		setSaving(true);

		try {
			const response = await saveSkillTargets(grade, items);
			setMapping(response);
			setBaseline((current) => ({
				...current,
				targets: items.reduce(
					(accumulator, item) => ({
						...accumulator,
						[item.masterSkillId]: { targetLevel: item.targetLevel },
					}),
					current.targets,
				),
			}));
			enqueueSnackbar(`Target level ${items.length} skill untuk ${getGradeLabel(grade)} disimpan.`, {
				variant: 'success',
			});
		} catch (error) {
			enqueueSnackbar(error.message, { variant: 'error' });
		} finally {
			setSaving(false);
		}
	};

	const handleCopyFromAbove = async () => {
		if (!grade) {
			return;
		}

		setSaving(true);

		try {
			const response = await copySkillMappingFromAbove(grade);
			setMapping(response);

			if (response.added === 0) {
				enqueueSnackbar(
					`Tidak ada skill baru dari ${response.copiedFromLabel || response.copiedFrom}. Semua ${
						response.skipped
					} skill sudah ada dan tidak ditimpa.`,
					{ variant: 'info' },
				);
			} else {
				enqueueSnackbar(
					`${response.added} skill disalin dari ${response.copiedFromLabel || response.copiedFrom}. ${
						response.skipped
					} skill sudah ada dan tidak ditimpa.`,
					{ variant: 'success' },
				);
			}
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
						<Stack justifyContent="center" height="100%">
							<Typography variant="caption" color="text.secondary" textAlign={{ md: 'right' }}>
								{`${filteredSkills.length} dari ${
									skills.filter((skill) => skill.category === category).length
								} skill`}
							</Typography>
						</Stack>
					</Grid>
				</Grid>

				<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
					<Button
						variant="outlined"
						size="small"
						startIcon={<AddOutlinedIcon />}
						onClick={openCreate}
						sx={{ whiteSpace: 'nowrap' }}
					>
						Tambah Skill Baru
					</Button>

					<Tooltip
						title={
							gradeAbove
								? `Tambahkan skill dan target level dari ${getGradeLabel(
										gradeAbove,
								  )} tanpa menimpa data yang sudah diisi`
								: 'Rank 11 adalah grade tertinggi, tidak ada grade di atasnya'
						}
					>
						<span>
							<Button
								variant="outlined"
								size="small"
								startIcon={<ContentCopyOutlinedIcon />}
								onClick={handleCopyFromAbove}
								disabled={saving || !grade || !gradeAbove}
								sx={{ whiteSpace: 'nowrap' }}
							>
								{gradeAbove ? `Salin dari ${getGradeLabel(gradeAbove)}` : 'Salin Grade Atas'}
							</Button>
						</span>
					</Tooltip>

					<Typography variant="caption" color="text.secondary" sx={{ flexGrow: 1 }}>
						Skill baru masuk ke katalog lalu dicentang untuk ditambahkan ke grade ini.
					</Typography>
				</Stack>

				<Box
					sx={{
						display: 'flex',
						flexDirection: { xs: 'column', md: 'row' },
						alignItems: { xs: 'stretch', md: 'center' },
						gap: 1.5,
						p: 1.5,
						border: '1px solid',
						borderColor: hasUnsavedChanges ? 'warning.main' : 'divider',
						borderRadius: 2,
						backgroundColor: hasUnsavedChanges
							? (theme) => alpha(theme.palette.warning.main, 0.08)
							: 'transparent',
					}}
				>
					<Stack spacing={0.25} sx={{ flexGrow: 1, minWidth: 0 }}>
						<Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
							<Chip
								size="small"
								color="primary"
								variant="outlined"
								label={`${selectedIds.length} ${CATEGORY_LABELS[category]} wajib`}
							/>
							<Chip
								size="small"
								variant="outlined"
								label={`${getGradeLabel(grade)} · ${CATEGORY_LABELS[category]}`}
							/>
							{hasUnsavedChanges ? (
								<Chip size="small" color="warning" label="Ada perubahan belum disimpan" />
							) : null}
						</Stack>
						<Typography variant="caption" color="text.secondary">
							Dua tombol simpan menyimpan hal berbeda: <strong>daftar wajib</strong> menentukan skill mana
							yang disyaratkan, sedangkan <strong>target level</strong> menentukan standar nilainya.
						</Typography>
					</Stack>

					<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ flexShrink: 0 }}>
						<Tooltip title="Simpan daftar skill yang dicentang sebagai syarat grade ini">
							<span>
								<Button
									variant="contained"
									size="small"
									startIcon={<PlaylistAddCheckOutlinedIcon />}
									onClick={handleSaveMapping}
									disabled={saving || !grade}
									sx={{ position: 'relative' }}
								>
									Simpan Daftar Wajib
									{dirty.requiredChanged ? (
										<Box
											component="span"
											sx={{
												position: 'absolute',
												top: 4,
												right: 4,
												width: 7,
												height: 7,
												borderRadius: '50%',
												backgroundColor: 'warning.light',
												border: '1px solid',
												borderColor: 'common.white',
											}}
										/>
									) : null}
								</Button>
							</span>
						</Tooltip>
						<Tooltip title="Simpan target level 0-5 untuk skill yang dicentang">
							<span>
								<Button
									variant="contained"
									size="small"
									color="secondary"
									startIcon={<TrackChangesOutlinedIcon />}
									onClick={handleSaveTargets}
									disabled={saving || !grade || selectedIds.length === 0}
									sx={{ position: 'relative' }}
								>
									Simpan Target Level
									{dirty.targetChanged ? (
										<Box
											component="span"
											sx={{
												position: 'absolute',
												top: 4,
												right: 4,
												width: 7,
												height: 7,
												borderRadius: '50%',
												backgroundColor: 'common.white',
											}}
										/>
									) : null}
								</Button>
							</span>
						</Tooltip>
					</Stack>
				</Box>

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
				<DialogTitle>
					{editing ? 'Edit Nama Skill' : 'Tambah Skill Baru'}
					<Typography variant="body2" color="text.secondary">
						{editing
							? 'Perubahan nama berlaku untuk katalog dan semua grade yang memakainya.'
							: `Ditambahkan ke katalog ${CATEGORY_LABELS[category]}.`}
					</Typography>
				</DialogTitle>
				<DialogContent dividers>
					<TextField
						fullWidth
						autoFocus
						label="Nama Skill"
						value={formName}
						onChange={(event) => setFormName(event.target.value)}
						placeholder="Contoh: Analisa Data"
						error={Boolean(formName) && formName.trim().length > 255}
						helperText={
							`Kategori: ${CATEGORY_LABELS[category]} · ` +
							`${(formName || '').trim().length}/255 karakter`
						}
						sx={{ mt: 1 }}
					/>
					{!editing ? (
						<Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1.5 }}>
							Skill baru belum menjadi syarat grade mana pun. Setelah tersimpan, centang skill ini di
							tabel lalu tekan &quot;Simpan Daftar Wajib&quot;.
						</Typography>
					) : null}
				</DialogContent>
				<DialogActions sx={{ px: 3, py: 2 }}>
					<Button onClick={() => setFormOpen(false)} disabled={saving}>
						Batal
					</Button>
					<Button
						variant="contained"
						onClick={handleSubmitForm}
						disabled={saving || !formName.trim() || formName.trim().length > 255}
					>
						{submitLabel}
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
