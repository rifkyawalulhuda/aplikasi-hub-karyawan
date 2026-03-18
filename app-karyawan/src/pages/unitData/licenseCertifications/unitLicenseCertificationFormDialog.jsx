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

import { getUnitLicenseStatus } from './utils';

function toDefaultValues(initialValue) {
	return {
		masterUnitId: initialValue?.masterUnitId || '',
		assetNo: initialValue?.assetNo || '',
		unitType: initialValue?.unitType || '',
		capacity: initialValue?.capacity || '',
		unitSerialNumber: initialValue?.unitSerialNumber || '',
		documentNumber: initialValue?.documentNumber || '',
		issuedBy: initialValue?.issuedBy || '',
		vendorId: initialValue?.vendorId || '',
		expiryDate: initialValue?.expiryDate || '',
		status: initialValue?.status || '',
		notes: initialValue?.notes || '',
	};
}

function UnitLicenseCertificationFormDialog({
	open,
	loading,
	initialValue,
	unitOptions,
	vendorOptions,
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

	const selectedUnitId = useWatch({
		control,
		name: 'masterUnitId',
	});
	const unitType = useWatch({
		control,
		name: 'unitType',
	});
	const capacity = useWatch({
		control,
		name: 'capacity',
	});
	const unitSerialNumber = useWatch({
		control,
		name: 'unitSerialNumber',
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
		const selectedUnit = unitOptions.find((item) => item.id === Number(selectedUnitId));
		setValue('unitType', selectedUnit?.unitType || '');
		setValue('capacity', selectedUnit?.capacity || '');
		setValue('unitSerialNumber', selectedUnit?.unitSerialNumber || '');
	}, [selectedUnitId, setValue, unitOptions]);

	useEffect(() => {
		setValue('status', expiryDate ? getUnitLicenseStatus(expiryDate) : '');
	}, [expiryDate, setValue]);

	return (
		<Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="lg">
			<DialogTitle>
				{isEditMode ? 'Edit Lisensi & Sertifikasi Unit' : 'Tambah Lisensi & Sertifikasi Unit'}
			</DialogTitle>
			<DialogContent>
				<Grid
					container
					spacing={2}
					component="form"
					id="unit-license-certification-form"
					sx={{ pt: 1 }}
					onSubmit={handleSubmit(onSubmit)}
				>
					<Grid item xs={12} md={8}>
						<Controller
							name="masterUnitId"
							control={control}
							rules={{ required: 'Nama Unit wajib dipilih.' }}
							render={({ field }) => (
								<Autocomplete
									options={unitOptions}
									value={unitOptions.find((option) => option.id === Number(field.value)) || null}
									onChange={(_, selectedOption) => {
										field.onChange(selectedOption?.id || '');
									}}
									isOptionEqualToValue={(option, value) => option.id === value.id}
									getOptionLabel={(option) => option?.unitName || ''}
									renderInput={(params) => (
										<TextField
											{...params}
											label="Nama Unit"
											error={Boolean(errors.masterUnitId)}
											helperText={errors.masterUnitId?.message || ' '}
										/>
									)}
									fullWidth
								/>
							)}
						/>
					</Grid>
					<Grid item xs={12} md={4}>
						<FormInput
							name="assetNo"
							label="Asset No"
							control={control}
							errors={errors}
							dirtyFields={dirtyFields}
							rules={{
								required: 'Asset No wajib diisi.',
								validate: (value) => value.trim().length > 0 || 'Asset No wajib diisi.',
							}}
							fullWidth
						/>
					</Grid>
					<Grid item xs={12} md={4}>
						<TextField label="Jenis Unit" value={unitType || ''} fullWidth disabled />
					</Grid>
					<Grid item xs={12} md={4}>
						<TextField label="Kapasitas" value={capacity || ''} fullWidth disabled />
					</Grid>
					<Grid item xs={12} md={4}>
						<TextField label="Unit/Serial Number" value={unitSerialNumber || ''} fullWidth disabled />
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
					<Grid item xs={12} md={6}>
						<FormInput
							name="issuedBy"
							label="Diterbitkan"
							control={control}
							errors={errors}
							dirtyFields={dirtyFields}
							rules={{
								required: 'Diterbitkan wajib diisi.',
								validate: (value) => value.trim().length > 0 || 'Diterbitkan wajib diisi.',
							}}
							fullWidth
						/>
					</Grid>
					<Grid item xs={12} md={6}>
						<Controller
							name="vendorId"
							control={control}
							rules={{ required: 'Vendor Pengurus wajib dipilih.' }}
							render={({ field }) => (
								<Autocomplete
									options={vendorOptions}
									value={vendorOptions.find((option) => option.id === Number(field.value)) || null}
									onChange={(_, selectedOption) => {
										field.onChange(selectedOption?.id || '');
									}}
									isOptionEqualToValue={(option, value) => option.id === value.id}
									getOptionLabel={(option) => option?.vendorName || ''}
									renderInput={(params) => (
										<TextField
											{...params}
											label="Vendor Pengurus"
											error={Boolean(errors.vendorId)}
											helperText={errors.vendorId?.message || ' '}
										/>
									)}
									fullWidth
								/>
							)}
						/>
					</Grid>
					<Grid item xs={12} md={3}>
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
					<Grid item xs={12} md={3}>
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
				<Button type="submit" form="unit-license-certification-form" variant="contained" disabled={loading}>
					{loading ? 'Menyimpan...' : 'Simpan'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default UnitLicenseCertificationFormDialog;
