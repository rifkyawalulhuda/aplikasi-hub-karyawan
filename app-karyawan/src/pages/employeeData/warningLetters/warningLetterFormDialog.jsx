import { useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';

import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import Grid from '@mui/material/Grid';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import TextField from '@mui/material/TextField';

import FormInput from '@/components/formInput';

import { getSuperiorOptions, WARNING_LEVEL_OPTIONS } from './utils';

function toDefaultValues(initialValue) {
	return {
		employeeId: initialValue?.employeeId || '',
		employeeNo: initialValue?.employeeNo || '',
		warningLevel: initialValue?.warningLevel || 1,
		letterNumber: initialValue?.letterNumber || '',
		letterDate: initialValue?.letterDate || '',
		violation: initialValue?.violation || '',
		masterDokPkbId: initialValue?.masterDokPkbId || '',
		articleContent: initialValue?.articleContent || '',
		superiorEmployeeId: initialValue?.superiorEmployeeId || '',
	};
}

function WarningLetterFormDialog({
	open,
	loading,
	initialValue,
	employeeOptions,
	masterDokPkbOptions,
	onClose,
	onSubmit,
}) {
	const isEditMode = Boolean(initialValue);
	const superiorOptions = getSuperiorOptions(employeeOptions);
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
	const selectedArticleId = useWatch({
		control,
		name: 'masterDokPkbId',
	});
	const employeeNo = useWatch({
		control,
		name: 'employeeNo',
	});
	const articleContent = useWatch({
		control,
		name: 'articleContent',
	});

	useEffect(() => {
		reset(toDefaultValues(initialValue));
	}, [initialValue, open, reset]);

	useEffect(() => {
		const selectedEmployee = employeeOptions.find((item) => item.id === Number(selectedEmployeeId));
		setValue('employeeNo', selectedEmployee?.employeeNo || '');
	}, [employeeOptions, selectedEmployeeId, setValue]);

	useEffect(() => {
		const selectedArticle = masterDokPkbOptions.find((item) => item.id === Number(selectedArticleId));
		setValue('articleContent', selectedArticle?.content || '');
	}, [masterDokPkbOptions, selectedArticleId, setValue]);

	return (
		<Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="lg">
			<DialogTitle>{isEditMode ? 'Edit Data Surat Peringatan' : 'Form Surat Peringatan'}</DialogTitle>
			<DialogContent>
				<Grid
					container
					spacing={2}
					component="form"
					id="warning-letter-form"
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
					<Grid item xs={12}>
						<Controller
							name="warningLevel"
							control={control}
							rules={{ required: 'Surat Peringatan ke wajib dipilih.' }}
							render={({ field }) => (
								<FormControl error={Boolean(errors.warningLevel)}>
									<FormLabel>Surat Peringatan ke</FormLabel>
									<RadioGroup
										row
										value={String(field.value)}
										onChange={(event) => field.onChange(Number(event.target.value))}
									>
										{WARNING_LEVEL_OPTIONS.map((option) => (
											<FormControlLabel
												key={option}
												value={String(option)}
												control={<Radio />}
												label={String(option)}
											/>
										))}
									</RadioGroup>
									<FormHelperText>{errors.warningLevel?.message}</FormHelperText>
								</FormControl>
							)}
						/>
					</Grid>
					<Grid item xs={12} md={6}>
						<FormInput
							name="letterNumber"
							label="Nomor Surat"
							placeholder="Masukkan nomor surat"
							control={control}
							errors={errors}
							dirtyFields={dirtyFields}
							rules={{
								required: 'Nomor Surat wajib diisi.',
								maxLength: {
									value: 25,
									message: 'Nomor Surat maksimal 25 karakter.',
								},
								validate: (value) => value.trim().length > 0 || 'Nomor Surat wajib diisi.',
							}}
							fullWidth
							inputProps={{ maxLength: 25 }}
						/>
					</Grid>
					<Grid item xs={12} md={6}>
						<FormInput
							name="letterDate"
							label="Tanggal Surat Peringatan"
							type="date"
							control={control}
							errors={errors}
							dirtyFields={dirtyFields}
							rules={{ required: 'Tanggal Surat Peringatan wajib diisi.' }}
							fullWidth
							InputLabelProps={{ shrink: true }}
						/>
					</Grid>
					<Grid item xs={12}>
						<FormInput
							name="violation"
							label="Pelanggaran"
							control={control}
							errors={errors}
							dirtyFields={dirtyFields}
							rules={{ required: 'Pelanggaran wajib diisi.' }}
							fullWidth
							multiline
							minRows={4}
						/>
					</Grid>
					<Grid item xs={12} md={5}>
						<Controller
							name="masterDokPkbId"
							control={control}
							rules={{ required: 'Pasal PKB wajib dipilih.' }}
							render={({ field }) => (
								<Autocomplete
									options={masterDokPkbOptions}
									value={
										masterDokPkbOptions.find((option) => option.id === Number(field.value)) || null
									}
									onChange={(_, selectedOption) => {
										field.onChange(selectedOption?.id || '');
									}}
									isOptionEqualToValue={(option, value) => option.id === value.id}
									getOptionLabel={(option) => option?.article || ''}
									renderInput={(params) => (
										<TextField
											{...params}
											label="Pasal PKB"
											error={Boolean(errors.masterDokPkbId)}
											helperText={errors.masterDokPkbId?.message || ' '}
										/>
									)}
									fullWidth
								/>
							)}
						/>
					</Grid>
					<Grid item xs={12} md={7}>
						<TextField
							label="ISI Pasal"
							value={articleContent || ''}
							fullWidth
							disabled
							multiline
							minRows={4}
						/>
					</Grid>
					<Grid item xs={12}>
						<Controller
							name="superiorEmployeeId"
							control={control}
							rules={{ required: 'Superior wajib dipilih.' }}
							render={({ field }) => (
								<Autocomplete
									options={superiorOptions}
									value={superiorOptions.find((option) => option.id === Number(field.value)) || null}
									onChange={(_, selectedOption) => {
										field.onChange(selectedOption?.id || '');
									}}
									isOptionEqualToValue={(option, value) => option.id === value.id}
									getOptionLabel={(option) => option?.fullName || ''}
									renderOption={(props, option) => (
										<Box component="li" {...props} key={option.id}>
											{option.fullName}
										</Box>
									)}
									renderInput={(params) => (
										<TextField
											{...params}
											label="Superior (Department Manager)"
											error={Boolean(errors.superiorEmployeeId)}
											helperText={errors.superiorEmployeeId?.message || ' '}
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
				<Button type="submit" form="warning-letter-form" variant="contained" disabled={loading}>
					{loading ? 'Menyimpan...' : 'Simpan'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default WarningLetterFormDialog;
