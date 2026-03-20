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
	const buildDefaultValues = () =>
		fields.reduce((defaultValues, field) => {
			let fieldValue = initialValue?.[field.name] || '';

			if (field.type === 'date' && fieldValue) {
				const d = new Date(fieldValue);
				if (!Number.isNaN(d.getTime())) {
					const year = d.getFullYear();
					const month = String(d.getMonth() + 1).padStart(2, '0');
					const day = String(d.getDate()).padStart(2, '0');
					fieldValue = `${year}-${month}-${day}`;
				}
			}

			if (field.type === 'select-custom') {
				const hasPresetOption = field.options?.includes(fieldValue);
				let selectionValue = '';

				if (hasPresetOption) {
					selectionValue = fieldValue;
				} else if (fieldValue) {
					selectionValue = '__custom__';
				}

				return {
					...defaultValues,
					[field.name]: hasPresetOption ? fieldValue : '',
					[`${field.name}Selection`]: selectionValue,
					[`${field.name}Custom`]: hasPresetOption ? '' : fieldValue,
				};
			}

			return {
				...defaultValues,
				[field.name]: fieldValue,
			};
		}, {});
	const {
		control,
		handleSubmit,
		reset,
		watch,
		formState: { errors, dirtyFields },
	} = useForm({
		defaultValues: buildDefaultValues(),
	});

	useEffect(() => {
		reset(buildDefaultValues());
	}, [fields, initialValue, open, reset]);

	const watchedValues = watch();

	const normalizeSubmitValues = (values) =>
		fields.reduce((normalizedValues, field) => {
			if (field.type === 'select-custom') {
				const selectedValue = values[`${field.name}Selection`];
				const customValue = values[`${field.name}Custom`];

				return {
					...normalizedValues,
					[field.name]: selectedValue === '__custom__' ? customValue.trim() : selectedValue,
				};
			}

			return {
				...normalizedValues,
				[field.name]: typeof values[field.name] === 'string' ? values[field.name].trim() : values[field.name],
			};
		}, {});

	return (
		<Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm">
			<DialogTitle>{isEditMode ? `Edit ${config.fieldLabel}` : `Tambah ${config.fieldLabel}`}</DialogTitle>
			<DialogContent>
				<Stack
					component="form"
					id={`master-data-form-${config.resource}`}
					spacing={2}
					pt={1}
					onSubmit={handleSubmit((values) => onSubmit(normalizeSubmitValues(values)))}
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
						const customSelectOptions =
							field.type === 'select-custom'
								? [
										...(field.options?.map((option) => (
											<MenuItem key={option} value={option}>
												{option}
											</MenuItem>
										)) || []),
										<MenuItem key="__custom__" value="__custom__">
											{field.customOptionLabel || 'Lainnya'}
										</MenuItem>,
								  ]
								: null;
						const selectedCustomValue =
							field.type === 'select-custom' ? watchedValues[`${field.name}Selection`] : null;

						return (
							<Stack key={field.name} spacing={selectedCustomValue === '__custom__' ? 1.5 : 0}>
								{field.type === 'select-custom' ? (
									<>
										<FormInput
											name={`${field.name}Selection`}
											label={field.label}
											placeholder={field.placeholder}
											control={control}
											errors={errors}
											dirtyFields={dirtyFields}
											rules={{
												required: `${field.label} wajib diisi.`,
											}}
											fullWidth
											autoFocus={index === 0}
											select
										>
											{customSelectOptions}
										</FormInput>
										{selectedCustomValue === '__custom__' ? (
											<FormInput
												name={`${field.name}Custom`}
												label={`${field.label} Lainnya`}
												placeholder={
													field.customPlaceholder || `Masukkan ${field.label.toLowerCase()}`
												}
												control={control}
												errors={errors}
												dirtyFields={dirtyFields}
												rules={{
													required: `${field.label} lainnya wajib diisi.`,
													validate: (value) =>
														value.trim().length > 0 ||
														`${field.label} lainnya wajib diisi.`,
												}}
												fullWidth
											/>
										) : null}
									</>
								) : (
									<FormInput
										name={field.name}
										label={field.label}
										placeholder={field.placeholder}
										control={control}
										errors={errors}
										dirtyFields={dirtyFields}
										rules={{
											required: `${field.label} wajib diisi.`,
											validate: (value) => {
												if (typeof value === 'string') {
													return value.trim().length > 0 || `${field.label} wajib diisi.`;
												}
												return (
													(value !== undefined && value !== null && value !== '') ||
													`${field.label} wajib diisi.`
												);
											},
										}}
										fullWidth
										autoFocus={index === 0}
										multiline={field.type === 'multiline'}
										rows={field.rows}
										select={field.type === 'select'}
										type={field.type}
										inputProps={{
											...(field.maxLength ? { maxLength: field.maxLength } : {}),
											...(field.type === 'number' && field.maxLength
												? {
														onInput: (e) => {
															e.target.value = e.target.value.slice(0, field.maxLength);
														},
												  }
												: {}),
										}}
										InputLabelProps={field.type === 'date' ? { shrink: true } : undefined}
									>
										{selectOptions}
									</FormInput>
								)}
							</Stack>
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
