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

const DOCUMENT_TYPE_OPTIONS = ['Sertifikat', 'Lisensi', 'Izin', 'Rahasia', 'Lainnya'];

function toDefaultValues(initialValue) {
	const isPresetType = DOCUMENT_TYPE_OPTIONS.includes(initialValue?.documentType);
	let documentTypeOption = '';

	if (initialValue?.documentType) {
		documentTypeOption = isPresetType ? initialValue.documentType : 'Lainnya';
	}

	return {
		documentName: initialValue?.documentName || '',
		documentTypeOption,
		customDocumentType: initialValue?.documentType && !isPresetType ? initialValue.documentType : '',
		issuer: initialValue?.issuer || '',
	};
}

function DocumentFormDialog({ open, loading, initialValue, onClose, onSubmit }) {
	const isEditMode = Boolean(initialValue);
	const {
		control,
		handleSubmit,
		reset,
		watch,
		formState: { errors, dirtyFields },
	} = useForm({
		defaultValues: toDefaultValues(initialValue),
	});

	const selectedType = watch('documentTypeOption');

	useEffect(() => {
		reset(toDefaultValues(initialValue));
	}, [initialValue, open, reset]);

	const handleFormSubmit = (values) => {
		onSubmit({
			documentName: values.documentName,
			documentType:
				values.documentTypeOption === 'Lainnya' ? values.customDocumentType : values.documentTypeOption,
			issuer: values.issuer,
		});
	};

	return (
		<Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm">
			<DialogTitle>{isEditMode ? 'Edit Master Dok Karyawan' : 'Tambah Master Dok Karyawan'}</DialogTitle>
			<DialogContent>
				<Grid
					container
					spacing={2}
					component="form"
					id="master-dok-karyawan-form"
					sx={{ pt: 1 }}
					onSubmit={handleSubmit(handleFormSubmit)}
				>
					<Grid item xs={12}>
						<FormInput
							name="documentName"
							label="Nama Dokumen"
							control={control}
							errors={errors}
							dirtyFields={dirtyFields}
							rules={{ required: 'Nama Dokumen wajib diisi.' }}
							fullWidth
							autoFocus
						/>
					</Grid>
					<Grid item xs={12}>
						<FormInput
							name="documentTypeOption"
							label="Jenis Dokumen"
							control={control}
							errors={errors}
							dirtyFields={dirtyFields}
							rules={{ required: 'Jenis Dokumen wajib dipilih.' }}
							fullWidth
							select
						>
							{DOCUMENT_TYPE_OPTIONS.map((option) => (
								<MenuItem key={option} value={option}>
									{option}
								</MenuItem>
							))}
						</FormInput>
					</Grid>
					{selectedType === 'Lainnya' ? (
						<Grid item xs={12}>
							<FormInput
								name="customDocumentType"
								label="Jenis Dokumen Lainnya"
								control={control}
								errors={errors}
								dirtyFields={dirtyFields}
								rules={{ required: 'Jenis Dokumen Lainnya wajib diisi.' }}
								fullWidth
							/>
						</Grid>
					) : null}
					<Grid item xs={12}>
						<FormInput
							name="issuer"
							label="Penerbit"
							control={control}
							errors={errors}
							dirtyFields={dirtyFields}
							rules={{ required: 'Penerbit wajib diisi.' }}
							fullWidth
						/>
					</Grid>
				</Grid>
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 3 }}>
				<Button onClick={onClose} disabled={loading} color="inherit">
					Batal
				</Button>
				<Button type="submit" form="master-dok-karyawan-form" variant="contained" disabled={loading}>
					{loading ? 'Menyimpan...' : 'Simpan'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default DocumentFormDialog;
