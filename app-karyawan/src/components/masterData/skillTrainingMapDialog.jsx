import { useEffect, useMemo, useState } from 'react';
import { useSnackbar } from 'notistack';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';

import { saveSkillTrainingMap } from '@/services/masterSkill';

function SkillTrainingMapDialog({ open, onClose, skill, trainings = [], onSaved }) {
	const { enqueueSnackbar } = useSnackbar();
	const [selectedIds, setSelectedIds] = useState([]);
	const [search, setSearch] = useState('');
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (!open || !skill) {
			return;
		}

		setSelectedIds((skill.trainings || []).map((training) => training.id));
		setSearch('');
	}, [open, skill]);

	const filtered = useMemo(() => {
		const keyword = search.trim().toLowerCase();

		if (!keyword) {
			return trainings;
		}

		return trainings.filter((training) => `${training.name} ${training.category}`.toLowerCase().includes(keyword));
	}, [trainings, search]);

	const toggle = (id) => {
		setSelectedIds((current) =>
			current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
		);
	};

	const handleSave = async () => {
		setSaving(true);

		try {
			const result = await saveSkillTrainingMap(skill.id, selectedIds);
			enqueueSnackbar(
				`Pemetaan training untuk "${result.skillName}" disimpan (${result.trainings.length} training).`,
				{ variant: 'success' },
			);

			if (typeof onSaved === 'function') {
				onSaved(result);
			}

			onClose();
		} catch (error) {
			enqueueSnackbar(error.message, { variant: 'error' });
		} finally {
			setSaving(false);
		}
	};

	return (
		<Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
			<DialogTitle>
				Training untuk Skill
				<Typography variant="body2" color="text.secondary">
					{skill?.name} - {skill?.category === 'SOFT_SKILL' ? 'Soft Skill' : 'Hard Skill'}
				</Typography>
			</DialogTitle>
			<DialogContent dividers>
				<Stack spacing={2}>
					<Typography variant="body2" color="text.secondary">
						Training yang dipilih akan direkomendasikan otomatis ketika karyawan belum mencapai target level
						pada skill ini.
					</Typography>
					<TextField
						fullWidth
						size="small"
						label="Cari Training"
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
					<Chip
						size="small"
						variant="outlined"
						color="primary"
						sx={{ alignSelf: 'flex-start' }}
						label={`${selectedIds.length} training dipilih`}
					/>
					<Box sx={{ maxHeight: 380, overflowY: 'auto' }}>
						<Stack spacing={0.5}>
							{filtered.length === 0 ? (
								<Typography variant="body2" color="text.secondary" py={2}>
									Tidak ada training yang cocok.
								</Typography>
							) : (
								filtered.map((training) => (
									<Stack
										key={training.id}
										direction="row"
										alignItems="center"
										spacing={1}
										sx={{
											px: 1,
											py: 0.5,
											borderRadius: 1,
											cursor: 'pointer',
											'&:hover': { backgroundColor: 'action.hover' },
										}}
										onClick={() => toggle(training.id)}
									>
										<Checkbox
											size="small"
											checked={selectedIds.includes(training.id)}
											onChange={() => toggle(training.id)}
											onClick={(event) => event.stopPropagation()}
										/>
										<Stack sx={{ flex: 1, minWidth: 0 }}>
											<Typography variant="body2" noWrap>
												{training.name}
											</Typography>
											{training.category ? (
												<Typography variant="caption" color="text.secondary">
													{training.category}
												</Typography>
											) : null}
										</Stack>
									</Stack>
								))
							)}
						</Stack>
					</Box>
				</Stack>
			</DialogContent>
			<DialogActions sx={{ px: 3, py: 2 }}>
				<Button onClick={onClose} disabled={saving}>
					Batal
				</Button>
				<Button variant="contained" onClick={handleSave} disabled={saving}>
					{saving ? <CircularProgress size={20} color="inherit" /> : 'Simpan Pemetaan'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default SkillTrainingMapDialog;
