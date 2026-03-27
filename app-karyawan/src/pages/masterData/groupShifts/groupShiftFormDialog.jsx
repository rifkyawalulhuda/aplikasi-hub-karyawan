import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';

import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';

import FormInput from '@/components/formInput';

function toDefaultValues(initialValue) {
	return {
		groupShiftName: initialValue?.groupShiftName || '',
		foremanIds: initialValue?.foremanIds || [],
		employeeIds: initialValue?.employeeIds || [],
	};
}

function getEmployeeOptionLabel(option, showGroupShift = false) {
	if (!option) {
		return '';
	}

	const baseLabel = `${option.fullName} (${option.employeeNo})`;

	if (showGroupShift && option.groupShiftName) {
		return `${baseLabel} - ${option.groupShiftName}`;
	}

	return baseLabel;
}

function GroupShiftFormDialog({ open, loading, initialValue, foremanOptions, employeeOptions, onClose, onSubmit }) {
	const isEditMode = Boolean(initialValue);
	const {
		control,
		handleSubmit,
		reset,
		formState: { errors, dirtyFields },
	} = useForm({
		defaultValues: toDefaultValues(initialValue),
	});

	useEffect(() => {
		reset(toDefaultValues(initialValue));
	}, [initialValue, open, reset]);

	const handleFormSubmit = (values) => {
		onSubmit({
			groupShiftName: values.groupShiftName,
			foremanIds: values.foremanIds || [],
			employeeIds: values.employeeIds || [],
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
						<Controller
							name="foremanIds"
							control={control}
							rules={{
								validate: (value) =>
									Array.isArray(value) && value.length > 0
										? true
										: 'Minimal satu Foreman wajib dipilih.',
							}}
							render={({ field }) => (
								<Autocomplete
									multiple
									disableCloseOnSelect
									filterSelectedOptions
									options={foremanOptions}
									value={foremanOptions.filter((option) => (field.value || []).includes(option.id))}
									onChange={(_, selectedOptions) =>
										field.onChange(selectedOptions.map((option) => option.id))
									}
									isOptionEqualToValue={(option, value) => option.id === value.id}
									getOptionLabel={(option) => getEmployeeOptionLabel(option)}
									renderTags={(value, getTagProps) =>
										value.map((option, index) => (
											<Chip
												{...getTagProps({ index })}
												key={option.id}
												label={getEmployeeOptionLabel(option)}
												size="small"
											/>
										))
									}
									renderInput={(params) => (
										<TextField
											{...params}
											label="Foreman"
											error={Boolean(errors.foremanIds)}
											helperText={
												errors.foremanIds?.message ||
												'Pilih satu atau lebih foreman dengan Job Level Foreman.'
											}
										/>
									)}
									fullWidth
								/>
							)}
						/>
					</Grid>
					<Grid item xs={12}>
						<Controller
							name="employeeIds"
							control={control}
							render={({ field }) => (
								<Autocomplete
									multiple
									disableCloseOnSelect
									filterSelectedOptions
									options={employeeOptions}
									value={employeeOptions.filter((option) => (field.value || []).includes(option.id))}
									onChange={(_, selectedOptions) =>
										field.onChange(selectedOptions.map((option) => option.id))
									}
									isOptionEqualToValue={(option, value) => option.id === value.id}
									getOptionLabel={(option) => getEmployeeOptionLabel(option, true)}
									renderTags={(value, getTagProps) =>
										value.map((option, index) => (
											<Chip
												{...getTagProps({ index })}
												key={option.id}
												label={getEmployeeOptionLabel(option)}
												size="small"
											/>
										))
									}
									renderInput={(params) => (
										<TextField
											{...params}
											label="Karyawan"
											error={Boolean(errors.employeeIds)}
											helperText={
												errors.employeeIds?.message ||
												'Pilih karyawan yang terhubung ke group ini. Jika karyawan masih berada di group lain, assignment lama akan dipindahkan otomatis saat disimpan.'
											}
										/>
									)}
									fullWidth
								/>
							)}
						/>
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
