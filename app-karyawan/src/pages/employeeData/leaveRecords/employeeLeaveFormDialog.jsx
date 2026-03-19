import { useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';

import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';

import FormInput from '@/components/formInput';

function toDefaultValues(initialValue) {
	return {
		employeeId: initialValue?.employeeId || '',
		employeeNo: initialValue?.employeeNo || '',
		masterCutiKaryawanId: initialValue?.masterCutiKaryawanId || '',
		leaveDays: initialValue?.leaveDays ?? '',
		periodStart: initialValue?.periodStart || '',
		periodEnd: initialValue?.periodEnd || '',
		remainingLeave: initialValue?.remainingLeave ?? '',
		notes: initialValue?.notes || '',
	};
}

function EmployeeLeaveFormDialog({
	open,
	loading,
	initialValue,
	employeeOptions,
	leaveTypeOptions,
	onClose,
	onSubmit,
}) {
	const isEditMode = Boolean(initialValue);
	const {
		control,
		handleSubmit,
		reset,
		setValue,
		formState: { errors, dirtyFields },
	} = useForm({
		defaultValues: toDefaultValues(initialValue),
	});

	const selectedEmployeeId = useWatch({
		control,
		name: 'employeeId',
	});
	const employeeNo = useWatch({
		control,
		name: 'employeeNo',
	});

	useEffect(() => {
		reset(toDefaultValues(initialValue));
	}, [initialValue, open, reset]);

	useEffect(() => {
		const selectedEmployee = employeeOptions.find((item) => item.id === Number(selectedEmployeeId));
		setValue('employeeNo', selectedEmployee?.employeeNo || '');
	}, [employeeOptions, selectedEmployeeId, setValue]);

	return (
		<Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="lg">
			<DialogTitle>{isEditMode ? 'Edit Data Cuti Karyawan' : 'Tambah Data Cuti Karyawan'}</DialogTitle>
			<DialogContent>
				<Grid
					container
					spacing={2}
					component="form"
					id="employee-leave-form"
					sx={{ pt: 1 }}
					onSubmit={handleSubmit(onSubmit)}
				>
					<Grid item xs={12} md={8}>
						<Controller
							name="employeeId"
							control={control}
							rules={{ required: 'Nama Karyawan wajib dipilih.' }}
							render={({ field }) => (
								<Autocomplete
									options={employeeOptions}
									value={employeeOptions.find((option) => option.id === Number(field.value)) || null}
									onChange={(_, selectedOption) => {
										field.onChange(selectedOption?.id || '');
									}}
									isOptionEqualToValue={(option, value) => option.id === value.id}
									getOptionLabel={(option) => option?.fullName || ''}
									renderInput={(params) => (
										<TextField
											{...params}
											label="Nama Karyawan"
											error={Boolean(errors.employeeId)}
											helperText={errors.employeeId?.message || ' '}
										/>
									)}
									fullWidth
								/>
							)}
						/>
					</Grid>
					<Grid item xs={12} md={4}>
						<TextField label="NIK" value={employeeNo || ''} fullWidth disabled />
					</Grid>
					<Grid item xs={12} md={6}>
						<Controller
							name="masterCutiKaryawanId"
							control={control}
							rules={{ required: 'Jenis Cuti wajib dipilih.' }}
							render={({ field }) => (
								<Autocomplete
									options={leaveTypeOptions}
									value={leaveTypeOptions.find((option) => option.id === Number(field.value)) || null}
									onChange={(_, selectedOption) => {
										field.onChange(selectedOption?.id || '');
									}}
									isOptionEqualToValue={(option, value) => option.id === value.id}
									getOptionLabel={(option) => option?.leaveType || ''}
									renderInput={(params) => (
										<TextField
											{...params}
											label="Jenis Cuti"
											error={Boolean(errors.masterCutiKaryawanId)}
											helperText={errors.masterCutiKaryawanId?.message || ' '}
										/>
									)}
									fullWidth
								/>
							)}
						/>
					</Grid>
					<Grid item xs={12} md={3}>
						<FormInput
							name="leaveDays"
							label="Jumlah Cuti"
							type="number"
							control={control}
							errors={errors}
							dirtyFields={dirtyFields}
							rules={{
								required: 'Jumlah Cuti wajib diisi.',
								min: { value: 1, message: 'Jumlah Cuti minimal 1.' },
								validate: (value) => String(value).trim() !== '' || 'Jumlah Cuti wajib diisi.',
							}}
							fullWidth
							inputProps={{ min: 1, step: 1 }}
						/>
					</Grid>
					<Grid item xs={12} md={3}>
						<FormInput
							name="remainingLeave"
							label="Sisa Cuti"
							type="number"
							control={control}
							errors={errors}
							dirtyFields={dirtyFields}
							rules={{
								required: 'Sisa Cuti wajib diisi.',
								min: { value: 0, message: 'Sisa Cuti tidak boleh kurang dari 0.' },
								validate: (value) => String(value).trim() !== '' || 'Sisa Cuti wajib diisi.',
							}}
							fullWidth
							inputProps={{ min: 0, step: 1 }}
						/>
					</Grid>
					<Grid item xs={12} md={6}>
						<FormInput
							name="periodStart"
							label="Periode Cuti Dari"
							type="date"
							control={control}
							errors={errors}
							dirtyFields={dirtyFields}
							rules={{ required: 'Periode Cuti Dari wajib diisi.' }}
							fullWidth
							InputLabelProps={{ shrink: true }}
						/>
					</Grid>
					<Grid item xs={12} md={6}>
						<FormInput
							name="periodEnd"
							label="Periode Cuti Sampai"
							type="date"
							control={control}
							errors={errors}
							dirtyFields={dirtyFields}
							rules={{ required: 'Periode Cuti Sampai wajib diisi.' }}
							fullWidth
							InputLabelProps={{ shrink: true }}
						/>
					</Grid>
					<Grid item xs={12}>
						<FormInput
							name="notes"
							label="Catatan"
							control={control}
							errors={errors}
							dirtyFields={dirtyFields}
							fullWidth
							multiline
							minRows={4}
						/>
					</Grid>
				</Grid>
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 3 }}>
				<Button onClick={onClose} disabled={loading} color="inherit">
					Batal
				</Button>
				<Button type="submit" form="employee-leave-form" variant="contained" disabled={loading}>
					{loading ? 'Menyimpan...' : 'Simpan'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default EmployeeLeaveFormDialog;
