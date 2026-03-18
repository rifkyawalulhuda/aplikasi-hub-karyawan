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

import { getLicenseStatus } from './utils';

function toDefaultValues(initialValue) {
	return {
		employeeId: initialValue?.employeeId || '',
		employeeNo: initialValue?.employeeNo || '',
		masterDokKaryawanId: initialValue?.masterDokKaryawanId || '',
		documentType: initialValue?.documentType || '',
		type: initialValue?.type || '',
		documentNumber: initialValue?.documentNumber || '',
		issuer: initialValue?.issuer || '',
		expiryDate: initialValue?.expiryDate || '',
		status: initialValue?.status || '',
		notes: initialValue?.notes || '',
	};
}

function LicenseCertificationFormDialog({
	open,
	loading,
	initialValue,
	employeeOptions,
	documentOptions,
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
	const selectedDocumentId = useWatch({
		control,
		name: 'masterDokKaryawanId',
	});
	const employeeNo = useWatch({
		control,
		name: 'employeeNo',
	});
	const documentType = useWatch({
		control,
		name: 'documentType',
	});
	const issuer = useWatch({
		control,
		name: 'issuer',
	});
	const expiryDate = useWatch({
		control,
		name: 'expiryDate',
	});
	const status = useWatch({
		control,
		name: 'status',
	});

	useEffect(() => {
		reset(toDefaultValues(initialValue));
	}, [initialValue, open, reset]);

	useEffect(() => {
		const selectedEmployee = employeeOptions.find((item) => item.id === Number(selectedEmployeeId));
		setValue('employeeNo', selectedEmployee?.employeeNo || '');
	}, [employeeOptions, selectedEmployeeId, setValue]);

	useEffect(() => {
		const selectedDocument = documentOptions.find((item) => item.id === Number(selectedDocumentId));
		setValue('documentType', selectedDocument?.documentType || '');
		setValue('issuer', selectedDocument?.issuer || '');
	}, [documentOptions, selectedDocumentId, setValue]);

	useEffect(() => {
		setValue('status', expiryDate ? getLicenseStatus(expiryDate) : '');
	}, [expiryDate, setValue]);

	return (
		<Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="lg">
			<DialogTitle>{isEditMode ? 'Edit Lisensi & Sertifikasi' : 'Tambah Lisensi & Sertifikasi'}</DialogTitle>
			<DialogContent>
				<Grid
					container
					spacing={2}
					component="form"
					id="license-certification-form"
					sx={{ pt: 1 }}
					onSubmit={handleSubmit(onSubmit)}
				>
					<Grid item xs={12} md={8}>
						<Controller
							name="employeeId"
							control={control}
							rules={{ required: 'Nama wajib dipilih.' }}
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
											label="Nama"
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
							name="masterDokKaryawanId"
							control={control}
							rules={{ required: 'Dokumen wajib dipilih.' }}
							render={({ field }) => (
								<Autocomplete
									options={documentOptions}
									value={documentOptions.find((option) => option.id === Number(field.value)) || null}
									onChange={(_, selectedOption) => {
										field.onChange(selectedOption?.id || '');
									}}
									isOptionEqualToValue={(option, value) => option.id === value.id}
									getOptionLabel={(option) => option?.documentName || ''}
									renderInput={(params) => (
										<TextField
											{...params}
											label="Dokumen"
											error={Boolean(errors.masterDokKaryawanId)}
											helperText={errors.masterDokKaryawanId?.message || ' '}
										/>
									)}
									fullWidth
								/>
							)}
						/>
					</Grid>
					<Grid item xs={12} md={6}>
						<TextField label="Jenis Dokumen" value={documentType || ''} fullWidth disabled />
					</Grid>
					<Grid item xs={12} md={6}>
						<FormInput
							name="type"
							label="Type"
							control={control}
							errors={errors}
							dirtyFields={dirtyFields}
							rules={{
								required: 'Type wajib diisi.',
								validate: (value) => value.trim().length > 0 || 'Type wajib diisi.',
							}}
							fullWidth
						/>
					</Grid>
					<Grid item xs={12} md={6}>
						<FormInput
							name="documentNumber"
							label="No. Dokumen"
							control={control}
							errors={errors}
							dirtyFields={dirtyFields}
							rules={{
								required: 'No. Dokumen wajib diisi.',
								validate: (value) => value.trim().length > 0 || 'No. Dokumen wajib diisi.',
							}}
							fullWidth
						/>
					</Grid>
					<Grid item xs={12} md={4}>
						<TextField label="Diterbitkan" value={issuer || ''} fullWidth disabled />
					</Grid>
					<Grid item xs={12} md={4}>
						<FormInput
							name="expiryDate"
							label="Masa Berlaku"
							type="date"
							control={control}
							errors={errors}
							dirtyFields={dirtyFields}
							rules={{ required: 'Masa Berlaku wajib diisi.' }}
							fullWidth
							InputLabelProps={{ shrink: true }}
						/>
					</Grid>
					<Grid item xs={12} md={4}>
						<TextField label="Status" value={status || ''} fullWidth disabled />
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
				<Button type="submit" form="license-certification-form" variant="contained" disabled={loading}>
					{loading ? 'Menyimpan...' : 'Simpan'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default LicenseCertificationFormDialog;
