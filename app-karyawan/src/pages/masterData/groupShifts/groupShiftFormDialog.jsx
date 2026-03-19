import { useEffect } from 'react';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';

import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import RemoveCircleOutlineOutlinedIcon from '@mui/icons-material/RemoveCircleOutlineOutlined';

import FormInput from '@/components/formInput';

function toDefaultValues(initialValue) {
	return {
		groupShiftName: initialValue?.groupShiftName || '',
		foremen:
			initialValue?.foremanIds?.length > 0
				? initialValue.foremanIds.map((employeeId) => ({ employeeId }))
				: [{ employeeId: '' }],
	};
}

function GroupShiftFormDialog({ open, loading, initialValue, foremanOptions, onClose, onSubmit }) {
	const isEditMode = Boolean(initialValue);
	const {
		control,
		handleSubmit,
		reset,
		formState: { errors, dirtyFields },
	} = useForm({
		defaultValues: toDefaultValues(initialValue),
	});
	const { fields, append, remove } = useFieldArray({
		control,
		name: 'foremen',
	});
	const watchedForemen = useWatch({
		control,
		name: 'foremen',
	});

	useEffect(() => {
		reset(toDefaultValues(initialValue));
	}, [initialValue, open, reset]);

	const handleFormSubmit = (values) => {
		onSubmit({
			groupShiftName: values.groupShiftName,
			foremanIds: values.foremen.map((item) => Number(item.employeeId)).filter(Boolean),
		});
	};

	return (
		<Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="md">
			<DialogTitle>{isEditMode ? 'Edit Master Group Shift' : 'Tambah Master Group Shift'}</DialogTitle>
			<DialogContent>
				<Grid
					container
					spacing={2}
					component="form"
					id="master-group-shift-form"
					sx={{ pt: 1 }}
					onSubmit={handleSubmit(handleFormSubmit)}
				>
					<Grid item xs={12}>
						<FormInput
							name="groupShiftName"
							label="Nama Group Shift"
							control={control}
							errors={errors}
							dirtyFields={dirtyFields}
							rules={{ required: 'Nama Group Shift wajib diisi.' }}
							fullWidth
							autoFocus
						/>
					</Grid>
					<Grid item xs={12}>
						<Stack spacing={1.5}>
							<Stack direction="row" justifyContent="space-between" alignItems="center">
								<Typography variant="subtitle2">Foreman</Typography>
								<Button
									size="small"
									startIcon={<AddCircleOutlineOutlinedIcon />}
									onClick={() => append({ employeeId: '' })}
								>
									Tambah Foreman
								</Button>
							</Stack>
							{fields.map((field, index) => {
								const selectedIds = (watchedForemen || [])
									.map((item) => Number(item?.employeeId))
									.filter((value) => Number.isInteger(value));
								const currentId = Number(watchedForemen?.[index]?.employeeId);
								const availableOptions = foremanOptions.filter((option) => {
									if (option.id === currentId) {
										return true;
									}

									return !selectedIds.includes(option.id);
								});

								return (
									<Stack key={field.id} direction="row" spacing={1} alignItems="flex-start">
										<Controller
											name={`foremen.${index}.employeeId`}
											control={control}
											rules={{ required: 'Foreman wajib dipilih.' }}
											render={({ field: controllerField }) => (
												<Autocomplete
													fullWidth
													options={availableOptions}
													value={
														foremanOptions.find(
															(option) => option.id === Number(controllerField.value),
														) || null
													}
													onChange={(_, option) => controllerField.onChange(option?.id || '')}
													isOptionEqualToValue={(option, value) => option.id === value.id}
													getOptionLabel={(option) =>
														option ? `${option.fullName} (${option.employeeNo})` : ''
													}
													renderInput={(params) => (
														<TextField
															{...params}
															label={`Foreman ${index + 1}`}
															error={Boolean(errors.foremen?.[index]?.employeeId)}
															helperText={
																errors.foremen?.[index]?.employeeId?.message || ' '
															}
														/>
													)}
												/>
											)}
										/>
										<IconButton
											color="error"
											sx={{ mt: 1 }}
											onClick={() => {
												if (fields.length === 1) {
													return;
												}

												remove(index);
											}}
											disabled={fields.length === 1}
										>
											<RemoveCircleOutlineOutlinedIcon />
										</IconButton>
									</Stack>
								);
							})}
						</Stack>
					</Grid>
				</Grid>
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 3 }}>
				<Button onClick={onClose} disabled={loading} color="inherit">
					Batal
				</Button>
				<Button type="submit" form="master-group-shift-form" variant="contained" disabled={loading}>
					{loading ? 'Menyimpan...' : 'Simpan'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default GroupShiftFormDialog;
