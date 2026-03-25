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
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';

import { useEmployeeAuth } from '@/contexts/employeeAuthContext';
import {
	enableEmployeePushSubscription,
	getEmployeePushStatus,
	sendEmployeePushTestNotification,
	syncEmployeePushSubscription,
} from '@/services/employeePush';
import { employeeMeRequest } from '@/services/employeeApi';

function getSeverityIcon(severity) {
	switch (severity) {
		case 'error':
			return <ErrorOutlineOutlinedIcon fontSize="small" color="error" />;
		case 'warning':
			return <WarningAmberOutlinedIcon fontSize="small" color="warning" />;
		case 'success':
			return <CheckCircleOutlineOutlinedIcon fontSize="small" color="success" />;
		default:
			return <InfoOutlinedIcon fontSize="small" color="info" />;
	}
}

function EmployeeNotificationButton() {
	const navigate = useNavigate();
	const { user: employee } = useEmployeeAuth();
	const [anchorEl, setAnchorEl] = useState(null);
	const [items, setItems] = useState([]);
	const [totalCount, setTotalCount] = useState(0);
	const [unreadCount, setUnreadCount] = useState(0);
	const [loading, setLoading] = useState(true);
	const [errorMessage, setErrorMessage] = useState('');
	const [pushStatus, setPushStatus] = useState({
		supported: false,
		configured: false,
		permission: 'unsupported',
		subscribed: false,
	});
	const [pushActionLoading, setPushActionLoading] = useState(false);
	const [pushTestLoading, setPushTestLoading] = useState(false);
	const [pushStatusMessage, setPushStatusMessage] = useState('');

	const open = Boolean(anchorEl);
	const badgeCount = useMemo(() => Math.min(unreadCount, 99), [unreadCount]);

	const loadNotifications = useCallback(
		async ({ silent = false } = {}) => {
			if (!employee?.id) {
				setItems([]);
				setTotalCount(0);
				setUnreadCount(0);
				setErrorMessage('');
				setLoading(false);
				return;
			}

			if (!silent) setLoading(true);

			try {
				const response = await employeeMeRequest('/notifications');
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
				if (!silent) setLoading(false);
			}
		},
		[employee?.id],
	);

	useEffect(() => {
		loadNotifications();
	}, [loadNotifications]);
	const loadPushStatus = useCallback(async () => {
		if (!employee?.id) {
			setPushStatus({
				supported: false,
				configured: false,
				permission: 'unsupported',
				subscribed: false,
			});
			return;
		}

		try {
			const currentStatus = await getEmployeePushStatus();

			if (currentStatus.permission === 'granted' && currentStatus.configured) {
				await syncEmployeePushSubscription();
				const refreshedStatus = await getEmployeePushStatus();
				setPushStatus(refreshedStatus);
				return;
			}

			setPushStatus(currentStatus);
		} catch {
			setPushStatus({
				supported: false,
				configured: false,
				permission: 'unsupported',
				subscribed: false,
			});
		}
	}, [employee?.id]);

	useEffect(() => {
		loadPushStatus();
	}, [loadPushStatus]);

	useEffect(() => {
		if (open) loadNotifications({ silent: true });
	}, [open, loadNotifications]);

	useEffect(() => {
		if (open) loadPushStatus();
	}, [open, loadPushStatus]);

	const handleOpen = (event) => setAnchorEl(event.currentTarget);
	const handleClose = () => setAnchorEl(null);

	const markNotificationAsRead = useCallback(
		async (notificationId) => {
			if (!employee?.id || !notificationId) return;

			await employeeMeRequest('/notifications/read', {
				method: 'POST',
				body: JSON.stringify({ notificationId }),
			});
		},
		[employee?.id],
	);

	const markAllAsRead = useCallback(async () => {
		if (!employee?.id) return;

		const unreadNotificationIds = items.filter((item) => !item.isRead).map((item) => item.id);
		if (!unreadNotificationIds.length) return;

		await employeeMeRequest('/notifications/read-all', {
			method: 'POST',
			body: JSON.stringify({ notificationIds: unreadNotificationIds }),
		});

		setItems((currentItems) =>
			currentItems.map((item) =>
				unreadNotificationIds.includes(item.id)
					? { ...item, isRead: true, readAt: new Date().toISOString() }
					: item,
			),
		);
		setUnreadCount(0);
	}, [items, employee?.id]);

	const handleEnablePush = useCallback(async () => {
		setPushActionLoading(true);
		setPushStatusMessage('');

		try {
			await enableEmployeePushSubscription();
			await loadPushStatus();
			setErrorMessage('');
			setPushStatusMessage('Push berhasil diaktifkan untuk perangkat ini.');
		} catch (error) {
			setErrorMessage(error.message || 'Gagal mengaktifkan push notification.');
			await loadPushStatus();
		} finally {
			setPushActionLoading(false);
		}
	}, [loadPushStatus]);

	const handleSendPushTest = useCallback(async () => {
		setPushTestLoading(true);
		setPushStatusMessage('');

		try {
			const response = await sendEmployeePushTestNotification();
			setErrorMessage('');
			setPushStatusMessage(response?.message || 'Test push berhasil dikirim.');
		} catch (error) {
			setErrorMessage(error.message || 'Gagal mengirim test push notification.');
		} finally {
			setPushTestLoading(false);
		}
	}, []);

	const handleNavigate = async (item) => {
		if (!item.isRead) {
			try {
				await markNotificationAsRead(item.id);
				setItems((currentItems) =>
					currentItems.map((currentItem) =>
						currentItem.id === item.id
							? { ...currentItem, isRead: true, readAt: new Date().toISOString() }
							: currentItem,
					),
				);
				setUnreadCount((currentCount) => Math.max(0, currentCount - 1));
			} catch (error) {
				setErrorMessage(error.message || 'Status baca notifikasi gagal diperbarui.');
			}
		}

		handleClose();
		navigate(item.href || item.targetPath || '/karyawan');
	};

	const isPushEnabled = pushStatus.subscribed && pushStatus.permission === 'granted';
	const pushButtonVariant = isPushEnabled ? 'outlined' : 'contained';
	let pushButtonLabel = 'Aktifkan Push';

	if (pushActionLoading) {
		pushButtonLabel = 'Memproses...';
	} else if (isPushEnabled) {
		pushButtonLabel = 'Push Aktif';
	}

	let content = (
		<List disablePadding sx={{ maxHeight: 440, overflowY: 'auto' }}>
			{items.map((item, index) => (
				<Box key={item.id}>
					<ListItemButton
						alignItems="flex-start"
						onClick={() => handleNavigate(item)}
						sx={{ bgcolor: item.isRead ? 'transparent' : 'rgba(25, 118, 210, 0.06)' }}
					>
						<Stack direction="row" spacing={1.25} sx={{ width: '100%' }}>
							<Box sx={{ pt: 0.4 }}>{getSeverityIcon(item.severity)}</Box>
							<ListItemText
								primary={
									<Stack spacing={0.35}>
										<Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
											<Typography
												variant="body2"
												sx={{ fontWeight: item.isRead ? 600 : 700, color: '#123B66' }}
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
						<NotificationsOutlinedIcon color="action" fontSize="medium" />
					</Badge>
				</IconButton>
			</Tooltip>
			<Menu
				anchorEl={anchorEl}
				open={open}
				onClose={handleClose}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
				transformOrigin={{ vertical: 'top', horizontal: 'right' }}
				slotProps={{
					paper: {
						sx: { width: 420, maxWidth: 'calc(100vw - 24px)', borderRadius: 3, overflow: 'hidden' },
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
							{pushStatus.supported && pushStatus.configured ? (
								<Stack direction="row" spacing={1}>
									<Button
										size="small"
										variant={pushButtonVariant}
										onClick={handleEnablePush}
										disabled={pushActionLoading || isPushEnabled}
									>
										{pushButtonLabel}
									</Button>
									{isPushEnabled ? (
										<Button
											size="small"
											variant="text"
											onClick={handleSendPushTest}
											disabled={pushTestLoading}
										>
											{pushTestLoading ? 'Mengirim...' : 'Test Push'}
										</Button>
									) : null}
								</Stack>
							) : null}
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
					{pushStatus.supported && pushStatus.configured && pushStatus.permission === 'denied' ? (
						<Typography variant="caption" color="warning.main" sx={{ px: 2, pb: 1.25 }}>
							Izin notifikasi diblokir. Aktifkan lewat pengaturan browser perangkat Anda.
						</Typography>
					) : null}
					{pushStatusMessage ? (
						<Typography variant="caption" color="success.main" sx={{ px: 2, pb: 1.25 }}>
							{pushStatusMessage}
						</Typography>
					) : null}
					<Divider />
					{content}
				</Stack>
			</Menu>
		</>
	);
}

export default EmployeeNotificationButton;
