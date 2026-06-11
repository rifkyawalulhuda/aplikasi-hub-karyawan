import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import DownloadForOfflineOutlinedIcon from '@mui/icons-material/DownloadForOfflineOutlined';
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined';
import LoginRoundedIcon from '@mui/icons-material/LoginRounded';

import { useEmployeeAuth } from '@/contexts/employeeAuthContext';
import { employeeAuthRequest } from '@/services/employeeApi';

function EmployeeLoginPage() {
	const navigate = useNavigate();
	const location = useLocation();
	const { enqueueSnackbar } = useSnackbar();
	const { login } = useEmployeeAuth();
	const [nik, setNik] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [installEvent, setInstallEvent] = useState(null);
	const [installing, setInstalling] = useState(false);
	const [isStandalone, setIsStandalone] = useState(() => {
		if (typeof window === 'undefined') {
			return false;
		}

		return window.matchMedia('(display-mode: standalone)').matches;
	});

	const redirectTo = location.state?.from?.pathname || '/karyawan';

	useEffect(() => {
		const handleBeforeInstallPrompt = (event) => {
			event.preventDefault();
			setInstallEvent(event);
		};

		const handleInstalled = () => {
			setIsStandalone(true);
			setInstallEvent(null);
			enqueueSnackbar('Aplikasi berhasil dipasang di perangkat Anda.', { variant: 'success' });
		};

		window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
		window.addEventListener('appinstalled', handleInstalled);

		return () => {
			window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
			window.removeEventListener('appinstalled', handleInstalled);
		};
	}, [enqueueSnackbar]);

	const handleSubmit = async (event) => {
		event.preventDefault();
		setSubmitting(true);

		try {
			const response = await employeeAuthRequest('/login', {
				method: 'POST',
				body: JSON.stringify({
					nik,
					password,
				}),
			});

			login({
				accessToken: response.accessToken,
				tokenType: response.tokenType,
				expiresAt: response.expiresAt,
				user: response.user,
			});
			enqueueSnackbar(`Selamat datang, ${response.user.name}.`, { variant: 'success' });
			navigate(redirectTo, { replace: true });
		} catch (error) {
			enqueueSnackbar(error.message || 'Terjadi kesalahan. Silakan coba lagi.', { variant: 'error' });
		} finally {
			setSubmitting(false);
		}
	};

	const handleInstallApp = async () => {
		if (!installEvent) {
			enqueueSnackbar('Install belum tersedia otomatis. Buka menu browser lalu pilih Add to Home Screen.', {
				variant: 'info',
			});
			return;
		}

		setInstalling(true);
		try {
			await installEvent.prompt();
			await installEvent.userChoice;
			setInstallEvent(null);
		} finally {
			setInstalling(false);
		}
	};

	return (
		<Paper
			elevation={0}
			sx={{
				width: '100%',
				borderRadius: 6,
				overflow: 'hidden',
				border: (theme) => `1px solid ${theme.palette.employeeSurface.borderSoft}`,
				backgroundColor: (theme) => theme.palette.employeeSurface.card,
				boxShadow: (theme) => theme.palette.employeeSurface.shadowMedium,
			}}
		>
			{/* Header band */}
			<Box
				sx={{
					position: 'relative',
					p: 3,
					color: '#FFFFFF',
					background: 'linear-gradient(160deg, #0B2746 0%, #123C6C 54%, #2F74BC 100%)',
					'&::after': {
						content: '""',
						position: 'absolute',
						inset: 0,
						background:
							'radial-gradient(circle at top right, rgba(255,255,255,0.16), transparent 26%), radial-gradient(circle at bottom left, rgba(255,255,255,0.08), transparent 28%)',
						pointerEvents: 'none',
					},
				}}
			>
				<Stack spacing={1} alignItems="center" sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
					<Typography
						variant="overline"
						sx={{
							color: 'rgba(255,255,255,0.72)',
							letterSpacing: '0.16em',
							fontWeight: 800,
						}}
					>
						SANKYU
					</Typography>
					<Typography
						variant="subtitle1"
						sx={{
							color: '#FFFFFF',
							fontWeight: 800,
							lineHeight: 1.1,
							fontSize: '1.18rem',
							letterSpacing: '-0.01em',
						}}
					>
						Portal Karyawan
					</Typography>
				</Stack>
			</Box>

			{/* Form body */}
			<Box component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
				<Stack spacing={3}>
					{/* Intro block */}
					<Stack spacing={1}>
						<Typography
							variant="overline"
							sx={{ color: 'primary.main', letterSpacing: '0.12em', fontWeight: 800 }}
						>
							Login Karyawan
						</Typography>
						<Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 700 }}>
							Masuk dengan NIK
						</Typography>
						<Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55, fontSize: '1rem' }}>
							Gunakan NIK dan password yang sudah diberikan oleh Admin. Jika lupa, hubungi Admin untuk
							reset password.
						</Typography>
					</Stack>

					{/* Fields stack */}
					<Stack spacing={2}>
						<TextField
							label="NIK"
							name="nik"
							value={nik}
							onChange={(event) => setNik(event.target.value)}
							autoFocus
							required
							fullWidth
							autoComplete="username"
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<BadgeOutlinedIcon fontSize="small" />
									</InputAdornment>
								),
							}}
							InputLabelProps={{
								sx: { fontSize: '1rem' },
							}}
							sx={{
								'& .MuiOutlinedInput-root': {
									backgroundColor: (theme) =>
										alpha(
											theme.palette.background.paper,
											theme.palette.mode === 'dark' ? 0.4 : 0.92,
										),
								},
								'& .MuiOutlinedInput-input': {
									fontSize: '1rem',
								},
							}}
						/>
						<TextField
							label="Password"
							name="password"
							type={showPassword ? 'text' : 'password'}
							value={password}
							onChange={(event) => setPassword(event.target.value)}
							required
							fullWidth
							autoComplete="current-password"
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<LockOpenOutlinedIcon fontSize="small" />
									</InputAdornment>
								),
							}}
							InputLabelProps={{
								sx: { fontSize: '1rem' },
							}}
							sx={{
								'& .MuiOutlinedInput-root': {
									backgroundColor: (theme) =>
										alpha(
											theme.palette.background.paper,
											theme.palette.mode === 'dark' ? 0.4 : 0.92,
										),
								},
								'& .MuiOutlinedInput-input': {
									fontSize: '1rem',
								},
							}}
						/>
					</Stack>

					{/* Checkbox + CTA group */}
					<Stack spacing={2}>
						<FormControlLabel
							control={
								<Checkbox
									size="small"
									checked={showPassword}
									onChange={(event) => setShowPassword(event.target.checked)}
								/>
							}
							label="Tampilkan password"
							sx={{
								minHeight: 44,
								ml: -0.5,
								'& .MuiFormControlLabel-label': {
									fontSize: '0.875rem',
								},
							}}
						/>

						<Button
							type="submit"
							variant="contained"
							disabled={submitting}
							endIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <LoginRoundedIcon />}
							sx={{
								minHeight: 48,
								boxShadow: 'none',
								background: (theme) =>
									`linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
								'&.Mui-focusVisible': {
									outline: '2px solid',
									outlineColor: 'primary.main',
									outlineOffset: '2px',
								},
							}}
						>
							{submitting ? 'Memproses...' : 'Masuk'}
						</Button>
					</Stack>

					{/* Install section */}
					{!isStandalone ? (
						<Stack spacing={2}>
							<Divider sx={{ borderColor: (theme) => alpha(theme.palette.primary.main, 0.12) }} />
							<Button
								type="button"
								variant="outlined"
								onClick={handleInstallApp}
								disabled={submitting || installing}
								startIcon={
									installing ? (
										<CircularProgress size={16} color="inherit" />
									) : (
										<DownloadForOfflineOutlinedIcon />
									)
								}
								sx={{
									minHeight: 44,
									borderColor: (theme) => alpha(theme.palette.primary.main, 0.3),
									color: 'primary.main',
									bgcolor: (theme) =>
										alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.08 : 0.04),
									opacity: installEvent ? 1 : 0.9,
								}}
							>
								{installEvent ? 'Install App' : 'Install belum tersedia'}
							</Button>
							{!installEvent ? (
								<Alert
									severity="info"
									variant="outlined"
									sx={{
										alignItems: 'center',
										borderColor: (theme) =>
											alpha(
												theme.palette.primary.main,
												theme.palette.mode === 'dark' ? 0.28 : 0.16,
											),
										backgroundColor: (theme) =>
											alpha(
												theme.palette.primary.main,
												theme.palette.mode === 'dark' ? 0.08 : 0.04,
											),
									}}
								>
									<Typography variant="body2" sx={{ lineHeight: 1.5 }}>
										Jika tombol install belum aktif, buka menu browser lalu pilih{' '}
										<strong>Add to Home Screen</strong> atau <strong>Install App</strong>.
									</Typography>
								</Alert>
							) : null}
						</Stack>
					) : null}
				</Stack>
			</Box>
		</Paper>
	);
}

export default EmployeeLoginPage;
