import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

const PREVIEW_LIMIT = 8;

const COMPONENT_LABELS = {
	education: 'Pendidikan',
	experience: 'Pengalaman',
	employment: 'Status Karyawan',
	gender: 'Jenis Kelamin',
};

function getGradeLabel(grade = '') {
	const match = String(grade).match(/^RANK_(\d+)/);
	return match ? `Rank ${match[1]}` : grade;
}

function EmployeeList({ items }) {
	const shown = items.slice(0, PREVIEW_LIMIT);
	const rest = items.length - shown.length;

	return (
		<Box>
			{shown.map((item) => (
				<Typography key={item.employeeId} variant="caption" color="text.secondary" display="block">
					{item.fullName} ({item.employeeNo}) — {item.actual} → butuh {item.required}
				</Typography>
			))}
			{rest > 0 ? (
				<Typography variant="caption" color="text.disabled">
					+{rest} karyawan lainnya
				</Typography>
			) : null}
		</Box>
	);
}

function ProfileImpactDialog({ open, onClose, onConfirm, preview, grade, saving }) {
	if (!preview) {
		return null;
	}

	const { diff, current, proposed } = preview;
	const nothingChanged = diff.newlyFailingCount === 0 && diff.newlyPassingCount === 0;

	return (
		<Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
			<DialogTitle>
				Konfirmasi Perubahan Syarat
				<Typography variant="body2" color="text.secondary">
					{getGradeLabel(grade)} · {proposed?.employeeCount ?? current.employeeCount} karyawan
				</Typography>
			</DialogTitle>
			<DialogContent dividers>
				<Stack spacing={2}>
					{nothingChanged ? (
						<Alert severity="info">Perubahan ini tidak mengubah status kelayakan karyawan mana pun.</Alert>
					) : null}

					{diff.newlyFailingCount > 0 ? (
						<Alert severity="warning">
							<strong>
								{diff.newlyFailingCount} karyawan akan berubah dari Memenuhi menjadi Belum Memenuhi.
							</strong>
							<Box sx={{ mt: 1 }}>
								<EmployeeList items={diff.newlyFailing} />
							</Box>
						</Alert>
					) : null}

					{diff.newlyPassingCount > 0 ? (
						<Alert severity="success">
							<strong>
								{diff.newlyPassingCount} karyawan akan berubah dari Belum Memenuhi menjadi Memenuhi.
							</strong>
							<Box sx={{ mt: 1 }}>
								<EmployeeList items={diff.newlyPassing} />
							</Box>
						</Alert>
					) : null}

					<Box>
						<Typography variant="subtitle2" fontWeight={700} gutterBottom>
							Rincian per komponen (setelah disimpan)
						</Typography>
						<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
							{(proposed?.components || []).map((component) => (
								<Chip
									key={component.key}
									size="small"
									variant="outlined"
									color={component.failCount > 0 ? 'error' : 'success'}
									label={`${COMPONENT_LABELS[component.key] || component.label}: ${
										component.failCount
									}`}
								/>
							))}
						</Stack>
					</Box>

					<Typography variant="caption" color="text.secondary">
						Total tidak memenuhi: {current.failingEmployeeCount} → {proposed?.failingEmployeeCount ?? 0}
					</Typography>
				</Stack>
			</DialogContent>
			<DialogActions sx={{ px: 3, py: 2 }}>
				<Button onClick={onClose} disabled={saving}>
					Batal
				</Button>
				<Button variant="contained" onClick={onConfirm} disabled={saving}>
					{saving ? <CircularProgress size={20} color="inherit" /> : 'Simpan Syarat'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default ProfileImpactDialog;
