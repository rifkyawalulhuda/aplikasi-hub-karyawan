import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined';
import LoginRoundedIcon from '@mui/icons-material/LoginRounded';
import DownloadForOfflineOutlinedIcon from '@mui/icons-material/DownloadForOfflineOutlined';

import { useEmployeeAuth } from '@/contexts/employeeAuthContext';
import { employeeAuthRequest } from '@/services/employeeApi';

import logo from '@/assets/images/logo/png/Sankyu_logo_redicon_whitetext.png';

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
			enqueueSnackbar(error.message, { variant: 'error' });
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
		<Card
			elevation={0}
			sx={{
				width: '100%',
				borderRadius: 6,
				border: (theme) => `1px solid ${theme.palette.employeeSurface.borderSoft}`,
				backgroundColor: (theme) => theme.palette.employeeSurface.soft,
				boxShadow: (theme) => theme.palette.employeeSurface.shadowMedium,
				backdropFilter: 'blur(14px)',
				overflow: 'hidden',
			}}
		>
			<Box
				sx={{
					p: 3,
					background: (theme) => theme.palette.employeeSurface.heroGradient,
					color: '#FFFFFF',
				}}
			>
				<Stack spacing={2}>
					<Box component="img" src={logo} alt="Hub Karyawan" sx={{ width: 182, maxWidth: '100%' }} />
					<Box>
						<Typography variant="h4" sx={{ color: '#FFFFFF', fontWeight: 700 }}>
							Portal Karyawan
						</Typography>
					</Box>
				</Stack>
			</Box>

			<Box component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
				<Stack spacing={2.5}>
					<Box>
						<Typography
							variant="overline"
							sx={{ color: 'primary.main', letterSpacing: '0.12em', fontWeight: 700 }}
						>
							Login Karyawan
						</Typography>
						<Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 700 }}>
							Masuk dengan NIK
						</Typography>
						<Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
							Gunakan NIK dan password yang sudah diberikan oleh Admin, Jika lupa hubungi Admin untuk
							dilakukan reset password.
						</Typography>
					</Box>

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
					/>
					<FormControlLabel
						control={
							<Checkbox
								size="small"
								checked={showPassword}
								onChange={(event) => setShowPassword(event.target.checked)}
							/>
						}
						label="Tampilkan password"
						sx={{ ml: 0 }}
					/>
					<Button
						type="submit"
						variant="contained"
						disabled={submitting}
						endIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <LoginRoundedIcon />}
						sx={{
							minHeight: 52,
							borderRadius: 3,
							background: (theme) =>
								`linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
						}}
					>
						{submitting ? 'Memproses...' : 'Masuk'}
					</Button>
					{!isStandalone ? (
						<Box sx={{ display: 'grid', gap: 1.25 }}>
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
									minHeight: 46,
									borderRadius: 3,
									borderColor: 'primary.main',
									color: 'primary.main',
									opacity: installEvent ? 1 : 0.72,
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
									}}
								>
									<Typography variant="body2">
										Jika tombol install belum aktif, buka menu browser lalu pilih{' '}
										<strong>Add to Home Screen</strong> atau <strong>Install App</strong>.
									</Typography>
								</Alert>
							) : null}
						</Box>
					) : null}
				</Stack>
			</Box>
		</Card>
	);
}

export default EmployeeLoginPage;
