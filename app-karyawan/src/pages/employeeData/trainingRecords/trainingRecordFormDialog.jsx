import { useEffect, useMemo } from 'react';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';

import Autocomplete from '@mui/material/Autocomplete';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import FormInput from '@/components/formInput';

import { calculateTrainingDays } from './utils';

function toDefaultParticipantIds(initialValue) {
	const participantIds = initialValue?.participantEmployeeIds?.length ? initialValue.participantEmployeeIds : [''];
	return participantIds.map((id) => (id ? String(id) : ''));
}

function toDefaultValues(initialValue) {
	return {
		trainingType: initialValue?.trainingType || 'Internal',
		participantEmployeeIds: toDefaultParticipantIds(initialValue),
		material: initialValue?.material || '',
		trainerInstitution: initialValue?.trainerInstitution || '',
		trainerName: initialValue?.trainerName || '',
		startDate: initialValue?.startDate || '',
		endDate: initialValue?.endDate || '',
		address: initialValue?.address || '',
		notes: initialValue?.notes || '',
	};
}

function isEmployeeOptionEqualToValue(option, value) {
	return option.id === value.id;
}

function getEmployeeSearchLabel(employee) {
	if (!employee) {
		return '';
	}

	return `${employee.fullName} (${employee.employeeNo})`;
}

function TrainingRecordFormDialog({ open, loading, initialValue, employeeOptions, onClose, onSubmit }) {
	const isEditMode = Boolean(initialValue);
	const defaultValues = useMemo(() => toDefaultValues(initialValue), [initialValue]);
	const {
		control,
		handleSubmit,
		reset,
		formState: { errors, dirtyFields },
	} = useForm({
		defaultValues,
	});

	const { fields, append, remove, replace } = useFieldArray({
		control,
		name: 'participantEmployeeIds',
	});

	const watchedParticipantIds = useWatch({
		control,
		name: 'participantEmployeeIds',
	});

	const startDate = useWatch({
		control,
		name: 'startDate',
	});
	const endDate = useWatch({
		control,
		name: 'endDate',
	});
	const calculatedDayCount = calculateTrainingDays(startDate, endDate);

	// Build a set of selected employee IDs to exclude from other dropdowns
	const getFilteredOptions = (currentIndex) => {
		const selectedIds = new Set(
			(watchedParticipantIds || [])
				.filter((_, idx) => idx !== currentIndex)
				.map((id) => Number(id))
				.filter((id) => Number.isInteger(id) && id > 0),
		);
		return employeeOptions.filter((option) => !selectedIds.has(option.id));
	};

	useEffect(() => {
		reset(toDefaultValues(initialValue));
		replace(toDefaultParticipantIds(initialValue));
	}, [initialValue, open, reset, replace]);

	return (
		<Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="lg">
			<DialogTitle>{isEditMode ? 'Edit Pelatihan Karyawan' : 'Tambah Pelatihan Karyawan'}</DialogTitle>
			<DialogContent>
				<Grid
					container
					spacing={2}
					component="form"
					id="training-record-form"
					sx={{ pt: 1 }}
					onSubmit={handleSubmit((values) =>
						onSubmit({
							...values,
							participantEmployeeIds: values.participantEmployeeIds
								.map((item) => Number(item))
								.filter((item) => Number.isInteger(item) && item > 0),
						}),
					)}
				>
					<Grid item xs={12}>
						<FormControl error={Boolean(errors.trainingType)} fullWidth>
							<Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
								Jenis Pelatihan
							</Typography>
							<Controller
								name="trainingType"
								control={control}
								rules={{ required: 'Jenis Pelatihan wajib dipilih.' }}
								render={({ field }) => (
									<RadioGroup row {...field} value={field.value || 'Internal'}>
										<FormControlLabel value="Internal" control={<Radio />} label="Internal" />
										<FormControlLabel value="External" control={<Radio />} label="External" />
									</RadioGroup>
								)}
							/>
							<FormHelperText>{errors.trainingType?.message || ' '}</FormHelperText>
						</FormControl>
					</Grid>

					<Grid item xs={12}>
						<Stack spacing={1.5}>
							<Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
								<Typography variant="h6" fontWeight={700}>
									Nama Peserta
								</Typography>
								<Button
									variant="outlined"
									startIcon={<AddOutlinedIcon />}
									onClick={() => append('')}
									type="button"
								>
									Tambah Peserta
								</Button>
							</Stack>
							<Divider />
							<Stack spacing={1.75}>
								{fields.map((field, index) => (
									<Stack
										key={field.id}
										direction={{ xs: 'column', sm: 'row' }}
										spacing={1.5}
										alignItems={{ sm: 'flex-start' }}
									>
										<Grid container spacing={1.5} sx={{ flex: 1 }}>
											<Grid item xs={12} sm={11}>
												<Controller
													name={`participantEmployeeIds.${index}`}
													control={control}
													rules={{ required: 'Nama Karyawan wajib dipilih.' }}
													render={({ field: participantField }) => (
														<Autocomplete
															options={getFilteredOptions(index)}
															value={
																employeeOptions.find(
																	(option) =>
																		option.id === Number(participantField.value),
																) || null
															}
															onChange={(_, selectedOption) => {
																participantField.onChange(selectedOption?.id || '');
															}}
															isOptionEqualToValue={isEmployeeOptionEqualToValue}
															getOptionLabel={(option) => getEmployeeSearchLabel(option)}
															noOptionsText="Karyawan tidak ditemukan"
															renderInput={(params) => (
																<TextField
																	{...params}
																	label={`Nama Karyawan ${index + 1}`}
																	placeholder="Cari Nama Karyawan (NIK Karyawan)"
																	error={Boolean(
																		errors?.participantEmployeeIds?.[index],
																	)}
																	helperText={
																		errors?.participantEmployeeIds?.[index]
																			?.message || ' '
																	}
																/>
															)}
															fullWidth
															filterOptions={(options, state) => {
																const keyword = state.inputValue.trim().toLowerCase();

																if (!keyword) {
																	return options;
																}

																return options.filter((option) =>
																	getEmployeeSearchLabel(option)
																		.toLowerCase()
																		.includes(keyword),
																);
															}}
														/>
													)}
												/>
											</Grid>
										</Grid>
										<IconButton
											type="button"
											onClick={() => {
												if (fields.length > 1) {
													remove(index);
												}
											}}
											disabled={fields.length === 1}
											color="error"
											sx={{ mt: { xs: -0.5, sm: 1 } }}
										>
											<DeleteOutlineOutlinedIcon />
										</IconButton>
									</Stack>
								))}
							</Stack>
						</Stack>
					</Grid>

					<Grid item xs={12}>
						<FormInput
							name="material"
							label="Materi Pelatihan"
							control={control}
							errors={errors}
							dirtyFields={dirtyFields}
							rules={{
								required: 'Materi Pelatihan wajib diisi.',
								validate: (value) =>
									String(value || '').trim().length > 0 || 'Materi Pelatihan wajib diisi.',
							}}
							fullWidth
							multiline
							minRows={3}
						/>
					</Grid>

					<Grid item xs={12}>
						<Stack spacing={1.5}>
							<Typography variant="h6" fontWeight={700}>
								Trainer
							</Typography>
							<Divider />
							<Grid container spacing={2}>
								<Grid item xs={12} md={6}>
									<FormInput
										name="trainerInstitution"
										label="Lembaga"
										control={control}
										errors={errors}
										dirtyFields={dirtyFields}
										rules={{
											required: 'Trainer -> Lembaga wajib diisi.',
											validate: (value) =>
												String(value || '').trim().length > 0 ||
												'Trainer -> Lembaga wajib diisi.',
										}}
										fullWidth
									/>
								</Grid>
								<Grid item xs={12} md={6}>
									<FormInput
										name="trainerName"
										label="Nama"
										control={control}
										errors={errors}
										dirtyFields={dirtyFields}
										rules={{
											required: 'Trainer -> Nama wajib diisi.',
											validate: (value) =>
												String(value || '').trim().length > 0 || 'Trainer -> Nama wajib diisi.',
										}}
										fullWidth
									/>
								</Grid>
							</Grid>
						</Stack>
					</Grid>

					<Grid item xs={12} md={5}>
						<FormInput
							name="startDate"
							label="Dari Tanggal"
							type="date"
							control={control}
							errors={errors}
							dirtyFields={dirtyFields}
							rules={{ required: 'Dari Tanggal wajib diisi.' }}
							fullWidth
							InputLabelProps={{ shrink: true }}
						/>
					</Grid>
					<Grid item xs={12} md={5}>
						<FormInput
							name="endDate"
							label="Sampai Tanggal"
							type="date"
							control={control}
							errors={errors}
							dirtyFields={dirtyFields}
							rules={{
								required: 'Sampai Tanggal wajib diisi.',
								validate: (value) => {
									if (!value || !startDate) {
										return true;
									}

									return (
										value >= startDate ||
										'Sampai Tanggal tidak boleh lebih kecil dari Dari Tanggal.'
									);
								},
							}}
							fullWidth
							InputLabelProps={{ shrink: true }}
						/>
					</Grid>
					<Grid item xs={12} md={2}>
						<TextField label="Jumlah Hari" value={calculatedDayCount ?? ''} fullWidth disabled />
					</Grid>

					<Grid item xs={12}>
						<FormInput
							name="address"
							label="Alamat Pelatihan"
							control={control}
							errors={errors}
							dirtyFields={dirtyFields}
							fullWidth
							multiline
							minRows={3}
						/>
					</Grid>
					<Grid item xs={12}>
						<FormInput
							name="notes"
							label="Keterangan"
							control={control}
							errors={errors}
							dirtyFields={dirtyFields}
							fullWidth
							multiline
							minRows={3}
						/>
					</Grid>
				</Grid>
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 3 }}>
				<Button onClick={onClose} disabled={loading} color="inherit">
					Batal
				</Button>
				<Button type="submit" form="training-record-form" variant="contained" disabled={loading}>
					{loading ? 'Menyimpan...' : 'Simpan'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default TrainingRecordFormDialog;
