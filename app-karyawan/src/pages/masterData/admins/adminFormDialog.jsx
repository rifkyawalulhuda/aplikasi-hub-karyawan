import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';

import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';

import FormInput from '@/components/formInput';

const ROLE_OPTIONS = [
	{ value: 'admin', label: 'admin' },
	{ value: 'user', label: 'user' },
];

function toDefaultValues(initialValue) {
	return {
		employeeId: initialValue?.employeeId || '',
		employeeNo: initialValue?.employeeNo || '',
		password: initialValue?.password || '',
		role: initialValue?.role || 'user',
	};
}

function AdminFormDialog({ open, loading, initialValue, employeeOptions, onClose, onSubmit }) {
	const isEditMode = Boolean(initialValue);
	const {
		control,
		handleSubmit,
		reset,
		setValue,
		watch,
		formState: { errors, dirtyFields },
	} = useForm({
		defaultValues: toDefaultValues(initialValue),
	});

	const selectedEmployeeId = watch('employeeId');
	const selectedEmployee = employeeOptions.find((item) => item.id === Number(selectedEmployeeId)) || null;

	useEffect(() => {
		reset(toDefaultValues(initialValue));
	}, [initialValue, open, reset]);

	useEffect(() => {
		setValue('employeeNo', selectedEmployee?.employeeNo || '');
	}, [selectedEmployee, setValue]);

	return (
		<Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm">
			<DialogTitle>{isEditMode ? 'Edit Master Admin' : 'Tambah Master Admin'}</DialogTitle>
			<DialogContent>
				<Grid
					container
					spacing={2}
					component="form"
					id="master-admin-form"
					sx={{ pt: 1 }}
					onSubmit={handleSubmit(onSubmit)}
				>
					<Grid item xs={12} md={6}>
						<Controller
							name="employeeId"
							control={control}
							rules={{ required: 'Nama wajib dipilih.' }}
							render={({ field }) => (
								<Autocomplete
									options={employeeOptions}
									getOptionLabel={(option) => option.fullName || ''}
									isOptionEqualToValue={(option, value) => option.id === value.id}
									value={employeeOptions.find((item) => item.id === Number(field.value)) || null}
									onChange={(_, option) => field.onChange(option?.id || '')}
									renderInput={(params) => (
										<TextField
											{...params}
											label="Nama"
											error={!!errors.employeeId}
											helperText={errors.employeeId ? errors.employeeId.message : ' '}
										/>
									)}
								/>
							)}
						/>
					</Grid>
					<Grid item xs={12} md={6}>
						<FormInput
							name="employeeNo"
							label="NIK"
							control={control}
							errors={errors}
							dirtyFields={dirtyFields}
							fullWidth
							disabled
						/>
					</Grid>
					<Grid item xs={12} md={6}>
						<FormInput
							name="password"
							label="Password"
							type="password"
							control={control}
							errors={errors}
							dirtyFields={dirtyFields}
							rules={{ required: 'Password wajib diisi.' }}
							fullWidth
						/>
					</Grid>
					<Grid item xs={12} md={6}>
						<FormInput
							name="role"
							label="Role"
							control={control}
							errors={errors}
							dirtyFields={dirtyFields}
							rules={{ required: 'Role wajib dipilih.' }}
							fullWidth
							select
						>
							{ROLE_OPTIONS.map((option) => (
								<MenuItem key={option.value} value={option.value}>
									{option.label}
								</MenuItem>
							))}
						</FormInput>
					</Grid>
				</Grid>
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 3 }}>
				<Button onClick={onClose} disabled={loading} color="inherit">
					Batal
				</Button>
				<Button type="submit" form="master-admin-form" variant="contained" disabled={loading}>
					{loading ? 'Menyimpan...' : 'Simpan'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default AdminFormDialog;
