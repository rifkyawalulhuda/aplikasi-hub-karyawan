import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import FeedOutlinedIcon from '@mui/icons-material/FeedOutlined';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import ReportGmailerrorredOutlinedIcon from '@mui/icons-material/ReportGmailerrorredOutlined';

import { useEmployeeAuth } from '@/contexts/employeeAuthContext';

import logo from '@/assets/images/logo/png/Sankyu_logo_redicon_whitetext.png';

const NAV_ITEMS = [
	{
		label: 'Beranda',
		value: '/karyawan',
		icon: <HomeRoundedIcon />,
	},
	{
		label: 'Profil',
		value: '/karyawan/profil',
		icon: <BadgeOutlinedIcon />,
	},
	{
		label: 'Bimbingan',
		value: '/karyawan/bimbingan-pengarahan',
		icon: <FeedOutlinedIcon />,
	},
	{
		label: 'Peringatan',
		value: '/karyawan/surat-peringatan',
		icon: <ReportGmailerrorredOutlinedIcon />,
	},
];

function getPageTitle(pathname) {
	if (pathname.startsWith('/karyawan/profil')) {
		return 'Profil Karyawan';
	}

	if (pathname.startsWith('/karyawan/bimbingan-pengarahan')) {
		return 'Bimbingan & Pengarahan';
	}

	if (pathname.startsWith('/karyawan/surat-peringatan')) {
		return 'Surat Peringatan';
	}

	return 'Portal Karyawan';
}

function getCurrentValue(pathname) {
	const matchedItem = NAV_ITEMS.find((item) => pathname === item.value || pathname.startsWith(`${item.value}/`));
	return matchedItem?.value || '/karyawan';
}

function EmployeeMobileLayout() {
	const location = useLocation();
	const navigate = useNavigate();
	const { logout } = useEmployeeAuth();

	return (
		<Box
			sx={{
				minHeight: '100vh',
				backgroundColor: '#EEF4FA',
				backgroundImage:
					'radial-gradient(circle at top center, rgba(76, 154, 232, 0.24), transparent 22%), linear-gradient(180deg, #F7FBFF 0%, #EEF4FA 48%, #E5EEF8 100%)',
			}}
		>
			<Box
				sx={{
					maxWidth: 480,
					minHeight: '100vh',
					mx: 'auto',
					px: 2,
					pt: 2,
					pb: 'calc(92px + env(safe-area-inset-bottom))',
				}}
			>
				<Paper
					elevation={0}
					sx={{
						position: 'sticky',
						top: 12,
						zIndex: 10,
						p: 1.5,
						borderRadius: 4,
						border: '1px solid rgba(18,59,102,0.08)',
						backgroundColor: 'rgba(255,255,255,0.88)',
						backdropFilter: 'blur(16px)',
					}}
				>
					<Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.5}>
						<Stack direction="row" spacing={1.5} alignItems="center">
							<Box
								component="img"
								src={logo}
								alt="Hub Karyawan"
								sx={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 3 }}
							/>
							<Box>
								<Typography variant="caption" sx={{ letterSpacing: '0.12em', color: '#4C6B88' }}>
									SANKYU
								</Typography>
								<Typography
									variant="subtitle1"
									sx={{ fontWeight: 700, color: '#123B66', lineHeight: 1.2 }}
								>
									{getPageTitle(location.pathname)}
								</Typography>
							</Box>
						</Stack>
						<IconButton
							aria-label="logout"
							onClick={() => {
								logout();
								navigate('/karyawan/login', { replace: true });
							}}
							sx={{
								bgcolor: 'rgba(18,59,102,0.06)',
								color: '#123B66',
							}}
						>
							<LogoutRoundedIcon />
						</IconButton>
					</Stack>
				</Paper>

				<Box component="main" sx={{ mt: 2 }}>
					<Outlet />
				</Box>
			</Box>

			<Paper
				elevation={10}
				sx={{
					position: 'fixed',
					left: '50%',
					bottom: 'max(10px, env(safe-area-inset-bottom))',
					transform: 'translateX(-50%)',
					width: { xs: 'calc(100% - 16px)', sm: 472 },
					maxWidth: 472,
					borderRadius: 5,
					overflow: 'hidden',
				}}
			>
				<BottomNavigation
					showLabels
					value={getCurrentValue(location.pathname)}
					onChange={(...args) => navigate(args[1])}
					sx={{
						height: 72,
						'& .MuiBottomNavigationAction-root': {
							minWidth: 0,
						},
					}}
				>
					{NAV_ITEMS.map((item) => (
						<BottomNavigationAction
							key={item.value}
							label={item.label}
							value={item.value}
							icon={item.icon}
						/>
					))}
				</BottomNavigation>
			</Paper>
		</Box>
	);
}

export default EmployeeMobileLayout;
