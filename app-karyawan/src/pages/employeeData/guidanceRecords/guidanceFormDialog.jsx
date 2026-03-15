import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';

import FormInput from '@/components/formInput';

const MEETING_OPTIONS = [1, 2, 3, 4];

function toDefaultValues(initialValue) {
	return {
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
		problemCause: initialValue?.problemCause || '',
		problemSolving: initialValue?.problemSolving || '',
	};
}

function GuidanceFormDialog({ open, loading, initialValue, employeeOptions, onClose, onSubmit }) {
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
		reset(toDefaultValues(initialValue));
	}, [initialValue, open, reset]);

	useEffect(() => {
		const selectedEmployee = employeeOptions.find((item) => item.id === Number(selectedEmployeeId));

		setValue('employeeNo', selectedEmployee?.employeeNo || '');
		setValue('departmentName', selectedEmployee?.departmentName || '');
		setValue('positionName', selectedEmployee?.jobLevelName || '');
		setValue('rank', selectedEmployee?.grade || '');
	}, [employeeOptions, selectedEmployeeId, setValue]);

	return (
		<Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="lg">
			<DialogTitle>
				{isEditMode ? 'Edit Formulir Catatan Bimbingan Karyawan' : 'Formulir Catatan Bimbingan Karyawan'}
			</DialogTitle>
			<DialogContent>
				<Grid
					container
					spacing={2}
					component="form"
					id="guidance-record-form"
					sx={{ pt: 1 }}
					onSubmit={handleSubmit(onSubmit)}
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
						<FormInput
							name="employeeId"
							label="Nama Karyawan"
							control={control}
							errors={errors}
							dirtyFields={dirtyFields}
							rules={{ required: 'Nama karyawan wajib dipilih.' }}
							fullWidth
							select
						>
							{employeeOptions.map((option) => (
								<MenuItem key={option.id} value={option.id}>
									{option.fullName}
								</MenuItem>
							))}
						</FormInput>
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
					<Grid item xs={12}>
						<FormInput
							name="problemFaced"
							label="Permasalahan yang Dihadapi"
							control={control}
							errors={errors}
							dirtyFields={dirtyFields}
							rules={{ required: 'Permasalahan yang dihadapi wajib diisi.' }}
							fullWidth
							multiline
							minRows={4}
						/>
					</Grid>
					<Grid item xs={12}>
						<FormInput
							name="problemCause"
							label="Penyebab Masalah"
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
							label="Pemecahan Masalah (Oleh Atasan Langsung)"
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
