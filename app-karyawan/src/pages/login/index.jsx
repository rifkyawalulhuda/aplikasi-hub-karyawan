import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined';

import { useAuth } from '@/contexts/authContext';
import apiRequest from '@/services/api';
import logo from '@/assets/images/logo/png/Color_logotext2_nobg.png';

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
			elevation={18}
			sx={{
				width: '100%',
				maxWidth: 460,
				mx: 2,
				borderRadius: 4,
				p: { xs: 3, sm: 4 },
			}}
		>
			<Stack spacing={3}>
				<Stack spacing={1} alignItems="flex-start">
					<Box component="img" src={logo} alt="Sankyu Hub Karyawan" sx={{ width: 190, maxWidth: '100%' }} />
					<Typography variant="h3">Login Hub Karyawan</Typography>
					<Typography variant="body2" color="text.secondary">
						Masuk menggunakan data Master Admin. NIK diambil dari field Master Admin dan password mengikuti
						password yang tersimpan pada data tersebut.
					</Typography>
				</Stack>

				<Box component="form" onSubmit={handleSubmit}>
					<Stack spacing={2}>
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
							sx={{ alignSelf: 'flex-start', ml: 0 }}
						/>
						<Button
							type="submit"
							variant="contained"
							size="large"
							disabled={submitting}
							endIcon={
								submitting ? <CircularProgress color="inherit" size={20} /> : <LoginOutlinedIcon />
							}
							sx={{ mt: 1 }}
						>
							{submitting ? 'Memproses...' : 'Masuk'}
						</Button>
					</Stack>
				</Box>
			</Stack>
		</Card>
	);
}

export default LoginPage;
