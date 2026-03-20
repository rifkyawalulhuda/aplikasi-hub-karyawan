import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import FeedOutlinedIcon from '@mui/icons-material/FeedOutlined';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import ReportGmailerrorredOutlinedIcon from '@mui/icons-material/ReportGmailerrorredOutlined';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

import EmployeeNotificationButton from '@/components/employeePortal/employeeNotificationButton';
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
		label: 'Cuti',
		value: '/karyawan/cuti',
		icon: <CalendarMonthOutlinedIcon />,
	},
	{
		label: 'Catatan',
		value: 'group-catatan',
		icon: <FeedOutlinedIcon />,
	},
];

function getPageTitle(pathname) {
	if (pathname.startsWith('/karyawan/profil')) {
		return 'Profil Karyawan';
	}

	if (pathname.startsWith('/karyawan/cuti/approval/')) {
		return 'Approval Cuti';
	}

	if (pathname.startsWith('/karyawan/cuti/')) {
		return 'Detail Cuti';
	}

	if (pathname.startsWith('/karyawan/cuti')) {
		return 'Cuti Karyawan';
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
	if (pathname.startsWith('/karyawan/bimbingan-pengarahan') || pathname.startsWith('/karyawan/surat-peringatan')) {
		return 'group-catatan';
	}

	const specificMatch = NAV_ITEMS.find(
		(item) => item.value !== '/karyawan' && (pathname === item.value || pathname.startsWith(`${item.value}/`)),
	);

	if (specificMatch) {
		return specificMatch.value;
	}

	return '/karyawan';
}

function EmployeeMobileLayout() {
	const location = useLocation();
	const navigate = useNavigate();
	const { logout } = useEmployeeAuth();
	const [drawerOpen, setDrawerOpen] = useState(false);

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
						<Stack direction="row" spacing={0.5} alignItems="center">
							<EmployeeNotificationButton />
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
					onChange={(...args) => {
						const newValue = args[1];
						if (newValue === 'group-catatan') {
							setDrawerOpen(true);
						} else {
							navigate(newValue);
						}
					}}
					sx={{
						height: 72,
						px: 1,
						'& .MuiBottomNavigationAction-root': {
							minWidth: 0,
							borderRadius: 3,
							my: 0.75,
							mx: 0.5,
							color: '#5D738B',
							transition: 'all 0.2s ease-in-out',
							'&:hover': {
								backgroundColor: 'rgba(25, 118, 210, 0.04)',
							},
							'&.Mui-selected': {
								backgroundColor: 'rgba(25, 118, 210, 0.08)',
								color: '#1976d2',
								'& .MuiSvgIcon-root': {
									color: '#1976d2',
								},
							},
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

			<Drawer
				anchor="bottom"
				open={drawerOpen}
				onClose={() => setDrawerOpen(false)}
				PaperProps={{
					sx: {
						borderTopLeftRadius: 20,
						borderTopRightRadius: 20,
						width: '100%',
						maxWidth: 480,
						mx: 'auto',
					},
				}}
			>
				<Box sx={{ p: 2, pb: 4 }}>
					<Box
						sx={{
							width: 40,
							height: 4,
							bgcolor: 'rgba(0,0,0,0.1)',
							borderRadius: 2,
							mx: 'auto',
							mb: 2,
						}}
					/>
					<Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#123B66', mb: 1, px: 2 }}>
						Catatan Karyawan
					</Typography>
					<List>
						<ListItem disablePadding>
							<ListItemButton
								onClick={() => {
									setDrawerOpen(false);
									navigate('/karyawan/bimbingan-pengarahan');
								}}
								sx={{ borderRadius: 2 }}
							>
								<ListItemIcon sx={{ color: '#123B66' }}>
									<FeedOutlinedIcon />
								</ListItemIcon>
								<ListItemText
									primary="Bimbingan & Pengarahan"
									primaryTypographyProps={{ variant: 'body2', fontWeight: 600, color: '#123B66' }}
									secondary="Riwayat konseling dan pengarahan"
									secondaryTypographyProps={{ variant: 'caption' }}
								/>
							</ListItemButton>
						</ListItem>
						<ListItem disablePadding>
							<ListItemButton
								onClick={() => {
									setDrawerOpen(false);
									navigate('/karyawan/surat-peringatan');
								}}
								sx={{ borderRadius: 2 }}
							>
								<ListItemIcon sx={{ color: '#D32F2F' }}>
									<ReportGmailerrorredOutlinedIcon />
								</ListItemIcon>
								<ListItemText
									primary="Surat Peringatan"
									primaryTypographyProps={{ variant: 'body2', fontWeight: 600, color: '#123B66' }}
									secondary="Riwayat peringatan dan teguran disipliner"
									secondaryTypographyProps={{ variant: 'caption' }}
								/>
							</ListItemButton>
						</ListItem>
					</List>
				</Box>
			</Drawer>
		</Box>
	);
}

export default EmployeeMobileLayout;
