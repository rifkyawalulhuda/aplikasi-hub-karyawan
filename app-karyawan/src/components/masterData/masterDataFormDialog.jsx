import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';

import FormInput from '@/components/formInput';

function MasterDataFormDialog({ config, open, loading, initialValue, onClose, onSubmit }) {
	const isEditMode = Boolean(initialValue);
	const fields = config.fields || [
		{
			name: 'name',
			label: config.fieldLabel,
			placeholder: config.fieldPlaceholder,
		},
	];
	const {
		control,
		handleSubmit,
		reset,
		formState: { errors, dirtyFields },
	} = useForm({
		defaultValues: fields.reduce(
			(defaultValues, field) => ({
				...defaultValues,
				[field.name]: initialValue?.[field.name] || '',
			}),
			{},
		),
	});

	useEffect(() => {
		reset(
			fields.reduce(
				(defaultValues, field) => ({
					...defaultValues,
					[field.name]: initialValue?.[field.name] || '',
				}),
				{},
			),
		);
	}, [fields, initialValue, open, reset]);

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
					{fields.map((field, index) => {
						const selectOptions =
							field.type === 'select'
								? field.options?.map((option) => (
										<MenuItem key={option} value={option}>
											{option}
										</MenuItem>
								  ))
								: null;

						return (
							<FormInput
								key={field.name}
								name={field.name}
								label={field.label}
								placeholder={field.placeholder}
								control={control}
								errors={errors}
								dirtyFields={dirtyFields}
								rules={{
									required: `${field.label} wajib diisi.`,
									validate: (value) => value.trim().length > 0 || `${field.label} wajib diisi.`,
								}}
								fullWidth
								autoFocus={index === 0}
								multiline={field.type === 'multiline'}
								rows={field.rows}
								select={field.type === 'select'}
							>
								{selectOptions}
							</FormInput>
						);
					})}
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
