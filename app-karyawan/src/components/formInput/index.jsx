import { Controller } from 'react-hook-form';

import { TextField } from '@mui/material';
import InputAdornment from '@mui/material/InputAdornment';

import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';

function getNestedValue(source, path) {
	if (!source || !path) {
		return undefined;
	}

	return String(path)
		.split('.')
		.reduce((accumulator, key) => (accumulator ? accumulator[key] : undefined), source);
}

function FormInput({ name, rules, control, errors, dirtyFields, element = TextField, children, ...otherProps }) {
	const InputComponent = element;
	const fieldError = getNestedValue(errors, name);
	const isDirty = Boolean(getNestedValue(dirtyFields, name));

	return (
		<Controller
			control={control}
			name={name}
			rules={rules}
			render={({ field }) => (
				<InputComponent
					error={Boolean(fieldError)}
					helperText={fieldError ? fieldError.message : ' '}
					{...otherProps}
					{...field}
					InputProps={{
						endAdornment: isDirty && (
							<InputAdornment position="end" sx={{ mr: otherProps?.select ? '16px' : '' }}>
								{fieldError ? <CloseIcon color="error" /> : <CheckIcon color="success" />}
							</InputAdornment>
						),
					}}
				>
					{children}
				</InputComponent>
			)}
		/>
	);
}

export default FormInput;
