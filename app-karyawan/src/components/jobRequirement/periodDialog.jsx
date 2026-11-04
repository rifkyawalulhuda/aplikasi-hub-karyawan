import { useCallback, useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';

import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

import { createAssessmentPeriod, fetchAssessmentPeriods, updateAssessmentPeriod } from '@/services/jobRequirement';

function toInputDate(value) {
	if (!value) {
		return '';
	}

	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

function PeriodDialog({ open, onClose, onChanged }) {
	const { enqueueSnackbar } = useSnackbar();
	const [periods, setPeriods] = useState([]);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [form, setForm] = useState({ name: '', startDate: '', endDate: '' });

	const load = useCallback(async () => {
		setLoading(true);

		try {
			const rows = await fetchAssessmentPeriods();
			setPeriods(rows);
		} catch (error) {
			enqueueSnackbar(error.message, { variant: 'error' });
		} finally {
			setLoading(false);
		}
	}, [enqueueSnackbar]);

	useEffect(() => {
		if (open) {
			load();
		}
	}, [open, load]);

	const handleCreate = async () => {
		setSaving(true);

		try {
			await createAssessmentPeriod({ ...form, isActive: periods.length === 0 });
			enqueueSnackbar('Periode asesmen dibuat.', { variant: 'success' });
			setForm({ name: '', startDate: '', endDate: '' });
			await load();

			if (typeof onChanged === 'function') {
				onChanged();
			}
		} catch (error) {
			enqueueSnackbar(error.message, { variant: 'error' });
		} finally {
			setSaving(false);
		}
	};

	const handleActivate = async (period) => {
		setSaving(true);

		try {
			await updateAssessmentPeriod(period.id, { isActive: true });
			enqueueSnackbar(`Periode ${period.name} diaktifkan.`, { variant: 'success' });
			await load();

			if (typeof onChanged === 'function') {
				onChanged();
			}
		} catch (error) {
			enqueueSnackbar(error.message, { variant: 'error' });
		} finally {
			setSaving(false);
		}
	};

	return (
		<Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
			<DialogTitle>Periode Asesmen</DialogTitle>
			<DialogContent dividers>
				<Stack spacing={2}>
					<Typography variant="body2" color="text.secondary">
						Hanya satu periode yang aktif. Asesmen baru otomatis masuk ke periode aktif; periode lama
						menyimpan riwayat dan tidak bisa dihapus bila sudah berisi asesmen.
					</Typography>

					{loading ? (
						<Stack alignItems="center" py={3}>
							<CircularProgress size={24} />
						</Stack>
					) : (
						<Stack spacing={1}>
							{periods.length === 0 ? (
								<Typography variant="body2" color="text.secondary">
									Belum ada periode.
								</Typography>
							) : (
								periods.map((period) => (
									<Stack
										key={period.id}
										direction="row"
										spacing={1}
										alignItems="center"
										sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5 }}
									>
										<Stack sx={{ flex: 1 }}>
											<Typography variant="body2" fontWeight={600}>
												{period.name}
											</Typography>
											<Typography variant="caption" color="text.secondary">
												{toInputDate(period.startDate)} s.d. {toInputDate(period.endDate)} -{' '}
												{period.assessmentCount ?? 0} asesmen
											</Typography>
										</Stack>
										{period.isActive ? (
											<Chip
												size="small"
												color="success"
												icon={<CheckCircleOutlineIcon />}
												label="Aktif"
											/>
										) : (
											<Button
												size="small"
												onClick={() => handleActivate(period)}
												disabled={saving}
											>
												Aktifkan
											</Button>
										)}
									</Stack>
								))
							)}
						</Stack>
					)}

					<Stack spacing={1.5}>
						<Typography variant="subtitle2">Tambah Periode</Typography>
						<TextField
							fullWidth
							size="small"
							label="Nama Periode"
							placeholder="2026-S2"
							value={form.name}
							onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
						/>
						<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
							<TextField
								fullWidth
								size="small"
								type="date"
								label="Mulai"
								InputLabelProps={{ shrink: true }}
								value={form.startDate}
								onChange={(event) =>
									setForm((current) => ({ ...current, startDate: event.target.value }))
								}
							/>
							<TextField
								fullWidth
								size="small"
								type="date"
								label="Selesai"
								InputLabelProps={{ shrink: true }}
								value={form.endDate}
								onChange={(event) =>
									setForm((current) => ({ ...current, endDate: event.target.value }))
								}
							/>
						</Stack>
						<Button
							variant="outlined"
							startIcon={<AddOutlinedIcon />}
							onClick={handleCreate}
							disabled={saving || !form.name || !form.startDate || !form.endDate}
						>
							Tambah Periode
						</Button>
					</Stack>
				</Stack>
			</DialogContent>
			<DialogActions sx={{ px: 3, py: 2 }}>
				<Button onClick={onClose} disabled={saving}>
					Tutup
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default PeriodDialog;
