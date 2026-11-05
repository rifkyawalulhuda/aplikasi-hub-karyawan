import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSnackbar } from 'notistack';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';

import {
	fetchProfileImpact,
	fetchProfileOptions,
	previewProfileImpact,
	saveJobRequirementProfile,
} from '@/services/jobRequirement';
import ProfileImpactDialog from '@/components/jobRequirement/profileImpactDialog';

const EDUCATION_LABELS = {
	SMA: 'SLTA (Sederajat)',
	D3: 'D3',
	S1: 'S1',
	S2: 'S2',
};

const EMPLOYMENT_LABELS = {
	PERMANENT: 'Permanen',
	CONTRACT: 'Kontrak',
};

const GENDER_LABELS = {
	MALE: 'Laki-laki',
	FEMALE: 'Perempuan',
};

const COMPONENT_LABELS = {
	education: 'Pendidikan',
	experience: 'Pengalaman',
	employment: 'Status Karyawan',
	gender: 'Jenis Kelamin',
};

function getGradeLabel(grade = '') {
	const match = String(grade).match(/^RANK_(\d+)$/);
	return match ? `Rank ${match[1]}` : grade;
}

function buildForm(profile) {
	if (!profile) {
		return {
			minEducation: '',
			minExperienceYears: '',
			allowedEmploymentTypes: [],
			allowedGenders: [],
			sourceFormNo: '',
			sourceRev: '',
			effectiveDate: '',
			notes: '',
		};
	}

	return {
		minEducation: profile.minEducation || '',
		minExperienceYears: profile.minExperienceYears == null ? '' : String(profile.minExperienceYears),
		allowedEmploymentTypes: [...(profile.allowedEmploymentTypes || [])],
		allowedGenders: [...(profile.allowedGenders || [])],
		sourceFormNo: profile.sourceFormNo || '',
		sourceRev: profile.sourceRev || '',
		effectiveDate: profile.effectiveDate ? String(profile.effectiveDate).slice(0, 10) : '',
		notes: profile.notes || '',
	};
}

function buildPayload(form) {
	return {
		minEducation: form.minEducation || null,
		minExperienceYears: form.minExperienceYears === '' ? null : Number(form.minExperienceYears),
		allowedEmploymentTypes: form.allowedEmploymentTypes,
		allowedGenders: form.allowedGenders,
		sourceFormNo: form.sourceFormNo.trim() || null,
		sourceRev: form.sourceRev.trim() || null,
		effectiveDate: form.effectiveDate || null,
		notes: form.notes.trim() || null,
	};
}

function isSame(a, b) {
	return JSON.stringify(a) === JSON.stringify(b);
}

function toggleValue(list, value) {
	return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function describeEnumSelection(selected, allOptions, noun) {
	if (selected.length === 0) {
		return `Minimal satu ${noun} harus dipilih.`;
	}

	if (selected.length === allOptions.length) {
		return `Semua ${noun} diterima — komponen ini tidak menyaring siapa pun.`;
	}

	return `Hanya ${noun} terpilih yang memenuhi syarat.`;
}

function SyaratGradeTab({ profiles, grade, onGradeChange }) {
	const { enqueueSnackbar } = useSnackbar();
	const [options, setOptions] = useState(null);
	const [impact, setImpact] = useState(null);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [form, setForm] = useState(() => buildForm(null));
	const [baseline, setBaseline] = useState(() => buildForm(null));
	const [previewing, setPreviewing] = useState(false);
	const [confirmState, setConfirmState] = useState({ open: false, preview: null });

	const loadImpact = useCallback(async () => {
		if (!grade) {
			return;
		}

		setLoading(true);

		try {
			const response = await fetchProfileImpact(grade);
			setImpact(response);
			const nextForm = buildForm(response.profile);
			setForm(nextForm);
			setBaseline(nextForm);
		} catch (error) {
			enqueueSnackbar(error.message, { variant: 'error' });
			setImpact(null);
		} finally {
			setLoading(false);
		}
	}, [grade, enqueueSnackbar]);

	useEffect(() => {
		fetchProfileOptions()
			.then((response) => setOptions(response))
			.catch((error) => enqueueSnackbar(error.message, { variant: 'error' }));
	}, [enqueueSnackbar]);

	useEffect(() => {
		loadImpact();
	}, [loadImpact]);

	const dirty = useMemo(() => !isSame(buildPayload(form), buildPayload(baseline)), [form, baseline]);

	// Client-side guard so an obvious mistake is shown next to the field instead of
	// surfacing later as a generic server toast.
	const formErrors = useMemo(() => {
		const errors = {};

		if (!form.minEducation) {
			errors.minEducation = 'Pilih pendidikan minimal.';
		}

		if (form.allowedEmploymentTypes.length === 0) {
			errors.allowedEmploymentTypes = 'Pilih minimal satu status karyawan.';
		}

		if (form.allowedGenders.length === 0) {
			errors.allowedGenders = 'Pilih minimal satu jenis kelamin.';
		}

		return errors;
	}, [form]);

	const hasErrors = Object.keys(formErrors).length > 0;

	const employmentOptions = useMemo(() => options?.employmentTypes || Object.keys(EMPLOYMENT_LABELS), [options]);
	const genderOptions = useMemo(() => options?.genders || Object.keys(GENDER_LABELS), [options]);

	const setField = (key, value) => {
		setForm((current) => ({ ...current, [key]: value }));
	};

	const toggleEmployment = (value) => {
		setForm((current) => ({
			...current,
			allowedEmploymentTypes: toggleValue(current.allowedEmploymentTypes, value),
		}));
	};

	const toggleGender = (value) => {
		setForm((current) => ({
			...current,
			allowedGenders: toggleValue(current.allowedGenders, value),
		}));
	};

	const handleReset = () => {
		setForm(buildForm(impact?.profile));
	};

	const handleSave = async () => {
		if (!grade) {
			return;
		}

		if (hasErrors) {
			enqueueSnackbar(Object.values(formErrors)[0], { variant: 'warning' });
			return;
		}

		setPreviewing(true);

		try {
			const preview = await previewProfileImpact(grade, buildPayload(form));
			setConfirmState({ open: true, preview });
		} catch (error) {
			enqueueSnackbar(error.message, { variant: 'error' });
		} finally {
			// `saving` belongs to the confirm step only; releasing it here keeps the
			// dialog's own buttons enabled once the preview arrives.
			setPreviewing(false);
		}
	};

	const handleConfirmSave = async () => {
		if (!grade) {
			return;
		}

		setSaving(true);

		try {
			await saveJobRequirementProfile(grade, buildPayload(form));
			enqueueSnackbar(`Syarat ${getGradeLabel(grade)} disimpan.`, { variant: 'success' });
			setConfirmState({ open: false, preview: null });
			await loadImpact();
		} catch (error) {
			enqueueSnackbar(error.message, { variant: 'error' });
		} finally {
			setSaving(false);
		}
	};

	const handlePreview = async () => {
		if (!grade) {
			return;
		}

		setPreviewing(true);

		try {
			const preview = await previewProfileImpact(grade, buildPayload(form));
			setConfirmState({ open: true, preview });
		} catch (error) {
			enqueueSnackbar(error.message, { variant: 'error' });
		} finally {
			setPreviewing(false);
		}
	};

	if (!grade) {
		return <Alert severity="info">Pilih grade terlebih dahulu.</Alert>;
	}

	if (loading && !impact) {
		return (
			<Stack alignItems="center" justifyContent="center" py={10}>
				<CircularProgress />
			</Stack>
		);
	}

	return (
		<Stack spacing={2}>
			<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
				<TextField
					size="small"
					select
					label="Grade"
					value={grade}
					onChange={(event) => onGradeChange(event.target.value)}
					sx={{ minWidth: { xs: '100%', md: 200 } }}
				>
					{profiles.map((profile) => (
						<MenuItem key={profile.grade} value={profile.grade}>
							{getGradeLabel(profile.grade)}
						</MenuItem>
					))}
				</TextField>
				<Box sx={{ flexGrow: 1 }} />
				<Button
					size="small"
					variant="outlined"
					startIcon={<RestartAltOutlinedIcon />}
					onClick={handleReset}
					disabled={!dirty || saving}
				>
					Batalkan Perubahan
				</Button>
				<Button
					size="small"
					variant="outlined"
					onClick={handlePreview}
					disabled={!dirty || saving || previewing || hasErrors}
				>
					{previewing ? 'Menghitung...' : 'Pratinjau Dampak'}
				</Button>
				<Button
					size="small"
					variant="contained"
					startIcon={<SaveOutlinedIcon />}
					onClick={handleSave}
					disabled={!dirty || saving || previewing || hasErrors}
				>
					Simpan Syarat
				</Button>
			</Stack>

			{impact ? (
				<Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
					<Chip
						size="small"
						variant="outlined"
						label={`${getGradeLabel(grade)} · ${impact.current.employeeCount} karyawan`}
					/>
					<Chip
						size="small"
						color={impact.current.failingEmployeeCount > 0 ? 'error' : 'success'}
						variant="outlined"
						label={`Tidak memenuhi: ${impact.current.failingEmployeeCount}`}
					/>
					{dirty ? <Chip size="small" color="warning" label="Ada perubahan belum disimpan" /> : null}
				</Stack>
			) : null}

			<Alert severity="info">
				Komponen di bawah memengaruhi kolom <strong>STATUS</strong> di Rekap Gap, bukan persentase readiness.
				Readiness hanya dihitung dari target skill.
			</Alert>

			<Grid container spacing={2}>
				<Grid item xs={12} md={6}>
					<TextField
						fullWidth
						size="small"
						select
						label="Pendidikan Minimal"
						value={form.minEducation}
						onChange={(event) => setField('minEducation', event.target.value)}
						error={Boolean(formErrors.minEducation)}
						helperText={formErrors.minEducation || 'Dipilih dari daftar jenjang pendidikan.'}
					>
						{(options?.education || Object.keys(EDUCATION_LABELS)).map((value) => (
							<MenuItem key={value} value={value}>
								{EDUCATION_LABELS[value] || value}
							</MenuItem>
						))}
					</TextField>
				</Grid>

				<Grid item xs={12} md={6}>
					<TextField
						fullWidth
						size="small"
						type="number"
						label="Pengalaman Minimal (tahun)"
						value={form.minExperienceYears}
						onChange={(event) => setField('minExperienceYears', event.target.value)}
						inputProps={{
							min: options?.minExperienceYears ?? 0,
							max: options?.maxExperienceYears ?? 50,
						}}
						helperText="Kosongkan bila tidak ada syarat masa kerja."
					/>
				</Grid>

				<Grid item xs={12} md={6}>
					<FormControl component="fieldset" fullWidth error={Boolean(formErrors.allowedEmploymentTypes)}>
						<FormLabel component="legend">Status Karyawan yang Diterima</FormLabel>
						<Stack direction="row" spacing={1}>
							{employmentOptions.map((value) => (
								<Chip
									key={value}
									label={EMPLOYMENT_LABELS[value] || value}
									color={form.allowedEmploymentTypes.includes(value) ? 'primary' : 'default'}
									variant={form.allowedEmploymentTypes.includes(value) ? 'filled' : 'outlined'}
									onClick={() => toggleEmployment(value)}
								/>
							))}
						</Stack>
						<FormHelperText>
							{describeEnumSelection(form.allowedEmploymentTypes, employmentOptions, 'status')}
						</FormHelperText>
					</FormControl>
				</Grid>

				<Grid item xs={12} md={6}>
					<FormControl component="fieldset" fullWidth error={Boolean(formErrors.allowedGenders)}>
						<FormLabel component="legend">Jenis Kelamin yang Diterima</FormLabel>
						<Stack direction="row" spacing={1}>
							{genderOptions.map((value) => (
								<Chip
									key={value}
									label={GENDER_LABELS[value] || value}
									color={form.allowedGenders.includes(value) ? 'primary' : 'default'}
									variant={form.allowedGenders.includes(value) ? 'filled' : 'outlined'}
									onClick={() => toggleGender(value)}
								/>
							))}
						</Stack>
						<FormHelperText>
							{describeEnumSelection(form.allowedGenders, genderOptions, 'jenis kelamin')}
						</FormHelperText>
					</FormControl>
				</Grid>
			</Grid>

			<Divider />

			<Typography variant="subtitle2" fontWeight={700}>
				Metadata Sumber
			</Typography>

			<Grid container spacing={2}>
				<Grid item xs={12} md={4}>
					<TextField
						fullWidth
						size="small"
						label="No. Form"
						value={form.sourceFormNo}
						onChange={(event) => setField('sourceFormNo', event.target.value)}
						placeholder="SII-QSHE-002-03"
					/>
				</Grid>
				<Grid item xs={12} md={4}>
					<TextField
						fullWidth
						size="small"
						label="Revisi"
						value={form.sourceRev}
						onChange={(event) => setField('sourceRev', event.target.value)}
						placeholder="01"
					/>
				</Grid>
				<Grid item xs={12} md={4}>
					<TextField
						fullWidth
						size="small"
						type="date"
						label="Tanggal Berlaku"
						value={form.effectiveDate}
						onChange={(event) => setField('effectiveDate', event.target.value)}
						InputLabelProps={{ shrink: true }}
					/>
				</Grid>
				<Grid item xs={12}>
					<TextField
						fullWidth
						size="small"
						multiline
						minRows={2}
						label="Catatan Internal"
						value={form.notes}
						onChange={(event) => setField('notes', event.target.value)}
					/>
				</Grid>
			</Grid>

			{impact ? (
				<>
					<Divider />
					<Typography variant="subtitle2" fontWeight={700}>
						Dampak Syarat Saat Ini
					</Typography>
					<Grid container spacing={1.5}>
						{impact.current.components.map((component) => (
							<Grid item xs={12} sm={6} md={3} key={component.key}>
								<Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
									<Typography variant="caption" color="text.secondary">
										{COMPONENT_LABELS[component.key] || component.label}
									</Typography>
									<Typography
										variant="h6"
										color={component.failCount > 0 ? 'error.main' : 'text.primary'}
									>
										{component.failCount}
									</Typography>
									<Typography variant="caption" color="text.secondary">
										tidak memenuhi
									</Typography>
								</Box>
							</Grid>
						))}
					</Grid>

					{impact.current.failingEmployeeCount > 0 ? (
						<Box>
							<Typography variant="caption" color="text.secondary">
								Karyawan yang tidak memenuhi syarat saat ini:
							</Typography>
							<Stack spacing={0.75} sx={{ mt: 0.75 }}>
								{impact.current.components
									.filter((component) => component.failCount > 0)
									.map((component) => (
										<Box key={component.key}>
											<Typography variant="body2" fontWeight={600}>
												{COMPONENT_LABELS[component.key]} ({component.failCount})
											</Typography>
											<Typography variant="caption" color="text.secondary">
												{component.employees
													.map(
														(item) =>
															`${item.fullName} (${item.actual} → butuh ${item.required})`,
													)
													.join(', ')}
											</Typography>
										</Box>
									))}
							</Stack>
						</Box>
					) : (
						<Alert severity="success">
							Seluruh {impact.current.employeeCount} karyawan pada grade ini memenuhi syarat wajib.
						</Alert>
					)}
				</>
			) : null}

			<ProfileImpactDialog
				open={confirmState.open}
				onClose={() => setConfirmState({ open: false, preview: null })}
				onConfirm={handleConfirmSave}
				preview={confirmState.preview}
				grade={grade}
				saving={saving}
			/>
		</Stack>
	);
}

export default SyaratGradeTab;
