import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';

import { fetchMasterTrainingUsage } from '@/services/masterTraining';

function UsageRow({ label, value, children }) {
	return (
		<Stack direction="row" spacing={2} alignItems="flex-start">
			<Typography variant="body2" color="text.secondary" sx={{ minWidth: 150, flexShrink: 0 }}>
				{label}
			</Typography>
			<Box sx={{ flex: 1 }}>
				{children || (
					<Typography variant="body2" fontWeight={600}>
						{value}
					</Typography>
				)}
			</Box>
		</Stack>
	);
}

function TrainingUsageDialog({ open, onClose, training }) {
	const navigate = useNavigate();
	const { enqueueSnackbar } = useSnackbar();
	const [loading, setLoading] = useState(true);
	const [payload, setPayload] = useState(null);

	const load = useCallback(async () => {
		if (!training?.id) {
			return;
		}

		setLoading(true);

		try {
			const result = await fetchMasterTrainingUsage(training.id);
			setPayload(result);
		} catch (error) {
			enqueueSnackbar(error.message, { variant: 'error' });
			setPayload(null);
		} finally {
			setLoading(false);
		}
	}, [training?.id, enqueueSnackbar]);

	useEffect(() => {
		if (open) {
			load();
		}
	}, [open, load]);

	const handleOpenHistory = () => {
		const name = payload?.name || training?.name;

		if (!name) {
			return;
		}

		navigate(`/data-karyawan/pelatihan-karyawan?search=${encodeURIComponent(name)}`);
		onClose();
	};

	const renderContent = () => {
		if (loading) {
			return (
				<Stack alignItems="center" py={4}>
					<CircularProgress size={26} />
				</Stack>
			);
		}

		if (!payload) {
			return (
				<Typography variant="body2" color="text.secondary">
					Data pemakaian tidak tersedia.
				</Typography>
			);
		}

		return (
			<Stack spacing={2} divider={<Divider flexItem />}>
				<UsageRow label="Kategori" value={payload.category || 'Tanpa kategori'} />

				<UsageRow label="Wajib di grade">
					{payload.requirementGrades.length === 0 ? (
						<Typography variant="body2" color="text.disabled">
							Tidak wajib di grade mana pun
						</Typography>
					) : (
						<Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
							{payload.requirementGrades.map((row) => (
								<Chip key={row.grade} size="small" variant="outlined" label={row.gradeLabel} />
							))}
						</Stack>
					)}
				</UsageRow>

				<UsageRow label="Rekomendasi untuk skill">
					{payload.skillMaps.length === 0 ? (
						<Typography variant="body2" color="text.disabled">
							Belum dipetakan ke skill mana pun
						</Typography>
					) : (
						<Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
							{payload.skillMaps.map((skill) => (
								<Chip
									key={skill.id}
									size="small"
									variant="outlined"
									color={skill.category === 'SOFT_SKILL' ? 'primary' : 'secondary'}
									label={skill.name}
								/>
							))}
						</Stack>
					)}
				</UsageRow>

				<UsageRow label="Riwayat pelatihan">
					<Typography variant="body2" fontWeight={600}>
						{`${payload.employeeTrainingCount} catatan · ${payload.participantCount} peserta`}
					</Typography>
				</UsageRow>
			</Stack>
		);
	};

	return (
		<Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
			<DialogTitle>
				Detail Training
				<Typography variant="body2" color="text.secondary">
					{payload?.name || training?.name}
				</Typography>
			</DialogTitle>
			<DialogContent dividers>{renderContent()}</DialogContent>
			<DialogActions sx={{ px: 3, py: 2 }}>
				<Button onClick={onClose}>Tutup</Button>
				<Button
					variant="contained"
					startIcon={<HistoryOutlinedIcon />}
					onClick={handleOpenHistory}
					disabled={loading || !payload}
				>
					Lihat Riwayat Pelatihan
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default TrainingUsageDialog;
