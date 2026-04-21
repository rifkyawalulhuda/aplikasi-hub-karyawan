import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import Badge from '@mui/material/Badge';
import { alpha } from '@mui/material/styles';

import Box from '@mui/material/Box';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import FeedOutlinedIcon from '@mui/icons-material/FeedOutlined';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import ReportGmailerrorredOutlinedIcon from '@mui/icons-material/ReportGmailerrorredOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

import EmployeeNotificationButton from '@/components/employeePortal/employeeNotificationButton';
import { useEmployeeAuth } from '@/contexts/employeeAuthContext';
import { employeeMeRequest } from '@/services/employeeApi';
import { useEmployeeTheme } from '@/contexts/employeeThemeContext';

import logo from '@/assets/images/logo/png/logo_sankyu.png';

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

	if (pathname.startsWith('/karyawan/pelatihan')) {
		return 'Riwayat Pelatihan';
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

	if (pathname.startsWith('/karyawan/pelatihan')) {
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
	const { user: employee } = useEmployeeAuth();
	const { isDarkMode, toggleColorMode } = useEmployeeTheme();
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);

	useEffect(() => {
		if (employee?.id) {
			employeeMeRequest('/notifications')
				.then((res) => {
					const count = res.items?.filter((item) => item.category === 'LEAVE_APPROVAL_PENDING').length || 0;
					setPendingApprovalsCount(count);
				})
				.catch(() => {});
		}
	}, [employee?.id, location.pathname]);

	return (
		<Box
			sx={{
				minHeight: '100vh',
				backgroundColor: (theme) => theme.palette.background.default,
				backgroundImage: (theme) => theme.palette.employeeSurface.pageBackground,
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
						border: (theme) => `1px solid ${theme.palette.employeeSurface.borderSoft}`,
						backgroundColor: (theme) => theme.palette.employeeSurface.glass,
						boxShadow: (theme) => theme.palette.employeeSurface.shadowSoft,
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
								<Typography variant="caption" sx={{ letterSpacing: '0.12em', color: 'text.secondary' }}>
									SANKYU
								</Typography>
								<Typography
									variant="subtitle1"
									sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}
								>
									{getPageTitle(location.pathname)}
								</Typography>
							</Box>
						</Stack>
						<Stack direction="row" spacing={0.5} alignItems="center">
							<Tooltip title={isDarkMode ? 'Tema Terang' : 'Tema Gelap'}>
								<IconButton
									aria-label={isDarkMode ? 'gunakan tema terang' : 'gunakan tema gelap'}
									onClick={toggleColorMode}
									sx={{
										bgcolor: (theme) =>
											isDarkMode
												? alpha(theme.palette.primary.main, 0.18)
												: alpha(theme.palette.primary.main, 0.08),
										color: isDarkMode ? 'primary.light' : 'primary.dark',
										border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
									}}
								>
									{isDarkMode ? <LightModeRoundedIcon /> : <DarkModeRoundedIcon />}
								</IconButton>
							</Tooltip>
							<EmployeeNotificationButton />
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
							transition: 'all 0.2s ease-in-out',
							'&:hover': {
								backgroundColor: (theme) =>
									alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.14 : 0.04),
							},
							'&.Mui-selected': {
								backgroundColor: (theme) =>
									alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.22 : 0.08),
								'& .MuiSvgIcon-root': {
									color: 'inherit',
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
							icon={
								item.value === '/karyawan/cuti' ? (
									<Badge
										color="error"
										variant="dot"
										invisible={pendingApprovalsCount === 0}
										sx={{
											'& .MuiBadge-badge': {
												right: 2,
												top: 2,
											},
										}}
									>
										{item.icon}
									</Badge>
								) : (
									item.icon
								)
							}
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
						backgroundColor: (theme) => theme.palette.employeeSurface.card,
					},
				}}
			>
				<Box sx={{ p: 2, pb: 4 }}>
					<Box
						sx={{
							width: 40,
							height: 4,
							bgcolor: (theme) =>
								alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.18 : 0.1),
							borderRadius: 2,
							mx: 'auto',
							mb: 2,
						}}
					/>
					<Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', mb: 1, px: 2 }}>
						Riwayat Karyawan
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
								<ListItemIcon sx={{ color: 'text.primary' }}>
									<FeedOutlinedIcon />
								</ListItemIcon>
								<ListItemText
									primary="Bimbingan & Pengarahan"
									primaryTypographyProps={{
										variant: 'body2',
										fontWeight: 600,
										color: 'text.primary',
									}}
									secondary="Riwayat konseling dan pengarahan"
									secondaryTypographyProps={{ variant: 'caption' }}
								/>
							</ListItemButton>
						</ListItem>
						<ListItem disablePadding>
							<ListItemButton
								onClick={() => {
									setDrawerOpen(false);
									navigate('/karyawan/pelatihan');
								}}
								sx={{ borderRadius: 2 }}
							>
								<ListItemIcon sx={{ color: 'success.main' }}>
									<SchoolOutlinedIcon />
								</ListItemIcon>
								<ListItemText
									primary="Pelatihan Karyawan"
									primaryTypographyProps={{
										variant: 'body2',
										fontWeight: 600,
										color: 'text.primary',
									}}
									secondary="Riwayat pelatihan yang diikuti"
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
								<ListItemIcon sx={{ color: 'error.main' }}>
									<ReportGmailerrorredOutlinedIcon />
								</ListItemIcon>
								<ListItemText
									primary="Surat Peringatan"
									primaryTypographyProps={{
										variant: 'body2',
										fontWeight: 600,
										color: 'text.primary',
									}}
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
