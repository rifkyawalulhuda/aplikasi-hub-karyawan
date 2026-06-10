import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';

import FormInput from '@/components/formInput';

function toDefaultValues(initialValue) {
	return {
		name: initialValue?.name || '',
	};
}

function SiteFormDialog({ open, loading, initialValue, onClose, onSubmit }) {
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
		<Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm">
			<DialogTitle>{isEditMode ? 'Edit Site' : 'Tambah Site'}</DialogTitle>
			<DialogContent>
				<Grid
					container
					spacing={2}
					component="form"
					id="site-form"
					sx={{ pt: 1 }}
					onSubmit={handleSubmit(onSubmit)}
				>
					<Grid item xs={12}>
						<FormInput
							name="name"
							label="Nama Site"
							control={control}
							errors={errors}
							dirtyFields={dirtyFields}
							rules={{
								required: 'Nama site wajib diisi.',
								minLength: { value: 1, message: 'Nama site wajib diisi.' },
								maxLength: { value: 100, message: 'Nama site maksimal 100 karakter.' },
								validate: (value) => value.trim().length > 0 || 'Nama site wajib diisi.',
							}}
							fullWidth
						/>
					</Grid>
				</Grid>
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 3 }}>
				<Button onClick={onClose} disabled={loading} color="inherit">
					Batal
				</Button>
				<Button type="submit" form="site-form" variant="contained" disabled={loading}>
					{loading ? 'Menyimpan...' : 'Simpan'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default SiteFormDialog;
