import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';

import FormInput from '@/components/formInput';

function MasterDataFormDialog({ config, open, loading, initialValue, onClose, onSubmit }) {
	const isEditMode = Boolean(initialValue);
	const {
		control,
		handleSubmit,
		reset,
		formState: { errors, dirtyFields },
	} = useForm({
		defaultValues: {
			name: initialValue?.name || '',
		},
	});

	useEffect(() => {
		reset({
			name: initialValue?.name || '',
		});
	}, [initialValue, open, reset]);

	return (
		<Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm">
			<DialogTitle>{isEditMode ? `Edit ${config.fieldLabel}` : `Tambah ${config.fieldLabel}`}</DialogTitle>
			<DialogContent>
				<Stack
					component="form"
					id={`master-data-form-${config.resource}`}
					spacing={2}
					pt={1}
					onSubmit={handleSubmit(onSubmit)}
				>
					<FormInput
						name="name"
						label={config.fieldLabel}
						placeholder={config.fieldPlaceholder}
						control={control}
						errors={errors}
						dirtyFields={dirtyFields}
						rules={{
							required: `${config.fieldLabel} wajib diisi.`,
							validate: (value) => value.trim().length > 0 || `${config.fieldLabel} wajib diisi.`,
						}}
						fullWidth
						autoFocus
					/>
				</Stack>
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 3 }}>
				<Button onClick={onClose} disabled={loading} color="inherit">
					Batal
				</Button>
				<Button
					type="submit"
					form={`master-data-form-${config.resource}`}
					variant="contained"
					disabled={loading}
				>
					{loading ? 'Menyimpan...' : 'Simpan'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default MasterDataFormDialog;
