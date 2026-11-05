import { useEffect, useMemo, useState } from 'react';
import { useSnackbar } from 'notistack';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { deleteEmployeeSkillAssessment, saveEmployeeSkillAssessments } from '@/services/jobRequirement';

const LEVEL_OPTIONS = [
	{ value: 0, label: '0 - Tidak terpapar' },
	{ value: 1, label: '1 - Memahami konsep' },
	{ value: 2, label: '2 - Dapat dengan supervisi' },
	{ value: 3, label: '3 - Mandiri' },
	{ value: 4, label: '4 - Melatih orang lain' },
	{ value: 5, label: '5 - Rujukan / penyusun standar' },
];

function buildKey(category, name) {
	return `${category}::${name}`;
}

function SkillAssessmentDialog({
	open,
	onClose,
	employeeId,
	employeeName,
	periodId,
	profile,
	assessments = [],
	onSaved,
}) {
	const { enqueueSnackbar } = useSnackbar();
	const [activeTab, setActiveTab] = useState('SOFT_SKILL');
	const [levels, setLevels] = useState({});
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (!open) {
			return;
		}

		const initialLevels = {};

		assessments.forEach((assessment) => {
			initialLevels[buildKey(assessment.category, assessment.skillName)] = assessment.level;
		});

		setLevels(initialLevels);
		setActiveTab('SOFT_SKILL');
	}, [open, assessments]);

	// Skills with target 0 are not a requirement, so they are excluded from the
	// denominator and from the completeness counter — same rule as readiness.
	const requiredSkills = useMemo(
		() => (profile?.skills || []).filter((skill) => (skill.targetLevel ?? 3) > 0),
		[profile],
	);
	const softSkills = useMemo(
		() => requiredSkills.filter((skill) => skill.category === 'SOFT_SKILL'),
		[requiredSkills],
	);
	const hardSkills = useMemo(
		() => requiredSkills.filter((skill) => skill.category === 'HARD_SKILL'),
		[requiredSkills],
	);

	const skills = activeTab === 'SOFT_SKILL' ? softSkills : hardSkills;
	const filledCount = requiredSkills.filter((skill) => {
		const value = levels[buildKey(skill.category, skill.name)];

		return value !== '' && value != null;
	}).length;
	const totalSkills = requiredSkills.length;

	const handleChange = (category, name, value) => {
		setLevels((current) => ({
			...current,
			[buildKey(category, name)]: value === '' ? '' : Number(value),
		}));
	};

	const handleReset = async (category, name) => {
		setSaving(true);

		try {
			await deleteEmployeeSkillAssessment(employeeId, category, name, periodId);
			setLevels((current) => ({
				...current,
				[buildKey(category, name)]: '',
			}));
			enqueueSnackbar(`Asesmen "${name}" dihapus.`, { variant: 'success' });

			if (typeof onSaved === 'function') {
				onSaved();
			}
		} catch (error) {
			enqueueSnackbar(error.message, { variant: 'error' });
		} finally {
			setSaving(false);
		}
	};

	const handleSave = async () => {
		setSaving(true);

		try {
			const payload = [...softSkills, ...hardSkills]
				.map((skill) => {
					const value = levels[buildKey(skill.category, skill.name)];

					if (value === '' || value == null) {
						return null;
					}

					return {
						category: skill.category,
						skillName: skill.name,
						level: Number(value),
					};
				})
				.filter(Boolean);

			if (payload.length === 0) {
				enqueueSnackbar('Tidak ada nilai yang diisi.', { variant: 'warning' });
				setSaving(false);
				return;
			}

			const result = await saveEmployeeSkillAssessments(employeeId, payload, periodId);
			enqueueSnackbar(`Asesmen tersimpan (${result.updated} item).`, { variant: 'success' });

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
		<Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
			<DialogTitle>
				Asesmen Kompetensi
				{employeeName ? (
					<Typography variant="body2" color="text.secondary">
						{employeeName}
					</Typography>
				) : null}
			</DialogTitle>
			<DialogContent dividers>
				<Stack spacing={2}>
					{!periodId ? (
						<Alert severity="warning">
							Belum ada periode asesmen aktif. Penilaian belum bisa disimpan sampai periode diaktifkan.
						</Alert>
					) : null}
					<Alert severity="info">
						Skala 0-5: 0 tidak terpapar, 3 mandiri, 5 rujukan/penyusun standar. Readiness dihitung dari
						seluruh skill wajib, sehingga skill yang dibiarkan kosong dihitung 0.
					</Alert>
					<Alert severity={filledCount === totalSkills ? 'success' : 'warning'}>
						{filledCount === totalSkills
							? `Asesmen lengkap: ${filledCount} dari ${totalSkills} skill terisi.`
							: `Baru ${filledCount} dari ${totalSkills} skill terisi. Status Siap belum bisa diberikan sampai semua skill dinilai.`}
					</Alert>
					<Tabs value={activeTab} onChange={(_event, value) => setActiveTab(value)} variant="fullWidth">
						<Tab value="SOFT_SKILL" label={`Soft Skill (${softSkills.length})`} />
						<Tab value="HARD_SKILL" label={`Hard Skill (${hardSkills.length})`} />
					</Tabs>

					{skills.length === 0 ? (
						<Box py={4} textAlign="center">
							<Typography variant="body2" color="text.secondary">
								Tidak ada item pada kategori ini.
							</Typography>
						</Box>
					) : (
						<Stack spacing={1.5}>
							{skills.map((skill) => {
								const key = buildKey(skill.category, skill.name);
								const value = levels[key] ?? '';
								const isBelowTarget =
									value !== '' && value != null && Number(value) < (skill.targetLevel ?? 3);

								return (
									<Stack key={key} direction="row" spacing={1} alignItems="flex-start">
										<Tooltip title={`Target level ${skill.targetLevel ?? 3}`}>
											<Chip
												size="small"
												variant="outlined"
												label={`T${skill.targetLevel ?? 3}`}
												sx={{ mt: 1, flexShrink: 0 }}
											/>
										</Tooltip>
										<TextField
											select
											fullWidth
											size="small"
											label={skill.name}
											value={value}
											onChange={(event) =>
												handleChange(skill.category, skill.name, event.target.value)
											}
											error={isBelowTarget}
											helperText={isBelowTarget ? 'Di bawah target' : undefined}
										>
											<MenuItem value="">
												<em>Belum dinilai</em>
											</MenuItem>
											{LEVEL_OPTIONS.map((option) => (
												<MenuItem key={option.value} value={option.value}>
													{option.label}
												</MenuItem>
											))}
										</TextField>
										<Button
											size="small"
											color="inherit"
											disabled={saving || value === ''}
											onClick={() => handleReset(skill.category, skill.name)}
											sx={{ mt: 0.5, minWidth: 0 }}
										>
											Hapus
										</Button>
									</Stack>
								);
							})}
						</Stack>
					)}
				</Stack>
			</DialogContent>
			<DialogActions sx={{ px: 3, py: 2 }}>
				<Button onClick={onClose} disabled={saving}>
					Batal
				</Button>
				<Button variant="contained" onClick={handleSave} disabled={saving || !periodId}>
					{saving ? <CircularProgress size={20} color="inherit" /> : 'Simpan Asesmen'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default SkillAssessmentDialog;
