import { useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';

import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import FormInput from '@/components/formInput';

import { getGuidanceCategoryConfig } from './constants';

const MEETING_OPTIONS = [1, 2, 3, 4];

function toDefaultValues(initialValue, category) {
	return {
		category: initialValue?.category || category,
		employeeId: initialValue?.employeeId || '',
		employeeNo: initialValue?.employeeNo || '',
		departmentName: initialValue?.departmentName || '',
		positionName: initialValue?.positionName || '',
		rank: initialValue?.rank || '',
		meetingNumber: initialValue?.meetingNumber || 1,
		meetingDate: initialValue?.meetingDate || '',
		meetingTime: initialValue?.meetingTime || '',
		location: initialValue?.location || '',
		problemFaced: initialValue?.problemFaced || '',
		problemFacedSecondary: initialValue?.problemFacedSecondary || '',
		problemCause: initialValue?.problemCause || '',
		problemSolving: initialValue?.problemSolving || '',
	};
}

function GuidanceFormDialog({ open, loading, initialValue, employeeOptions, category, onClose, onSubmit }) {
	const isEditMode = Boolean(initialValue);
	const activeCategory = initialValue?.category || category;
	const categoryConfig = getGuidanceCategoryConfig(activeCategory);
	const {
		control,
		handleSubmit,
		reset,
		setValue,
		formState: { errors, dirtyFields },
	} = useForm({
		defaultValues: toDefaultValues(initialValue, activeCategory),
	});

	const selectedEmployeeId = useWatch({
		control,
		name: 'employeeId',
	});
	const employeeNo = useWatch({
		control,
		name: 'employeeNo',
	});
	const departmentName = useWatch({
		control,
		name: 'departmentName',
	});
	const positionName = useWatch({
		control,
		name: 'positionName',
	});
	const rank = useWatch({
		control,
		name: 'rank',
	});

	useEffect(() => {
		reset(toDefaultValues(initialValue, activeCategory));
	}, [activeCategory, initialValue, open, reset]);

	useEffect(() => {
		const selectedEmployee = employeeOptions.find((item) => item.id === Number(selectedEmployeeId));

		setValue('employeeNo', selectedEmployee?.employeeNo || '');
		setValue('departmentName', selectedEmployee?.departmentName || '');
		setValue('positionName', selectedEmployee?.jobLevelName || '');
		setValue('rank', selectedEmployee?.grade || '');
	}, [employeeOptions, selectedEmployeeId, setValue]);

	const handleFormSubmit = (values) => {
		onSubmit({
			...values,
			category: activeCategory,
		});
	};

	return (
		<Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="lg">
			<DialogTitle>{isEditMode ? `Edit ${categoryConfig.formTitle}` : categoryConfig.formTitle}</DialogTitle>
			<DialogContent>
				<Grid
					container
					spacing={2}
					component="form"
					id="guidance-record-form"
					sx={{ pt: 1 }}
					onSubmit={handleSubmit(handleFormSubmit)}
				>
					<Grid item xs={12} md={3}>
						<FormInput
							name="meetingNumber"
							label="Pertemuan Ke"
							control={control}
							errors={errors}
							dirtyFields={dirtyFields}
							rules={{ required: 'Pertemuan ke wajib dipilih.' }}
							fullWidth
							select
						>
							{MEETING_OPTIONS.map((option) => (
								<MenuItem key={option} value={option}>
									{option}
								</MenuItem>
							))}
						</FormInput>
					</Grid>
					<Grid item xs={12} md={3}>
						<FormInput
							name="meetingDate"
							label="Tanggal"
							type="date"
							control={control}
							errors={errors}
							dirtyFields={dirtyFields}
							rules={{ required: 'Tanggal wajib diisi.' }}
							fullWidth
							InputLabelProps={{ shrink: true }}
						/>
					</Grid>
					<Grid item xs={12} md={3}>
						<FormInput
							name="meetingTime"
							label="Jam"
							type="time"
							control={control}
							errors={errors}
							dirtyFields={dirtyFields}
							rules={{ required: 'Jam wajib diisi.' }}
							fullWidth
							InputLabelProps={{ shrink: true }}
						/>
					</Grid>
					<Grid item xs={12} md={3}>
						<FormInput
							name="location"
							label="Tempat"
							control={control}
							errors={errors}
							dirtyFields={dirtyFields}
							rules={{ required: 'Tempat wajib diisi.' }}
							fullWidth
						/>
					</Grid>
					<Grid item xs={12} md={6}>
						<Controller
							name="employeeId"
							control={control}
							rules={{ required: 'Nama karyawan wajib dipilih.' }}
							render={({ field }) => (
								<Autocomplete
									options={employeeOptions}
									value={employeeOptions.find((option) => option.id === Number(field.value)) || null}
									onChange={(_, selectedOption) => {
										field.onChange(selectedOption?.id || '');
									}}
									isOptionEqualToValue={(option, value) => option.id === value.id}
									getOptionLabel={(option) => option?.fullName || ''}
									renderOption={(props, option) => (
										<li {...props} key={option.id}>
											{option.fullName}
										</li>
									)}
									renderInput={(params) => (
										<TextField
											{...params}
											label="Nama Karyawan"
											error={Boolean(errors.employeeId)}
											helperText={errors.employeeId?.message}
										/>
									)}
									fullWidth
								/>
							)}
						/>
					</Grid>
					<Grid item xs={12} md={3}>
						<TextField label="NIK" value={employeeNo || ''} fullWidth disabled />
					</Grid>
					<Grid item xs={12} md={3}>
						<TextField label="Departemen" value={departmentName || ''} fullWidth disabled />
					</Grid>
					<Grid item xs={12} md={6}>
						<TextField label="Jabatan" value={positionName || ''} fullWidth disabled />
					</Grid>
					<Grid item xs={12} md={6}>
						<TextField label="Rank" value={rank || ''} fullWidth disabled />
					</Grid>
					{categoryConfig.sectionTwoLabel ? (
						<Grid item xs={12}>
							<Divider textAlign="left">
								<Typography variant="subtitle2" fontWeight={700}>
									A. PERMASALAHAN YANG DIHADAPI
								</Typography>
							</Divider>
						</Grid>
					) : null}
					<Grid item xs={12}>
						<FormInput
							name="problemFaced"
							label={categoryConfig.sectionOneLabel}
							control={control}
							errors={errors}
							dirtyFields={dirtyFields}
							rules={{
								required:
									activeCategory === 'DIRECTION'
										? 'A.1 wajib diisi.'
										: 'Permasalahan yang dihadapi wajib diisi.',
							}}
							fullWidth
							multiline
							minRows={4}
						/>
					</Grid>
					{categoryConfig.sectionTwoLabel ? (
						<Grid item xs={12}>
							<FormInput
								name="problemFacedSecondary"
								label={categoryConfig.sectionTwoLabel}
								control={control}
								errors={errors}
								dirtyFields={dirtyFields}
								rules={{ required: 'A.2 wajib diisi.' }}
								fullWidth
								multiline
								minRows={4}
							/>
						</Grid>
					) : null}
					<Grid item xs={12}>
						<FormInput
							name="problemCause"
							label={categoryConfig.sectionCauseLabel}
							control={control}
							errors={errors}
							dirtyFields={dirtyFields}
							rules={{ required: 'Penyebab masalah wajib diisi.' }}
							fullWidth
							multiline
							minRows={4}
						/>
					</Grid>
					<Grid item xs={12}>
						<FormInput
							name="problemSolving"
							label={categoryConfig.sectionSolvingLabel}
							control={control}
							errors={errors}
							dirtyFields={dirtyFields}
							rules={{ required: 'Pemecahan masalah wajib diisi.' }}
							fullWidth
							multiline
							minRows={5}
						/>
					</Grid>
				</Grid>
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 3 }}>
				<Button onClick={onClose} disabled={loading} color="inherit">
					Batal
				</Button>
				<Button type="submit" form="guidance-record-form" variant="contained" disabled={loading}>
					{loading ? 'Menyimpan...' : 'Simpan'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default GuidanceFormDialog;
