import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSnackbar } from 'notistack';

import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';

import EnhancedTable, { createRowNumberColumn } from '@/components/dataTable';
import SkillTrainingMapDialog from '@/components/masterData/skillTrainingMapDialog';
import TrainingUsageDialog from '@/components/masterData/trainingUsageDialog';
import { fetchSkillTrainingMap } from '@/services/masterSkill';

const CATEGORY_LABELS = {
	SOFT_SKILL: 'Soft Skill',
	HARD_SKILL: 'Hard Skill',
};

function TrainingMapTab() {
	const { enqueueSnackbar } = useSnackbar();
	const [loading, setLoading] = useState(true);
	const [payload, setPayload] = useState({ skills: [], trainings: [], totalMappings: 0 });
	const [search, setSearch] = useState('');
	const [category, setCategory] = useState('ALL');
	const [dialogState, setDialogState] = useState({ open: false, skill: null });
	const [usageState, setUsageState] = useState({ open: false, training: null });

	const load = useCallback(async () => {
		setLoading(true);

		try {
			const result = await fetchSkillTrainingMap();
			setPayload(result);
		} catch (error) {
			enqueueSnackbar(error.message, { variant: 'error' });
		} finally {
			setLoading(false);
		}
	}, [enqueueSnackbar]);

	useEffect(() => {
		load();
	}, [load]);

	const filtered = useMemo(() => {
		const keyword = search.trim().toLowerCase();

		return (payload.skills || [])
			.filter((skill) => (category === 'ALL' ? true : skill.category === category))
			.filter((skill) => (keyword ? skill.name.toLowerCase().includes(keyword) : true));
	}, [payload.skills, category, search]);

	const columns = useMemo(
		() => [
			createRowNumberColumn(),
			{ field: 'name', headerName: 'SKILL', minWidth: 240, flex: 1 },
			{
				field: 'category',
				headerName: 'KATEGORI',
				minWidth: 130,
				renderCell: (params) => (
					<Chip
						size="small"
						variant="outlined"
						color={params.value === 'SOFT_SKILL' ? 'primary' : 'secondary'}
						label={CATEGORY_LABELS[params.value] || params.value}
					/>
				),
			},
			{
				field: 'trainings',
				headerName: 'TRAINING YANG DIREKOMENDASIKAN',
				minWidth: 380,
				flex: 1.6,
				sortable: false,
				renderCell: (params) => {
					const rows = params.value || [];

					if (rows.length === 0) {
						return (
							<Typography variant="caption" color="text.disabled">
								Belum dipetakan
							</Typography>
						);
					}

					return (
						<Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ py: 0.5 }}>
							{rows.slice(0, 3).map((training) => (
								<Tooltip key={training.id} title="Lihat detail & pemakaian training">
									<Chip
										size="small"
										variant="outlined"
										label={training.name}
										onClick={(event) => {
											event.stopPropagation();
											setUsageState({ open: true, training });
										}}
										sx={{ cursor: 'pointer' }}
									/>
								</Tooltip>
							))}
							{rows.length > 3 ? (
								<Chip
									size="small"
									variant="outlined"
									label={`+${rows.length - 3} lainnya`}
									onClick={(event) => {
										event.stopPropagation();
										setDialogState({ open: true, skill: params.row });
									}}
									sx={{ cursor: 'pointer' }}
								/>
							) : null}
						</Stack>
					);
				},
			},
			{
				field: 'actions',
				headerName: 'AKSI',
				minWidth: 120,
				sortable: false,
				renderCell: (params) => (
					<Button
						size="small"
						variant="outlined"
						onClick={(event) => {
							event.stopPropagation();
							setDialogState({ open: true, skill: params.row });
						}}
					>
						Atur
					</Button>
				),
			},
		],
		[],
	);

	return (
		<Stack spacing={2}>
			<Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
				<Chip size="small" color="primary" variant="outlined" label={`${payload.totalMappings} pemetaan`} />
				<Typography variant="caption" color="text.secondary">
					Pemetaan ini menjadi dasar rekomendasi training otomatis dari skill gap. Mulai kosong dan diisi
					manual oleh HR, bukan ditebak dari kemiripan nama.
				</Typography>
			</Stack>

			<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
				<TextField
					size="small"
					label="Cari Skill"
					value={search}
					onChange={(event) => setSearch(event.target.value)}
					sx={{ minWidth: 260 }}
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<SearchOutlinedIcon fontSize="small" />
							</InputAdornment>
						),
					}}
				/>
				<TextField
					size="small"
					select
					label="Kategori"
					value={category}
					onChange={(event) => setCategory(event.target.value)}
					sx={{ minWidth: 180 }}
					SelectProps={{ native: true }}
				>
					<option value="ALL">Semua Kategori</option>
					<option value="SOFT_SKILL">Soft Skill</option>
					<option value="HARD_SKILL">Hard Skill</option>
				</TextField>
			</Stack>

			{loading ? (
				<Stack alignItems="center" justifyContent="center" py={8}>
					<CircularProgress />
				</Stack>
			) : (
				<EnhancedTable
					rows={filtered}
					columns={columns}
					getRowId={(row) => row.id}
					columnResizeKey="skill-training-map-table"
					getContextMenuActions={(row) => [
						{
							label: 'Atur Training',
							onClick: () => setDialogState({ open: true, skill: row }),
						},
					]}
				/>
			)}

			<SkillTrainingMapDialog
				open={dialogState.open}
				onClose={() => setDialogState({ open: false, skill: null })}
				skill={dialogState.skill}
				trainings={payload.trainings || []}
				onSaved={load}
			/>

			<TrainingUsageDialog
				open={usageState.open}
				onClose={() => setUsageState({ open: false, training: null })}
				training={usageState.training}
			/>
		</Stack>
	);
}

export default TrainingMapTab;
