import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { alpha } from '@mui/material/styles';

import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import DoneAllRoundedIcon from '@mui/icons-material/DoneAllRounded';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import WestRoundedIcon from '@mui/icons-material/WestRounded';

import { useAuth } from '@/contexts/authContext';
import {
	fetchAdminNotifications,
	markAdminNotificationAsRead,
	markAllAdminNotificationsAsRead,
} from '@/services/adminNotifications';
import {
	getAdminNotificationCategoryLabel,
	getAdminNotificationStatusLabel,
	getAdminNotificationVisual,
} from '@/utils/adminNotifications';

const PANEL_LIMIT = 10;

function NotificationMenuItem({ item, onOpen }) {
	const visual = getAdminNotificationVisual(item);

	return (
		<Box
			onClick={() => onOpen(item)}
			sx={{
				px: 1.5,
				py: 1.25,
				cursor: 'pointer',
				borderRadius: 3,
				backgroundColor: item.isRead ? 'transparent' : alpha('#F5F9FF', 0.92),
				transition: 'background-color 0.2s ease',
				'&:hover': {
					backgroundColor: alpha('#F1F6FC', 0.98),
				},
			}}
		>
			<Stack direction="row" spacing={1.1} alignItems="flex-start">
				<Avatar
					variant="rounded"
					sx={{
						width: 30,
						height: 30,
						bgcolor: visual.tint,
						color: visual.color,
						borderRadius: 2.5,
						flexShrink: 0,
					}}
				>
					{visual.icon}
				</Avatar>
				<Stack spacing={0.45} sx={{ minWidth: 0, flex: 1 }}>
					<Stack direction="row" spacing={0.75} alignItems="center" justifyContent="space-between">
						<Typography
							variant="body2"
							sx={{
								color: '#123B66',
								fontWeight: item.isRead ? 700 : 800,
								lineHeight: 1.3,
								minWidth: 0,
								flex: 1,
								display: '-webkit-box',
								overflow: 'hidden',
								WebkitBoxOrient: 'vertical',
								WebkitLineClamp: 1,
							}}
						>
							{item.title}
						</Typography>
						<Box
							sx={{
								width: 7,
								height: 7,
								borderRadius: '50%',
								bgcolor: item.isRead ? 'rgba(18,59,102,0.16)' : '#2F74BC',
								flexShrink: 0,
							}}
						/>
					</Stack>
					<Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
						<Typography variant="caption" sx={{ color: visual.color, fontWeight: 700 }}>
							{getAdminNotificationCategoryLabel(item.category)}
						</Typography>
						<Typography variant="caption" sx={{ color: '#8CA0B4' }}>
							{item.dateLabel}
						</Typography>
					</Stack>
					<Typography
						variant="caption"
						sx={{
							color: '#667D95',
							lineHeight: 1.45,
							display: '-webkit-box',
							overflow: 'hidden',
							WebkitBoxOrient: 'vertical',
							WebkitLineClamp: 2,
						}}
					>
						{item.description}
					</Typography>
					<Typography variant="caption" sx={{ color: '#96A7BA' }}>
						{getAdminNotificationStatusLabel(item.isRead)}
					</Typography>
				</Stack>
			</Stack>
		</Box>
	);
}

function NotificationsButton() {
	const navigate = useNavigate();
	const { user } = useAuth();
	const [anchorEl, setAnchorEl] = useState(null);
	const [items, setItems] = useState([]);
	const [totalCount, setTotalCount] = useState(0);
	const [unreadCount, setUnreadCount] = useState(0);
	const [loading, setLoading] = useState(true);
	const [errorMessage, setErrorMessage] = useState('');

	const open = Boolean(anchorEl);
	const badgeCount = useMemo(() => Math.min(unreadCount, 99), [unreadCount]);

	const loadNotifications = useCallback(
		async ({ silent = false } = {}) => {
			if (!user?.employeeId) {
				setItems([]);
				setTotalCount(0);
				setUnreadCount(0);
				setErrorMessage('');
				setLoading(false);
				return;
			}

			if (!silent) {
				setLoading(true);
			}

			try {
				const response = await fetchAdminNotifications(user, { limit: PANEL_LIMIT });
				setItems(response.items || []);
				setTotalCount(Number(response.totalCount || 0));
				setUnreadCount(Number(response.unreadCount || 0));
				setErrorMessage('');
			} catch (error) {
				setItems([]);
				setTotalCount(0);
				setUnreadCount(0);
				setErrorMessage(error.message || 'Notifikasi tidak dapat dimuat.');
			} finally {
				if (!silent) {
					setLoading(false);
				}
			}
		},
		[user],
	);

	useEffect(() => {
		loadNotifications();
	}, [loadNotifications]);

	useEffect(() => {
		if (open) {
			loadNotifications({ silent: true });
		}
	}, [loadNotifications, open]);

	const patchItemAsRead = useCallback((notificationId) => {
		setItems((currentItems) =>
			currentItems.map((item) =>
				item.id === notificationId
					? {
							...item,
							isRead: true,
							readAt: new Date().toISOString(),
					  }
					: item,
			),
		);
		setUnreadCount((currentCount) => Math.max(0, currentCount - 1));
	}, []);

	const handleOpen = (event) => {
		setAnchorEl(event.currentTarget);
	};

	const handleClose = () => {
		setAnchorEl(null);
	};

	const handleOpenHistory = () => {
		handleClose();
		navigate('/notifikasi');
	};

	const handleNotificationOpen = useCallback(
		async (item) => {
			if (!item.isRead) {
				try {
					await markAdminNotificationAsRead(user, item.id);
					patchItemAsRead(item.id);
				} catch (error) {
					setErrorMessage(error.message || 'Status baca notifikasi gagal diperbarui.');
				}
			}

			handleClose();
			navigate(item.href || item.targetPath || '/');
		},
		[navigate, patchItemAsRead, user],
	);

	const handleMarkAll = useCallback(async () => {
		if (!user?.employeeId || !unreadCount) {
			return;
		}

		try {
			await markAllAdminNotificationsAsRead(user);
			setItems((currentItems) =>
				currentItems.map((item) => ({
					...item,
					isRead: true,
					readAt: item.readAt || new Date().toISOString(),
				})),
			);
			setUnreadCount(0);
		} catch (error) {
			setErrorMessage(error.message || 'Status baca notifikasi gagal diperbarui.');
		}
	}, [unreadCount, user]);

	let content = (
		<Stack spacing={0.5} sx={{ px: 1, py: 1, maxHeight: 392, overflowY: 'auto' }}>
			{items.map((item) => (
				<NotificationMenuItem key={item.id} item={item} onOpen={handleNotificationOpen} />
			))}
		</Stack>
	);

	if (loading) {
		content = (
			<Stack alignItems="center" justifyContent="center" sx={{ py: 5.5, px: 2 }}>
				<CircularProgress size={22} />
			</Stack>
		);
	} else if (errorMessage) {
		content = (
			<Stack sx={{ p: 1.5 }}>
				<Alert severity="error" sx={{ borderRadius: 2.5 }}>
					{errorMessage}
				</Alert>
			</Stack>
		);
	} else if (items.length === 0) {
		content = (
			<Stack spacing={0.85} alignItems="center" justifyContent="center" sx={{ py: 6, px: 3 }}>
				<NotificationsOutlinedIcon sx={{ color: '#A9B8C9', fontSize: 22 }} />
				<Typography variant="body2" color="text.secondary" textAlign="center">
					Belum ada notifikasi aktif.
				</Typography>
			</Stack>
		);
	}

	return (
		<>
			<Tooltip title="Notifikasi">
				<IconButton size="small" onClick={handleOpen}>
					<Badge
						color="error"
						overlap="rectangular"
						badgeContent={badgeCount > 0 ? badgeCount : null}
						max={99}
					>
						<NotificationsOutlinedIcon color="primary" fontSize="small" />
					</Badge>
				</IconButton>
			</Tooltip>
			<Menu
				anchorEl={anchorEl}
				open={open}
				onClose={handleClose}
				anchorOrigin={{
					vertical: 'bottom',
					horizontal: 'right',
				}}
				transformOrigin={{
					vertical: 'top',
					horizontal: 'right',
				}}
				slotProps={{
					paper: {
						sx: {
							width: 360,
							maxWidth: 'calc(100vw - 24px)',
							mt: 1,
							borderRadius: 3.5,
							overflow: 'hidden',
							border: '1px solid rgba(18,59,102,0.08)',
							boxShadow: '0 18px 38px rgba(18, 59, 102, 0.12)',
						},
					},
				}}
			>
				<Stack spacing={0}>
					<Stack sx={{ px: 1.75, py: 1.5 }}>
						<Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1.5}>
							<Box>
								<Typography
									variant="subtitle1"
									sx={{ fontWeight: 800, color: '#123B66', lineHeight: 1.2 }}
								>
									Notifikasi
								</Typography>
								<Typography variant="caption" sx={{ color: '#7B8FA5' }}>
									{unreadCount} belum dibaca dari {totalCount} alert aktif
								</Typography>
							</Box>
							<Stack direction="row" spacing={0.5}>
								<Tooltip title="Tandai semua dibaca">
									<span>
										<IconButton size="small" onClick={handleMarkAll} disabled={!unreadCount}>
											<DoneAllRoundedIcon fontSize="small" />
										</IconButton>
									</span>
								</Tooltip>
								<Tooltip title="Refresh">
									<IconButton size="small" onClick={() => loadNotifications()}>
										<RefreshOutlinedIcon fontSize="small" />
									</IconButton>
								</Tooltip>
							</Stack>
						</Stack>
					</Stack>

					<Divider />
					{content}
					<Divider />

					<Box sx={{ p: 1 }}>
						<Button
							fullWidth
							variant="text"
							endIcon={<WestRoundedIcon sx={{ transform: 'rotate(180deg)' }} fontSize="small" />}
							onClick={handleOpenHistory}
							sx={{
								justifyContent: 'space-between',
								px: 1.25,
								py: 0.9,
								borderRadius: 2.5,
								color: '#123B66',
								fontWeight: 700,
							}}
						>
							Lihat semua notifikasi
						</Button>
					</Box>
				</Stack>
			</Menu>
		</>
	);
}

export default NotificationsButton;
