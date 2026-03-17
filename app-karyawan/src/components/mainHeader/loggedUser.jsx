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
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
// Icons
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import CommentOutlinedIcon from '@mui/icons-material/CommentOutlined';

// Components
import NotificationsButton from './notificationButton';
import { useAuth } from '@/contexts/authContext';

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
				elevation={26}
				sx={{
					'& .MuiMenuItem-root': {
						mt: 0.5,
					},
				}}
				anchorEl={anchorEl}
				anchorOrigin={{
					vertical: 'bottom',
					horizontal: 'right',
				}}
				transformOrigin={{
					vertical: 'top',
					horizontal: 'right',
				}}
				open={Boolean(anchorEl)}
				onClose={handleClose}
			>
				<UserMenu handleClose={handleClose} user={user} onLogout={handleLogout} />
			</Menu>
			<Stack height="100%" direction="row" flex={1} justifyContent="flex-end" alignItems="center" spacing={0}>
				<NotificationsButton />
				<IconButton size="small">
					<Badge color="tertiary" overlap="rectangular" variant="dot">
						<CommentOutlinedIcon color="primary" fontSize="small" />
					</Badge>
				</IconButton>
				<ButtonBase
					onClick={handleClick}
					variant="outlined"
					sx={{
						ml: 1,
						height: '100%',
						overflow: 'hidden',
						borderRadius: '25px',
						transition: '.2s',
						px: 1,
						transitionProperty: 'background,color',
						'&:hover': {
							bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
						},
						'&:hover .MuiSvgIcon-root': {
							opacity: '1',
							// transform: 'translateX(10px)',
						},
					}}
				>
					<Stack width="100%" direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
						<Avatar
							alt={user?.name || 'User'}
							sx={{
								width: 35,
								height: 35,
								boxShadow: (theme) =>
									`0px 0px 0px 4px ${theme.palette.background.paper} ,0px 0px 0px 5px ${theme.palette.primary.main} `,
							}}
						>
							{getInitials(user?.name)}
						</Avatar>
						<Typography
							variant="body2"
							display={{
								xs: 'none',
								sm: 'inline-block',
							}}
						>
							{user?.name || '-'}
						</Typography>
						<ExpandMoreIcon
							fontSize="small"
							sx={{
								transition: '0.2s',
								opacity: '0',
							}}
						/>
					</Stack>
				</ButtonBase>
			</Stack>
		</>
	);
}

function UserMenu({ handleClose, user, onLogout }) {
	return (
		<MenuList
			sx={{
				p: 1,
				'& .MuiMenuItem-root': {
					borderRadius: 2,
				},
			}}
		>
			<Stack px={3}>
				<Typography variant="subtitle1" textAlign="center">
					{user?.name || '-'}
				</Typography>
				<Typography variant="subtitle2" textAlign="center" color="text.secondary">
					{user?.role || '-'}
				</Typography>
				<Typography variant="caption" textAlign="center" color="text.secondary">
					NIK: {user?.nik || '-'}
				</Typography>
			</Stack>
			<Divider
				sx={{
					borderColor: 'primary.light',
					my: 1,
				}}
			/>
			<MenuItem onClick={handleClose}>
				<ListItemIcon>
					<NotificationsNoneOutlinedIcon fontSize="small" />
				</ListItemIcon>
				Role Login: {user?.role || '-'}
			</MenuItem>
			<Divider
				sx={{
					borderColor: 'primary.light',
					my: 1,
				}}
			/>
			<MenuItem onClick={onLogout}>
				<ListItemIcon>
					<ExitToAppIcon fontSize="small" />
				</ListItemIcon>
				Logout
			</MenuItem>
		</MenuList>
	);
}
export default LoggedUser;
