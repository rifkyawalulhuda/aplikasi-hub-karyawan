import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

function PasswordTextField({
	field,
	label,
	visible,
	onToggleVisibility,
	errorMessage,
	helperText = ' ',
	autoComplete,
}) {
	return (
		<TextField
			{...field}
			label={label}
			type={visible ? 'text' : 'password'}
			fullWidth
			autoComplete={autoComplete}
			error={Boolean(errorMessage)}
			helperText={errorMessage || helperText}
			InputProps={{
				startAdornment: (
					<InputAdornment position="start">
						<LockOutlinedIcon fontSize="small" />
					</InputAdornment>
				),
				endAdornment: (
					<InputAdornment position="end">
						<IconButton edge="end" aria-label={`toggle-${label}`} onClick={onToggleVisibility}>
							{visible ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
						</IconButton>
					</InputAdornment>
				),
			}}
		/>
	);
}

function ChangePasswordDialog({ open, loading, errorMessage, onClose, onSubmit }) {
	const theme = useTheme();
	const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
	const [visibility, setVisibility] = useState({
		currentPassword: false,
		newPassword: false,
		confirmNewPassword: false,
	});
	const {
		control,
		handleSubmit,
		reset,
		watch,
		formState: { errors },
	} = useForm({
		defaultValues: {
			currentPassword: '',
			newPassword: '',
			confirmNewPassword: '',
		},
	});
	const currentPassword = watch('currentPassword');
	const newPassword = watch('newPassword');

	useEffect(() => {
		if (open) {
			reset({
				currentPassword: '',
				newPassword: '',
				confirmNewPassword: '',
			});
			setVisibility({
				currentPassword: false,
				newPassword: false,
				confirmNewPassword: false,
			});
		}
	}, [open, reset]);

	const toggleVisibility = (key) => {
		setVisibility((currentVisibility) => ({
			...currentVisibility,
			[key]: !currentVisibility[key],
		}));
	};

	return (
		<Dialog
			open={open}
			onClose={loading ? undefined : onClose}
			fullWidth
			fullScreen={fullScreen}
			maxWidth="sm"
			PaperProps={{
				sx: {
					borderTopLeftRadius: fullScreen ? 0 : 20,
					borderTopRightRadius: fullScreen ? 0 : 20,
					borderBottomLeftRadius: 20,
					borderBottomRightRadius: 20,
				},
			}}
		>
			<DialogTitle sx={{ pb: 1 }}>Ubah Password</DialogTitle>
			<DialogContent sx={{ pt: '8px !important' }}>
				<Stack spacing={2}>
					<Typography variant="body2" color="text.secondary">
						Masukkan password saat ini, lalu simpan password baru Anda.
					</Typography>
					{errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
					<Controller
						name="currentPassword"
						control={control}
						rules={{ required: 'Password Saat Ini wajib diisi.' }}
						render={({ field }) => (
							<PasswordTextField
								field={field}
								label="Password Saat Ini"
								visible={visibility.currentPassword}
								onToggleVisibility={() => toggleVisibility('currentPassword')}
								errorMessage={errors.currentPassword?.message}
								autoComplete="current-password"
							/>
						)}
					/>
					<Controller
						name="newPassword"
						control={control}
						rules={{
							required: 'Password Baru wajib diisi.',
							validate: (value) => {
								if (String(value || '').trim() === String(currentPassword || '').trim()) {
									return 'Password baru tidak boleh sama dengan password saat ini.';
								}

								return true;
							},
						}}
						render={({ field }) => (
							<PasswordTextField
								field={field}
								label="Password Baru"
								visible={visibility.newPassword}
								onToggleVisibility={() => toggleVisibility('newPassword')}
								errorMessage={errors.newPassword?.message}
								autoComplete="new-password"
							/>
						)}
					/>
					<Controller
						name="confirmNewPassword"
						control={control}
						rules={{
							required: 'Konfirmasi Password Baru wajib diisi.',
							validate: (value) => {
								if (String(value || '').trim() !== String(newPassword || '').trim()) {
									return 'Konfirmasi password baru tidak cocok.';
								}

								return true;
							},
						}}
						render={({ field }) => (
							<PasswordTextField
								field={field}
								label="Konfirmasi Password Baru"
								visible={visibility.confirmNewPassword}
								onToggleVisibility={() => toggleVisibility('confirmNewPassword')}
								errorMessage={errors.confirmNewPassword?.message}
								autoComplete="new-password"
							/>
						)}
					/>
				</Stack>
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 3 }}>
				<Button onClick={onClose} disabled={loading} color="inherit">
					Batal
				</Button>
				<Button
					onClick={handleSubmit(onSubmit)}
					variant="contained"
					disabled={loading}
					startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
				>
					{loading ? 'Menyimpan...' : 'Simpan Password'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default ChangePasswordDialog;
