import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';

import FormInput from '@/components/formInput';
import {
	DEFAULT_EMPLOYMENT_TYPE,
	DEFAULT_GRADE,
	EDUCATION_LEVEL_OPTIONS,
	EMPLOYMENT_TYPE_OPTIONS,
	formatEmploymentTypeLabel,
	formatGradeLabel,
	GENDER_OPTIONS,
	GRADE_OPTIONS,
} from '@/constants/employeeMaster';

function toDefaultValues(initialValue) {
	return {
		employeeNo: initialValue?.employeeNo || '',
		password: initialValue?.password || '',
		fullName: initialValue?.fullName || '',
		employmentType: formatEmploymentTypeLabel(initialValue?.employmentType || DEFAULT_EMPLOYMENT_TYPE),
		siteDiv: initialValue?.siteDiv || 'CLC',
		departmentId: initialValue?.departmentId || '',
		birthDate: initialValue?.birthDate || '',
		gender: initialValue?.gender || 'MALE',
		workLocationId: initialValue?.workLocationId || '',
		jobRoleId: initialValue?.jobRoleId || '',
		jobLevelId: initialValue?.jobLevelId || '',
		educationLevel: initialValue?.educationLevel || 'SMA',
		grade: formatGradeLabel(initialValue?.grade || DEFAULT_GRADE),
		joinDate: initialValue?.joinDate || '',
		phoneNumber: initialValue?.phoneNumber || '',
		email: initialValue?.email || '',
	};
}

function EmployeeFormDialog({ open, loading, initialValue, options, onClose, onSubmit }) {
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

	return (
		<Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="md">
			<DialogTitle>{isEditMode ? 'Edit Master Karyawan' : 'Tambah Master Karyawan'}</DialogTitle>
			<DialogContent>
				<Grid
					container
					spacing={2}
					component="form"
					id="employee-master-form"
					sx={{ pt: 1 }}
					onSubmit={handleSubmit(onSubmit)}
				>
					<Grid item xs={12} md={6}>
						<FormInput
							name="employeeNo"
							label="Employee No"
							control={control}
							errors={errors}
							dirtyFields={dirtyFields}
							rules={{ required: 'Employee No wajib diisi.' }}
							fullWidth
							autoFocus
						/>
					</Grid>
					<Grid item xs={12} md={6}>
						<FormInput
							name="password"
							label="Password"
							control={control}
							errors={errors}
							dirtyFields={dirtyFields}
							rules={{ required: 'Password wajib diisi.' }}
							fullWidth
						/>
					</Grid>
					<Grid item xs={12} md={6}>
						<FormInput
							name="fullName"
							label="Fullname"
							control={control}
							errors={errors}
							dirtyFields={dirtyFields}
							rules={{ required: 'Fullname wajib diisi.' }}
							fullWidth
						/>
					</Grid>
					<Grid item xs={12} md={6}>
						<FormInput
							name="employmentType"
							label="Employment Type"
							control={control}
							errors={errors}
							dirtyFields={dirtyFields}
							rules={{ required: 'Employment Type wajib dipilih.' }}
							fullWidth
							select
						>
							{EMPLOYMENT_TYPE_OPTIONS.map((option) => (
								<MenuItem key={option.value} value={option.value}>
									{option.label}
								</MenuItem>
							))}
						</FormInput>
					</Grid>
					<Grid item xs={12} md={6}>
						<FormInput
							name="siteDiv"
							label="Site / Div"
							control={control}
							errors={errors}
							dirtyFields={dirtyFields}
							rules={{ required: 'Site / Div wajib diisi.' }}
							fullWidth
						/>
					</Grid>
					<Grid item xs={12} md={6}>
						<FormInput
							name="departmentId"
							label="Department"
							control={control}
							errors={errors}
							dirtyFields={dirtyFields}
							rules={{ required: 'Department wajib dipilih.' }}
							fullWidth
							select
						>
							{options.departments.map((option) => (
								<MenuItem key={option.id} value={option.id}>
									{option.name}
								</MenuItem>
							))}
						</FormInput>
					</Grid>
					<Grid item xs={12} md={6}>
						<FormInput
							name="birthDate"
							label="Birth Date"
							type="date"
							control={control}
							errors={errors}
							dirtyFields={dirtyFields}
							rules={{ required: 'Birth Date wajib diisi.' }}
							fullWidth
							InputLabelProps={{ shrink: true }}
						/>
					</Grid>
					<Grid item xs={12} md={6}>
						<FormInput
							name="gender"
							label="Gender"
							control={control}
							errors={errors}
							dirtyFields={dirtyFields}
							rules={{ required: 'Gender wajib dipilih.' }}
							fullWidth
							select
						>
							{GENDER_OPTIONS.map((option) => (
								<MenuItem key={option.value} value={option.value}>
									{option.label}
								</MenuItem>
							))}
						</FormInput>
					</Grid>
					<Grid item xs={12} md={6}>
						<FormInput
							name="workLocationId"
							label="Work Location"
							control={control}
							errors={errors}
							dirtyFields={dirtyFields}
							rules={{ required: 'Work Location wajib dipilih.' }}
							fullWidth
							select
						>
							{options.workLocations.map((option) => (
								<MenuItem key={option.id} value={option.id}>
									{option.name}
								</MenuItem>
							))}
						</FormInput>
					</Grid>
					<Grid item xs={12} md={6}>
						<FormInput
							name="jobRoleId"
							label="Job Role"
							control={control}
							errors={errors}
							dirtyFields={dirtyFields}
							rules={{ required: 'Job Role wajib dipilih.' }}
							fullWidth
							select
						>
							{options.jobRoles.map((option) => (
								<MenuItem key={option.id} value={option.id}>
									{option.name}
								</MenuItem>
							))}
						</FormInput>
					</Grid>
					<Grid item xs={12} md={6}>
						<FormInput
							name="jobLevelId"
							label="Job Level"
							control={control}
							errors={errors}
							dirtyFields={dirtyFields}
							rules={{ required: 'Job Level wajib dipilih.' }}
							fullWidth
							select
						>
							{options.jobLevels.map((option) => (
								<MenuItem key={option.id} value={option.id}>
									{option.name}
								</MenuItem>
							))}
						</FormInput>
					</Grid>
					<Grid item xs={12} md={6}>
						<FormInput
							name="educationLevel"
							label="Education Level"
							control={control}
							errors={errors}
							dirtyFields={dirtyFields}
							rules={{ required: 'Education Level wajib dipilih.' }}
							fullWidth
							select
						>
							{EDUCATION_LEVEL_OPTIONS.map((option) => (
								<MenuItem key={option.value} value={option.value}>
									{option.label}
								</MenuItem>
							))}
						</FormInput>
					</Grid>
					<Grid item xs={12} md={6}>
						<FormInput
							name="grade"
							label="Grade"
							control={control}
							errors={errors}
							dirtyFields={dirtyFields}
							rules={{ required: 'Grade wajib dipilih.' }}
							fullWidth
							select
						>
							{GRADE_OPTIONS.map((option) => (
								<MenuItem key={option.value} value={option.value}>
									{option.label}
								</MenuItem>
							))}
						</FormInput>
					</Grid>
					<Grid item xs={12} md={6}>
						<FormInput
							name="joinDate"
							label="Join Date"
							type="date"
							control={control}
							errors={errors}
							dirtyFields={dirtyFields}
							rules={{ required: 'Join Date wajib diisi.' }}
							fullWidth
							InputLabelProps={{ shrink: true }}
						/>
					</Grid>
					<Grid item xs={12} md={6}>
						<FormInput
							name="phoneNumber"
							label="Phone Number"
							control={control}
							errors={errors}
							dirtyFields={dirtyFields}
							rules={{ required: 'Phone Number wajib diisi.' }}
							fullWidth
						/>
					</Grid>
					<Grid item xs={12}>
						<FormInput
							name="email"
							label="Email"
							control={control}
							errors={errors}
							dirtyFields={dirtyFields}
							fullWidth
						/>
					</Grid>
				</Grid>
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 3 }}>
				<Button onClick={onClose} disabled={loading} color="inherit">
					Batal
				</Button>
				<Button type="submit" form="employee-master-form" variant="contained" disabled={loading}>
					{loading ? 'Menyimpan...' : 'Simpan'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default EmployeeFormDialog;
