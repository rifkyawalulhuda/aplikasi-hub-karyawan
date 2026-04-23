import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { alpha, useTheme } from '@mui/material/styles';

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

const CORPORATE_POINTS = [
	'Akses terpusat untuk pengelolaan data karyawan.',
	'Bimbingan & Pengarahan Karyawan.',
	'Dokumentasi internal yang mudah diakses.',
];

function getLoginPageColors(theme) {
	const isDarkMode = theme.palette.mode === 'dark';

	return {
		pageBackground: isDarkMode
			? 'radial-gradient(circle at top left, rgba(58, 147, 242, 0.18), transparent 28%), radial-gradient(circle at bottom right, rgba(255,255,255,0.05), transparent 20%), linear-gradient(160deg, #08111D 0%, #11233A 52%, #1B3353 100%)'
			: 'radial-gradient(circle at top left, rgba(58, 147, 242, 0.18), transparent 28%), radial-gradient(circle at bottom right, rgba(255,255,255,0.08), transparent 22%), linear-gradient(160deg, #18457A 0%, #2E73C0 52%, #3A93F2 100%)',
		cardBorder: isDarkMode ? alpha(theme.palette.common.white, 0.08) : alpha(ACCENT_BLUE, 0.18),
		splitBorder: isDarkMode ? alpha(theme.palette.common.white, 0.08) : alpha(ACCENT_BLUE, 0.18),
		leftPanelBg: isDarkMode
			? 'linear-gradient(180deg, #0E2239 0%, #102B48 58%, #123861 100%)'
			: `linear-gradient(180deg, ${ACCENT_BLUE_DEEP} 0%, ${ACCENT_BLUE_DARK} 58%, ${ACCENT_BLUE} 100%)`,
		leftPanelText: '#FFFFFF',
		rightPanelBg: theme.palette.background.paper,
		rightPanelText: theme.palette.text.primary,
		rightPanelMuted: theme.palette.text.secondary,
		fieldBg: theme.palette.background.default,
		fieldBorder: alpha(theme.palette.divider, 0.8),
		fieldBorderHover: alpha(theme.palette.primary.main, isDarkMode ? 0.48 : 0.42),
		fieldBorderFocus: theme.palette.primary.main,
		divider: alpha(theme.palette.divider, 0.8),
		buttonShadow: isDarkMode ? '0 16px 28px rgba(58, 147, 242, 0.16)' : '0 16px 28px rgba(58, 147, 242, 0.22)',
		buttonBackground: isDarkMode
			? `linear-gradient(135deg, ${ACCENT_BLUE_DARK} 0%, ${ACCENT_BLUE} 100%)`
			: `linear-gradient(135deg, ${ACCENT_BLUE_DARK} 0%, ${ACCENT_BLUE} 100%)`,
		buttonHoverBackground: isDarkMode
			? 'linear-gradient(135deg, rgb(20, 61, 104) 0%, rgb(44, 126, 215) 100%)'
			: 'linear-gradient(135deg, rgb(22, 68, 116) 0%, rgb(45, 132, 224) 100%)',
		cardShadow: isDarkMode ? '0 28px 64px rgba(0, 0, 0, 0.44)' : '0 28px 64px rgba(16, 51, 90, 0.24)',
		heroGlass: isDarkMode ? alpha(theme.palette.common.white, 0.06) : 'rgba(255,255,255,0.10)',
		heroGlassBorder: isDarkMode ? alpha(theme.palette.common.white, 0.12) : 'rgba(255,255,255,0.14)',
		heroMuted: isDarkMode ? 'rgba(255,255,255,0.78)' : 'rgba(255,255,255,0.84)',
		heroSoft: isDarkMode ? 'rgba(255,255,255,0.64)' : 'rgba(255,255,255,0.72)',
		heroCheck: isDarkMode ? '#CFE7FF' : '#D8ECFF',
	};
}

function LoginPage() {
	const navigate = useNavigate();
	const location = useLocation();
	const { enqueueSnackbar } = useSnackbar();
	const { login } = useAuth();
	const theme = useTheme();
	const [nik, setNik] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const colors = getLoginPageColors(theme);

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
				borderColor: colors.cardBorder,
				boxShadow: colors.cardShadow,
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
						color: colors.leftPanelText,
						background: colors.leftPanelBg,
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
								border: `1px solid ${colors.heroGlassBorder}`,
								backgroundColor: colors.heroGlass,
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
							<Typography
								variant="h2"
								sx={{ fontWeight: 700, lineHeight: 1.15, color: colors.leftPanelText }}
							>
								Hub Karyawan
							</Typography>
							<Typography variant="h6" sx={{ color: colors.heroMuted, fontWeight: 400 }}>
								Portal internal dengan tampilan ringkas, terstruktur, dan siap dipakai untuk operasional
								harian.
							</Typography>
						</Stack>
						<Stack spacing={1.5}>
							{CORPORATE_POINTS.map((item) => (
								<Stack key={item} direction="row" spacing={1.25} alignItems="flex-start">
									<CheckCircleOutlineRoundedIcon
										sx={{ mt: '2px', fontSize: 20, color: colors.heroCheck }}
									/>
									<Typography variant="body2" sx={{ color: colors.heroMuted }}>
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
							border: `1px solid ${colors.heroGlassBorder}`,
							backgroundColor: colors.heroGlass,
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
									backgroundColor: colors.heroGlass,
								}}
							>
								<ShieldOutlinedIcon />
							</Box>
							<Box>
								<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
									Akses Aman
								</Typography>
								<Typography variant="body2" sx={{ color: colors.heroSoft }}>
									Login menggunakan NIK dan password dari data Master Admin.
								</Typography>
							</Box>
						</Stack>
					</Box>
				</Box>

				<Box
					sx={{
						p: { xs: 3, sm: 4.5, md: 5 },
						backgroundColor: colors.rightPanelBg,
					}}
				>
					<Stack spacing={3} justifyContent="center" sx={{ minHeight: '100%' }}>
						<Box>
							<Typography
								variant="overline"
								sx={{ color: theme.palette.primary.main, letterSpacing: '0.16em', fontWeight: 700 }}
							>
								Login
							</Typography>
							<Typography variant="h3" sx={{ color: colors.rightPanelText, mb: 1 }}>
								Masuk ke aplikasi
							</Typography>
							<Typography variant="body1" color="text.secondary" maxWidth={420}>
								Gunakan kredensial yang sudah terdaftar pada Master Admin untuk mengakses seluruh modul
								Hub Karyawan.
							</Typography>
						</Box>

						<Divider sx={{ borderColor: colors.divider }} />

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
											backgroundColor: colors.fieldBg,
											'& fieldset': {
												borderColor: colors.fieldBorder,
											},
											'&:hover fieldset': {
												borderColor: colors.fieldBorderHover,
											},
											'&.Mui-focused fieldset': {
												borderColor: colors.fieldBorderFocus,
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
											backgroundColor: colors.fieldBg,
											'& fieldset': {
												borderColor: colors.fieldBorder,
											},
											'&:hover fieldset': {
												borderColor: colors.fieldBorderHover,
											},
											'&.Mui-focused fieldset': {
												borderColor: colors.fieldBorderFocus,
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
										boxShadow: colors.buttonShadow,
										background: colors.buttonBackground,
										'&:hover': {
											background: colors.buttonHoverBackground,
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
