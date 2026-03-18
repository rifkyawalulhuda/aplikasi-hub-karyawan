import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined';
import LoginRoundedIcon from '@mui/icons-material/LoginRounded';

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

	const redirectTo = location.state?.from?.pathname || '/karyawan';

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

	return (
		<Card
			elevation={0}
			sx={{
				width: '100%',
				borderRadius: 6,
				border: '1px solid rgba(255,255,255,0.14)',
				backgroundColor: 'rgba(255,255,255,0.95)',
				backdropFilter: 'blur(14px)',
				overflow: 'hidden',
			}}
		>
			<Box
				sx={{
					p: 3,
					background: 'linear-gradient(145deg, #0E2C4D 0%, #174A7E 56%, #4C9AE8 100%)',
					color: '#FFFFFF',
				}}
			>
				<Stack spacing={2}>
					<Box component="img" src={logo} alt="Hub Karyawan" sx={{ width: 182, maxWidth: '100%' }} />
					<Box>
						<Typography variant="h4" sx={{ color: '#FFFFFF', fontWeight: 700 }}>
							Portal Karyawan
						</Typography>
						<Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.82)', mt: 1 }}>
							Akses data diri, bimbingan, dan surat peringatan langsung dari HP dalam tampilan yang
							ringkas.
						</Typography>
					</Box>
				</Stack>
			</Box>

			<Box component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
				<Stack spacing={2.5}>
					<Box>
						<Typography variant="overline" sx={{ color: '#1F5E9B', letterSpacing: '0.12em' }}>
							Login Karyawan
						</Typography>
						<Typography variant="h5" sx={{ color: '#123B66', fontWeight: 700 }}>
							Masuk dengan NIK
						</Typography>
						<Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
							Gunakan NIK dan password yang tersedia di Data Master Karyawan.
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
							background: 'linear-gradient(135deg, #123B66 0%, #3A93F2 100%)',
							boxShadow: '0 16px 28px rgba(58, 147, 242, 0.22)',
						}}
					>
						{submitting ? 'Memproses...' : 'Masuk'}
					</Button>
				</Stack>
			</Box>
		</Card>
	);
}

export default EmployeeLoginPage;
