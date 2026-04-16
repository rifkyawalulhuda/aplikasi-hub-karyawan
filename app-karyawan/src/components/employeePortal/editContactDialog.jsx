import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { alpha, useTheme } from '@mui/material/styles';

import AlternateEmailOutlinedIcon from '@mui/icons-material/AlternateEmailOutlined';
import PhoneAndroidOutlinedIcon from '@mui/icons-material/PhoneAndroidOutlined';

function EditContactDialog({ open, loading, errorMessage, initialValues, onClose, onSubmit }) {
	const theme = useTheme();
	const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
	const {
		control,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm({
		defaultValues: {
			phoneNumber: '',
			email: '',
		},
	});

	useEffect(() => {
		if (open) {
			reset({
				phoneNumber: initialValues?.phoneNumber || '',
				email: initialValues?.email || '',
			});
		}
	}, [initialValues?.email, initialValues?.phoneNumber, open, reset]);

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
					border: `1px solid ${theme.palette.employeeSurface.borderSoft}`,
					backgroundColor: theme.palette.employeeSurface.card,
				},
			}}
		>
			<DialogTitle sx={{ pb: 1 }}>Ubah Kontak & Email</DialogTitle>
			<DialogContent sx={{ pt: '8px !important' }}>
				<Stack spacing={2}>
					<Typography variant="body2" color="text.secondary">
						Perubahan kontak dan email akan diteruskan sebagai notifikasi ke Admin.
					</Typography>
					{errorMessage ? (
						<Alert
							severity="error"
							sx={{
								border: '1px solid',
								borderColor: alpha(
									theme.palette.error.main,
									theme.palette.mode === 'dark' ? 0.24 : 0.16,
								),
							}}
						>
							{errorMessage}
						</Alert>
					) : null}
					<Controller
						name="phoneNumber"
						control={control}
						rules={{
							required: 'Kontak wajib diisi.',
						}}
						render={({ field }) => (
							<TextField
								{...field}
								label="Kontak"
								fullWidth
								autoComplete="tel"
								error={Boolean(errors.phoneNumber)}
								helperText={errors.phoneNumber?.message || 'Gunakan nomor yang aktif untuk dihubungi.'}
								InputProps={{
									startAdornment: (
										<InputAdornment position="start">
											<PhoneAndroidOutlinedIcon
												fontSize="small"
												sx={{ color: 'text.secondary' }}
											/>
										</InputAdornment>
									),
								}}
							/>
						)}
					/>
					<Controller
						name="email"
						control={control}
						rules={{
							validate: (value) => {
								const normalizedValue = String(value || '').trim();

								if (!normalizedValue) {
									return true;
								}

								const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
								if (!emailPattern.test(normalizedValue)) {
									return 'Format email tidak valid.';
								}

								return true;
							},
						}}
						render={({ field }) => (
							<TextField
								{...field}
								label="Email"
								fullWidth
								autoComplete="email"
								error={Boolean(errors.email)}
								helperText={errors.email?.message || 'Kosongkan jika belum memiliki email aktif.'}
								InputProps={{
									startAdornment: (
										<InputAdornment position="start">
											<AlternateEmailOutlinedIcon
												fontSize="small"
												sx={{ color: 'text.secondary' }}
											/>
										</InputAdornment>
									),
								}}
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
					{loading ? 'Menyimpan...' : 'Simpan Perubahan'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default EditContactDialog;
