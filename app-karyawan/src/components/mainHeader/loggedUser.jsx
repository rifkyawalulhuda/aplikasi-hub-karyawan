import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { alpha } from '@mui/material/styles';
// MUI
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import ButtonBase from '@mui/material/ButtonBase';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import MenuList from '@mui/material/MenuList';
import ListItemIcon from '@mui/material/ListItemIcon';
import Divider from '@mui/material/Divider';
import Switch from '@mui/material/Switch';
// Icons
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';

import { useAuth } from '@/contexts/authContext';
import { useDispatch, useSelector } from '@/store';
import { setConfigKey } from '@/store/theme';
import { selectThemeMode } from '@/store/theme/selectors';

function getInitials(name = '') {
	return name
		.split(' ')
		.filter(Boolean)
		.slice(0, 2)
		.map((item) => item[0]?.toUpperCase())
		.join('');
}

function LoggedUser() {
	const navigate = useNavigate();
	const { user, logout } = useAuth();
	const [anchorEl, setAnchorEl] = useState(null);

	const handleClick = (event) => {
		setAnchorEl(event.currentTarget);
	};

	const handleClose = () => {
		setAnchorEl(null);
	};

	const handleLogout = () => {
		handleClose();
		logout();
		navigate('/login', { replace: true });
	};

	return (
		<>
			<Menu
				elevation={8}
				anchorEl={anchorEl}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
				transformOrigin={{ vertical: 'top', horizontal: 'right' }}
				open={Boolean(anchorEl)}
				onClose={handleClose}
				PaperProps={{ sx: { mt: 1, borderRadius: 2.5, minWidth: 240, border: 1, borderColor: 'border' } }}
			>
				<UserMenu handleClose={handleClose} user={user} onLogout={handleLogout} />
			</Menu>
			<ButtonBase
				onClick={handleClick}
				aria-haspopup="true"
				aria-expanded={Boolean(anchorEl)}
				aria-label={`Menu pengguna ${user?.name || ''}`.trim()}
				sx={{
					ml: 0.5,
					p: 0.5,
					borderRadius: '50%',
					'&:hover': { bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08) },
					'&:focus-visible': {
						outline: (theme) => `2px solid ${theme.palette.primary.main}`,
						outlineOffset: 2,
					},
				}}
			>
				<Avatar
					alt={user?.name || 'User'}
					sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: '0.78rem', fontWeight: 600 }}
				>
					{getInitials(user?.name)}
				</Avatar>
			</ButtonBase>
		</>
	);
}

function UserMenu({ handleClose, user, onLogout }) {
	const dispatch = useDispatch();
	const mode = useSelector(selectThemeMode);
	const isDarkMode = mode === 'dark';

	const handleToggleTheme = () => {
		dispatch(setConfigKey({ key: 'mode', value: isDarkMode ? 'light' : 'dark' }));
	};

	return (
		<MenuList sx={{ p: 1, '& .MuiMenuItem-root': { borderRadius: 2 } }}>
			<Stack px={1.5} pb={0.5}>
				<Typography variant="subtitle1" fontWeight={600} noWrap>
					{user?.name || '-'}
				</Typography>
				<Typography variant="subtitle2" color="text.secondary" noWrap>
					{user?.role || '-'}
				</Typography>
				<Typography variant="caption" color="text.secondary" noWrap>
					NIK: {user?.nik || '-'}
				</Typography>
			</Stack>
			<Divider sx={{ my: 0.75 }} />
			<MenuItem onClick={handleToggleTheme} sx={{ gap: 1 }}>
				<ListItemIcon sx={{ minWidth: 28 }}>
					{isDarkMode ? (
						<LightModeOutlinedIcon fontSize="small" />
					) : (
						<DarkModeOutlinedIcon fontSize="small" />
					)}
				</ListItemIcon>
				<Typography variant="body2" sx={{ flex: 1 }}>
					Mode gelap
				</Typography>
				<Switch
					size="small"
					checked={isDarkMode}
					tabIndex={-1}
					inputProps={{ 'aria-label': 'Aktifkan mode gelap', tabIndex: -1 }}
					sx={{ pointerEvents: 'none' }}
				/>
			</MenuItem>
			<MenuItem
				component="a"
				href="https://rifkyawalulhuda.github.io/aplikasi-hub-karyawan/"
				target="_blank"
				rel="noopener noreferrer"
				onClick={handleClose}
				sx={{ gap: 1 }}
			>
				<ListItemIcon sx={{ minWidth: 28 }}>
					<MenuBookOutlinedIcon fontSize="small" />
				</ListItemIcon>
				<Typography variant="body2">Dokumentasi</Typography>
			</MenuItem>
			<Divider sx={{ my: 0.75 }} />
			<MenuItem onClick={onLogout} sx={{ gap: 1, color: 'error.main' }}>
				<ListItemIcon sx={{ minWidth: 28 }}>
					<ExitToAppIcon fontSize="small" />
				</ListItemIcon>
				<Typography variant="body2" color="inherit">
					Logout
				</Typography>
			</MenuItem>
		</MenuList>
	);
}

export default LoggedUser;
