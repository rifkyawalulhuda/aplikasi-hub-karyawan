import { useEffect, useMemo, useState } from 'react';
import { useSnackbar } from 'notistack';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
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
import Typography from '@mui/material/Typography';

import { saveEmployeeSkillAssessments } from '@/services/jobRequirement';

const SKILL_PASS_LEVEL = 3;
const LEVEL_OPTIONS = [
	{ value: 1, label: '1 - Sangat Kurang' },
	{ value: 2, label: '2 - Kurang' },
	{ value: 3, label: '3 - Cukup (lulus)' },
	{ value: 4, label: '4 - Baik' },
	{ value: 5, label: '5 - Sangat Baik' },
];

function buildKey(category, name) {
	return `${category}::${name}`;
}

function SkillAssessmentDialog({ open, onClose, employeeId, profile, assessments = [], onSaved }) {
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

	const softSkills = useMemo(
		() => (profile?.skills || []).filter((skill) => skill.category === 'SOFT_SKILL'),
		[profile],
	);
	const hardSkills = useMemo(
		() => (profile?.skills || []).filter((skill) => skill.category === 'HARD_SKILL'),
		[profile],
	);

	const skills = activeTab === 'SOFT_SKILL' ? softSkills : hardSkills;
	const assessedCount = Object.values(levels).filter((value) => Number(value) > 0).length;
	const totalSkills = softSkills.length + hardSkills.length;

	const handleChange = (category, name, value) => {
		setLevels((current) => ({
			...current,
			[buildKey(category, name)]: Number(value),
		}));
	};

	const handleSave = async () => {
		setSaving(true);

		try {
			const payload = [...softSkills, ...hardSkills]
				.map((skill) => ({
					category: skill.category,
					skillName: skill.name,
					level: Number(levels[buildKey(skill.category, skill.name)] || 0),
				}))
				.filter((item) => item.level > 0);

			const result = await saveEmployeeSkillAssessments(employeeId, payload);
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
			<DialogTitle>Input Asesmen Skill</DialogTitle>
			<DialogContent dividers>
				<Stack spacing={2}>
					<Alert severity="info">
						Level lulus adalah {SKILL_PASS_LEVEL} dari 5. Skill yang belum diisi akan dihitung sebagai
						&quot;Belum Dinilai&quot;.
					</Alert>
					<Typography variant="body2" color="text.secondary">
						Terisi {assessedCount} dari {totalSkills} item requirement.
					</Typography>
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
								const value = levels[buildKey(skill.category, skill.name)] || '';

								return (
									<TextField
										key={skill.id || skill.name}
										select
										fullWidth
										size="small"
										label={skill.name}
										value={value}
										onChange={(event) =>
											handleChange(skill.category, skill.name, event.target.value)
										}
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
				<Button variant="contained" onClick={handleSave} disabled={saving}>
					{saving ? <CircularProgress size={20} color="inherit" /> : 'Simpan Asesmen'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default SkillAssessmentDialog;
