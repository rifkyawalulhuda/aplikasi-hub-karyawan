import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';

import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';

function toDefaultValues(initialValue = null) {
	return {
		masterCutiKaryawanId: initialValue?.masterCutiKaryawanId || '',
		leaveDays: initialValue?.leaveDays || '',
		periodStart: initialValue?.periodStart || '',
		periodEnd: initialValue?.periodEnd || '',
		notes: initialValue?.notes || '',
	};
}

function LeaveRequestFormDialog({ open, loading, leaveTypeOptions, initialValue, title, onClose, onSubmit }) {
	const {
		control,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm({
		defaultValues: toDefaultValues(initialValue),
	});

	useEffect(() => {
		reset(toDefaultValues(initialValue));
	}, [initialValue, open, reset]);

	return (
		<Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm">
			<DialogTitle>{title}</DialogTitle>
			<DialogContent>
				<Grid
					container
					spacing={2}
					component="form"
					id="employee-leave-request-form"
					sx={{ pt: 1 }}
					onSubmit={handleSubmit(onSubmit)}
				>
					<Grid item xs={12}>
						<Controller
							name="masterCutiKaryawanId"
							control={control}
							rules={{ required: 'Jenis cuti wajib dipilih.' }}
							render={({ field }) => (
								<Autocomplete
									options={leaveTypeOptions}
									value={leaveTypeOptions.find((option) => option.id === Number(field.value)) || null}
									onChange={(_, selectedOption) => field.onChange(selectedOption?.id || '')}
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
								/>
							)}
						/>
					</Grid>
					<Grid item xs={12} sm={6}>
						<Controller
							name="leaveDays"
							control={control}
							rules={{ required: 'Jumlah cuti wajib diisi.' }}
							render={({ field }) => (
								<TextField
									{...field}
									label="Jumlah Cuti"
									type="number"
									fullWidth
									inputProps={{ min: 1, step: 1 }}
									error={Boolean(errors.leaveDays)}
									helperText={errors.leaveDays?.message || ' '}
								/>
							)}
						/>
					</Grid>
					<Grid item xs={12} sm={6}>
						<Controller
							name="periodStart"
							control={control}
							rules={{ required: 'Periode cuti dari wajib diisi.' }}
							render={({ field }) => (
								<TextField
									{...field}
									label="Periode Dari"
									type="date"
									fullWidth
									InputLabelProps={{ shrink: true }}
									error={Boolean(errors.periodStart)}
									helperText={errors.periodStart?.message || ' '}
								/>
							)}
						/>
					</Grid>
					<Grid item xs={12} sm={6}>
						<Controller
							name="periodEnd"
							control={control}
							rules={{ required: 'Periode cuti sampai wajib diisi.' }}
							render={({ field }) => (
								<TextField
									{...field}
									label="Periode Sampai"
									type="date"
									fullWidth
									InputLabelProps={{ shrink: true }}
									error={Boolean(errors.periodEnd)}
									helperText={errors.periodEnd?.message || ' '}
								/>
							)}
						/>
					</Grid>
					<Grid item xs={12}>
						<Controller
							name="notes"
							control={control}
							render={({ field }) => (
								<TextField {...field} label="Catatan" fullWidth multiline minRows={4} />
							)}
						/>
					</Grid>
				</Grid>
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 3 }}>
				<Button onClick={onClose} disabled={loading} color="inherit">
					Batal
				</Button>
				<Button type="submit" form="employee-leave-request-form" variant="contained" disabled={loading}>
					{loading ? 'Memproses...' : 'Simpan'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default LeaveRequestFormDialog;
