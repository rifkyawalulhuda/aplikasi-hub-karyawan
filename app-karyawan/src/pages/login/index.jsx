import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { alpha } from '@mui/material/styles';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined';
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';

import { useAuth } from '@/contexts/authContext';
import apiRequest from '@/services/api';
import logo from '@/assets/images/logo/png/Sankyu_logo_redicon_whitetext.png';

const ACCENT_BLUE = 'rgb(58, 147, 242)';
const ACCENT_BLUE_DARK = 'rgb(26, 76, 130)';
const ACCENT_BLUE_DEEP = 'rgb(16, 51, 90)';
const SURFACE_BLUE = '#F4F9FF';

const CORPORATE_POINTS = [
	'Akses terpusat untuk pengelolaan data karyawan.',
	'Bimbingan & Pengarahan Karyawan.',
	'Dokumentasi internal yang mudah diakses.',
];

function LoginPage() {
	const navigate = useNavigate();
	const location = useLocation();
	const { enqueueSnackbar } = useSnackbar();
	const { login } = useAuth();
	const [nik, setNik] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	const redirectTo = location.state?.from?.pathname || '/';

	const handleSubmit = async (event) => {
		event.preventDefault();
		setSubmitting(true);

		try {
			const response = await apiRequest('/auth/login', {
				method: 'POST',
				body: JSON.stringify({
					nik,
					password,
				}),
			});

			login(response.user);
			enqueueSnackbar(`Selamat datang, ${response.user.name}.`, { variant: 'success' });
			navigate(redirectTo, { replace: true });
		} catch (error) {
			enqueueSnackbar(error.message, { variant: 'error' });
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Card
			elevation={0}
			sx={{
				width: '100%',
				maxWidth: 1040,
				mx: 2,
				borderRadius: 6,
				overflow: 'hidden',
				border: '1px solid',
				borderColor: alpha(ACCENT_BLUE, 0.18),
				boxShadow: '0 28px 64px rgba(16, 51, 90, 0.24)',
			}}
		>
			<Box display="grid" gridTemplateColumns={{ xs: '1fr', md: 'minmax(340px, 0.95fr) minmax(420px, 1.05fr)' }}>
				<Box
					sx={{
						position: 'relative',
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'space-between',
						minHeight: { xs: 'auto', md: 640 },
						p: { xs: 3, sm: 4.5, md: 5 },
						color: '#FFFFFF',
						background: `linear-gradient(180deg, ${ACCENT_BLUE_DEEP} 0%, ${ACCENT_BLUE_DARK} 58%, ${ACCENT_BLUE} 100%)`,
						'&::before': {
							content: '""',
							position: 'absolute',
							inset: 0,
							background:
								'radial-gradient(circle at 18% 18%, rgba(255,255,255,0.16), transparent 24%), radial-gradient(circle at 80% 76%, rgba(160,212,255,0.16), transparent 28%)',
						},
					}}
				>
					<Stack spacing={4} sx={{ position: 'relative', zIndex: 1 }}>
						<Box
							sx={{
								alignSelf: 'flex-start',
								px: 1.5,
								py: 0.75,
								borderRadius: 999,
								border: '1px solid rgba(255,255,255,0.18)',
								backgroundColor: 'rgba(255,255,255,0.09)',
							}}
						>
							<Typography variant="caption" sx={{ letterSpacing: '0.14em', textTransform: 'uppercase' }}>
								Internal Portal
							</Typography>
						</Box>
						<Box
							component="img"
							src={logo}
							alt="Sankyu Hub Karyawan"
							sx={{ width: 280, maxWidth: '100%' }}
						/>
						<Stack spacing={1.5}>
							<Typography variant="h2" sx={{ fontWeight: 700, lineHeight: 1.15, color: '#FFFFFF' }}>
								Hub Karyawan
							</Typography>
							<Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.84)', fontWeight: 400 }}>
								Portal internal dengan tampilan ringkas, terstruktur, dan siap dipakai untuk operasional
								harian.
							</Typography>
						</Stack>
						<Stack spacing={1.5}>
							{CORPORATE_POINTS.map((item) => (
								<Stack key={item} direction="row" spacing={1.25} alignItems="flex-start">
									<CheckCircleOutlineRoundedIcon sx={{ mt: '2px', fontSize: 20, color: '#D8ECFF' }} />
									<Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.84)' }}>
										{item}
									</Typography>
								</Stack>
							))}
						</Stack>
					</Stack>

					<Box
						sx={{
							position: 'relative',
							zIndex: 1,
							mt: { xs: 4, md: 6 },
							p: 2.5,
							borderRadius: 3,
							border: '1px solid rgba(255,255,255,0.14)',
							backgroundColor: 'rgba(255,255,255,0.10)',
							backdropFilter: 'blur(10px)',
						}}
					>
						<Stack direction="row" spacing={1.5} alignItems="center">
							<Box
								sx={{
									width: 42,
									height: 42,
									borderRadius: 2.5,
									display: 'grid',
									placeItems: 'center',
									backgroundColor: 'rgba(255,255,255,0.14)',
								}}
							>
								<ShieldOutlinedIcon />
							</Box>
							<Box>
								<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
									Akses Aman
								</Typography>
								<Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.72)' }}>
									Login menggunakan NIK dan password dari data Master Admin.
								</Typography>
							</Box>
						</Stack>
					</Box>
				</Box>

				<Box
					sx={{
						p: { xs: 3, sm: 4.5, md: 5 },
						backgroundColor: SURFACE_BLUE,
					}}
				>
					<Stack spacing={3} justifyContent="center" sx={{ minHeight: '100%' }}>
						<Box>
							<Typography
								variant="overline"
								sx={{ color: ACCENT_BLUE_DARK, letterSpacing: '0.16em', fontWeight: 700 }}
							>
								Login
							</Typography>
							<Typography variant="h3" sx={{ color: ACCENT_BLUE_DEEP, mb: 1 }}>
								Masuk ke aplikasi
							</Typography>
							<Typography variant="body1" color="text.secondary" maxWidth={420}>
								Gunakan kredensial yang sudah terdaftar pada Master Admin untuk mengakses seluruh modul
								Hub Karyawan.
							</Typography>
						</Box>

						<Divider sx={{ borderColor: alpha(ACCENT_BLUE, 0.18) }} />

						<Box component="form" onSubmit={handleSubmit}>
							<Stack spacing={2.25}>
								<TextField
									label="NIK"
									name="nik"
									value={nik}
									onChange={(event) => setNik(event.target.value)}
									autoFocus
									fullWidth
									required
									autoComplete="username"
									InputProps={{
										startAdornment: (
											<InputAdornment position="start">
												<BadgeOutlinedIcon fontSize="small" />
											</InputAdornment>
										),
									}}
									sx={{
										'& .MuiOutlinedInput-root': {
											backgroundColor: '#FFFFFF',
											'& fieldset': {
												borderColor: alpha(ACCENT_BLUE_DEEP, 0.18),
											},
											'&:hover fieldset': {
												borderColor: alpha(ACCENT_BLUE, 0.42),
											},
											'&.Mui-focused fieldset': {
												borderColor: ACCENT_BLUE,
											},
										},
									}}
								/>
								<TextField
									label="Password"
									name="password"
									type={showPassword ? 'text' : 'password'}
									value={password}
									onChange={(event) => setPassword(event.target.value)}
									fullWidth
									required
									autoComplete="current-password"
									InputProps={{
										startAdornment: (
											<InputAdornment position="start">
												<LockOpenOutlinedIcon fontSize="small" />
											</InputAdornment>
										),
									}}
									sx={{
										'& .MuiOutlinedInput-root': {
											backgroundColor: '#FFFFFF',
											'& fieldset': {
												borderColor: alpha(ACCENT_BLUE_DEEP, 0.18),
											},
											'&:hover fieldset': {
												borderColor: alpha(ACCENT_BLUE, 0.42),
											},
											'&.Mui-focused fieldset': {
												borderColor: ACCENT_BLUE,
											},
										},
									}}
								/>
								<FormControlLabel
									control={
										<Checkbox
											checked={showPassword}
											onChange={(event) => setShowPassword(event.target.checked)}
											size="small"
										/>
									}
									label="Tampilkan password"
									sx={{
										alignSelf: 'flex-start',
										ml: 0,
										color: 'text.secondary',
										'& .MuiFormControlLabel-label': {
											fontSize: '0.95rem',
										},
									}}
								/>
								<Button
									type="submit"
									variant="contained"
									size="large"
									disabled={submitting}
									endIcon={
										submitting ? (
											<CircularProgress color="inherit" size={20} />
										) : (
											<LoginOutlinedIcon />
										)
									}
									sx={{
										mt: 1,
										minHeight: 54,
										borderRadius: 3,
										boxShadow: '0 16px 28px rgba(58, 147, 242, 0.22)',
										background: `linear-gradient(135deg, ${ACCENT_BLUE_DARK} 0%, ${ACCENT_BLUE} 100%)`,
										'&:hover': {
											background: `linear-gradient(135deg, rgb(22, 68, 116) 0%, rgb(45, 132, 224) 100%)`,
										},
									}}
								>
									{submitting ? 'Memproses...' : 'Masuk'}
								</Button>
							</Stack>
						</Box>
					</Stack>
				</Box>
			</Box>
		</Card>
	);
}

export default LoginPage;
