import { useEffect, useMemo } from 'react';
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
		leaveAddress: initialValue?.leaveAddress || '',
		leaveReason: initialValue?.leaveReason || '',
		replacementEmployeeId: initialValue?.replacementEmployeeId || '',
	};
}

function formatDateForDisplay(value) {
	if (!value) {
		return '-';
	}

	const raw = String(value).trim();
	const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);

	if (!isoMatch) {
		return raw;
	}

	const [, year, month, day] = isoMatch;
	return `${day}/${month}/${year}`;
}

function LeaveRequestFormDialog({
	open,
	loading,
	leaveTypeOptions = [],
	replacementOptions = [],
	submissionDate = '',
	initialValue,
	title,
	onClose,
	onSubmit,
}) {
	const {
		control,
		handleSubmit,
		reset,
		watch,
		formState: { errors },
	} = useForm({
		defaultValues: toDefaultValues(initialValue),
		mode: 'onChange',
	});

	const selectedLeaveTypeId = Number(watch('masterCutiKaryawanId'));
	const leaveDaysRawValue = watch('leaveDays');
	const leaveDaysValue =
		leaveDaysRawValue === '' || typeof leaveDaysRawValue === 'undefined' ? Number.NaN : Number(leaveDaysRawValue);
	const selectedLeaveType = useMemo(
		() => leaveTypeOptions.find((option) => option.id === selectedLeaveTypeId) || null,
		[leaveTypeOptions, selectedLeaveTypeId],
	);
	const availableLeaveBalance = selectedLeaveType?.availableLeaveBalance ?? null;
	const remainingLeavePreview =
		availableLeaveBalance == null || Number.isNaN(leaveDaysValue) ? '' : availableLeaveBalance - leaveDaysValue;
	const leaveDaysExceeded =
		availableLeaveBalance != null && !Number.isNaN(leaveDaysValue) && leaveDaysValue > availableLeaveBalance;
	const availableLeaveHelperText = selectedLeaveType
		? 'Saldo jenis cuti yang dipilih.'
		: 'Pilih jenis cuti terlebih dahulu.';
	let remainingLeaveHelperText = 'Pilih jenis cuti terlebih dahulu.';

	if (leaveDaysExceeded) {
		remainingLeaveHelperText = 'Jumlah cuti tidak cukup.';
	} else if (selectedLeaveType) {
		remainingLeaveHelperText = 'Preview sisa cuti setelah pengajuan.';
	}
	const isSubmitDisabled =
		loading || leaveTypeOptions.length === 0 || replacementOptions.length === 0 || leaveDaysExceeded;

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
						<TextField
							label="Tanggal Pengajuan"
							value={formatDateForDisplay(submissionDate)}
							fullWidth
							disabled
						/>
					</Grid>
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
						<TextField
							label="Jumlah Cuti Tahunan Tersedia"
							value={availableLeaveBalance ?? ''}
							fullWidth
							disabled
							helperText={availableLeaveHelperText}
						/>
					</Grid>
					<Grid item xs={12} sm={6}>
						<Controller
							name="leaveDays"
							control={control}
							rules={{
								required: 'Jumlah hari cuti wajib diisi.',
								validate: (value) => {
									const numericValue = Number(value);

									if (!Number.isInteger(numericValue) || numericValue <= 0) {
										return 'Jumlah hari cuti wajib diisi dengan angka yang valid.';
									}

									if (availableLeaveBalance != null && numericValue > availableLeaveBalance) {
										return 'Jumlah cuti tidak cukup untuk jenis cuti yang dipilih.';
									}

									return true;
								},
							}}
							render={({ field }) => (
								<TextField
									{...field}
									label="Jumlah Hari Cuti"
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
					<Grid item xs={12} sm={6}>
						<TextField
							label="Sisa Cuti"
							value={remainingLeavePreview}
							fullWidth
							disabled
							error={leaveDaysExceeded}
							helperText={remainingLeaveHelperText}
						/>
					</Grid>
					<Grid item xs={12}>
						<Controller
							name="leaveAddress"
							control={control}
							rules={{ required: 'Alamat selama cuti wajib diisi.' }}
							render={({ field }) => (
								<TextField
									{...field}
									label="Alamat Selama Cuti"
									fullWidth
									multiline
									minRows={3}
									error={Boolean(errors.leaveAddress)}
									helperText={errors.leaveAddress?.message || ' '}
								/>
							)}
						/>
					</Grid>
					<Grid item xs={12}>
						<Controller
							name="leaveReason"
							control={control}
							rules={{ required: 'Alasan cuti wajib diisi.' }}
							render={({ field }) => (
								<TextField
									{...field}
									label="Alasan Cuti"
									fullWidth
									multiline
									minRows={3}
									error={Boolean(errors.leaveReason)}
									helperText={errors.leaveReason?.message || ' '}
								/>
							)}
						/>
					</Grid>
					<Grid item xs={12}>
						<Controller
							name="replacementEmployeeId"
							control={control}
							rules={{ required: 'Pengganti selama cuti wajib dipilih.' }}
							render={({ field }) => (
								<Autocomplete
									options={replacementOptions}
									value={
										replacementOptions.find((option) => option.id === Number(field.value)) || null
									}
									onChange={(_, selectedOption) => field.onChange(selectedOption?.id || '')}
									isOptionEqualToValue={(option, value) => option.id === value.id}
									getOptionLabel={(option) =>
										option?.fullName ? `${option.fullName} (${option.employeeNo})` : ''
									}
									renderInput={(params) => (
										<TextField
											{...params}
											label="Pengganti Selama Cuti"
											error={Boolean(errors.replacementEmployeeId)}
											helperText={
												errors.replacementEmployeeId?.message ||
												'Kandidat dipilih dari job role dan department yang sesuai.'
											}
										/>
									)}
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
				<Button
					type="submit"
					form="employee-leave-request-form"
					variant="contained"
					disabled={isSubmitDisabled}
				>
					{loading ? 'Memproses...' : 'Simpan'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default LeaveRequestFormDialog;
