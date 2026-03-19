import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Alert from '@mui/material/Alert';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import { useAuth } from '@/contexts/authContext';
import apiRequest from '@/services/api';

function getSeverityIcon(severity) {
	switch (severity) {
		case 'error':
			return <ErrorOutlineOutlinedIcon fontSize="small" color="error" />;
		case 'warning':
			return <WarningAmberOutlinedIcon fontSize="small" color="warning" />;
		default:
			return <InfoOutlinedIcon fontSize="small" color="info" />;
	}
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
				const response = await apiRequest(`/notifications?employeeId=${user.employeeId}`, {
					headers: {
						'X-Admin-Employee-Id': String(user.employeeId),
					},
				});
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
		[user?.employeeId],
	);

	useEffect(() => {
		loadNotifications();
	}, [loadNotifications]);

	useEffect(() => {
		if (open) {
			loadNotifications({ silent: true });
		}
	}, [open, loadNotifications]);

	const handleOpen = (event) => {
		setAnchorEl(event.currentTarget);
	};

	const handleClose = () => {
		setAnchorEl(null);
	};

	const markNotificationAsRead = useCallback(
		async (notificationId) => {
			if (!user?.employeeId || !notificationId) {
				return;
			}

			await apiRequest('/notifications/read', {
				method: 'POST',
				body: JSON.stringify({
					employeeId: user.employeeId,
					notificationId,
				}),
				headers: {
					'X-Admin-Employee-Id': String(user.employeeId),
				},
			});
		},
		[user?.employeeId],
	);

	const markAllAsRead = useCallback(async () => {
		if (!user?.employeeId) {
			return;
		}

		const unreadNotificationIds = items.filter((item) => !item.isRead).map((item) => item.id);

		if (!unreadNotificationIds.length) {
			return;
		}

		await apiRequest('/notifications/read-all', {
			method: 'POST',
			body: JSON.stringify({
				employeeId: user.employeeId,
				notificationIds: unreadNotificationIds,
			}),
			headers: {
				'X-Admin-Employee-Id': String(user.employeeId),
			},
		});

		setItems((currentItems) =>
			currentItems.map((item) =>
				unreadNotificationIds.includes(item.id)
					? {
							...item,
							isRead: true,
							readAt: new Date().toISOString(),
					  }
					: item,
			),
		);
		setUnreadCount(0);
	}, [items, user?.employeeId]);

	const handleNavigate = async (item) => {
		if (!item.isRead) {
			try {
				await markNotificationAsRead(item.id);
				setItems((currentItems) =>
					currentItems.map((currentItem) =>
						currentItem.id === item.id
							? {
									...currentItem,
									isRead: true,
									readAt: new Date().toISOString(),
							  }
							: currentItem,
					),
				);
				setUnreadCount((currentCount) => Math.max(0, currentCount - 1));
			} catch (error) {
				setErrorMessage(error.message || 'Status baca notifikasi gagal diperbarui.');
			}
		}

		handleClose();
		navigate(item.href || item.targetPath || '/');
	};

	let content = (
		<List
			disablePadding
			sx={{
				maxHeight: 440,
				overflowY: 'auto',
			}}
		>
			{items.map((item, index) => (
				<Box key={item.id}>
					<ListItemButton
						alignItems="flex-start"
						onClick={() => handleNavigate(item)}
						sx={{
							bgcolor: item.isRead ? 'transparent' : 'rgba(25, 118, 210, 0.06)',
						}}
					>
						<Stack direction="row" spacing={1.25} sx={{ width: '100%' }}>
							<Box sx={{ pt: 0.4 }}>{getSeverityIcon(item.severity)}</Box>
							<ListItemText
								primary={
									<Stack spacing={0.35}>
										<Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
											<Typography
												variant="body2"
												sx={{
													fontWeight: item.isRead ? 600 : 700,
													color: '#123B66',
												}}
											>
												{item.title}
											</Typography>
											<Typography
												variant="caption"
												sx={{
													color: item.isRead ? 'text.secondary' : 'primary.main',
													fontWeight: item.isRead ? 400 : 700,
												}}
											>
												{item.isRead ? 'Sudah dibaca' : 'Belum dibaca'}
											</Typography>
										</Stack>
										<Typography variant="caption" color="text.secondary">
											{item.dateLabel}
										</Typography>
									</Stack>
								}
								secondary={
									<Typography
										variant="body2"
										color="text.secondary"
										sx={{ mt: 0.5, lineHeight: 1.45 }}
									>
										{item.description}
									</Typography>
								}
							/>
						</Stack>
					</ListItemButton>
					{index < items.length - 1 ? <Divider component="li" /> : null}
				</Box>
			))}
		</List>
	);

	if (loading) {
		content = (
			<Stack alignItems="center" justifyContent="center" sx={{ py: 5, px: 2 }}>
				<CircularProgress size={24} />
			</Stack>
		);
	} else if (errorMessage) {
		content = (
			<Stack sx={{ p: 2 }}>
				<Alert severity="error">{errorMessage}</Alert>
			</Stack>
		);
	} else if (items.length === 0) {
		content = (
			<Stack spacing={0.75} alignItems="center" justifyContent="center" sx={{ py: 6, px: 3 }}>
				<NotificationsOutlinedIcon color="disabled" />
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
							width: 420,
							maxWidth: 'calc(100vw - 24px)',
							borderRadius: 3,
							overflow: 'hidden',
						},
					},
				}}
			>
				<Stack spacing={0}>
					<Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 1.5 }}>
						<Box>
							<Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#123B66' }}>
								Notifikasi
							</Typography>
							<Typography variant="caption" color="text.secondary">
								{unreadCount} belum dibaca dari {totalCount} alert aktif
							</Typography>
						</Box>
						<Stack direction="row" spacing={1}>
							<Button size="small" onClick={markAllAsRead} disabled={!unreadCount}>
								Tandai semua
							</Button>
							<Button
								size="small"
								startIcon={<RefreshOutlinedIcon fontSize="small" />}
								onClick={() => loadNotifications()}
							>
								Refresh
							</Button>
						</Stack>
					</Stack>
					<Divider />
					{content}
				</Stack>
			</Menu>
		</>
	);
}

export default NotificationsButton;
