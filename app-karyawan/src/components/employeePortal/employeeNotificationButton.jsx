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
import Menu from '@mui/material/Menu';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import MarkEmailReadRoundedIcon from '@mui/icons-material/MarkEmailReadRounded';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';

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
			return <ErrorOutlineOutlinedIcon fontSize="small" sx={{ color: 'inherit' }} />;
		case 'warning':
			return <WarningAmberOutlinedIcon fontSize="small" sx={{ color: 'inherit' }} />;
		case 'success':
			return <CheckCircleOutlineOutlinedIcon fontSize="small" sx={{ color: 'inherit' }} />;
		default:
			return <InfoOutlinedIcon fontSize="small" sx={{ color: 'inherit' }} />;
	}
}

function getSeverityStyles(severity, isRead) {
	switch (severity) {
		case 'error':
			return {
				iconColor: '#D14343',
				accentColor: isRead ? 'rgba(209, 67, 67, 0.22)' : 'rgba(209, 67, 67, 0.9)',
				iconBackground: 'rgba(209, 67, 67, 0.12)',
			};
		case 'warning':
			return {
				iconColor: '#D97706',
				accentColor: isRead ? 'rgba(217, 119, 6, 0.22)' : 'rgba(217, 119, 6, 0.88)',
				iconBackground: 'rgba(245, 158, 11, 0.12)',
			};
		case 'success':
			return {
				iconColor: '#1F8A5B',
				accentColor: isRead ? 'rgba(31, 138, 91, 0.2)' : 'rgba(31, 138, 91, 0.85)',
				iconBackground: 'rgba(31, 138, 91, 0.12)',
			};
		default:
			return {
				iconColor: '#2F6FB3',
				accentColor: isRead ? 'rgba(47, 111, 179, 0.18)' : 'rgba(47, 111, 179, 0.82)',
				iconBackground: 'rgba(47, 111, 179, 0.12)',
			};
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

			if (!silent) {
				setLoading(true);
			}

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
				if (!silent) {
					setLoading(false);
				}
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
		if (open) {
			loadNotifications({ silent: true });
		}
	}, [open, loadNotifications]);

	useEffect(() => {
		if (open) {
			loadPushStatus();
		}
	}, [open, loadPushStatus]);

	const handleOpen = (event) => setAnchorEl(event.currentTarget);
	const handleClose = () => setAnchorEl(null);

	const markNotificationAsRead = useCallback(
		async (notificationId) => {
			if (!employee?.id || !notificationId) {
				return;
			}

			await employeeMeRequest('/notifications/read', {
				method: 'POST',
				body: JSON.stringify({ notificationId }),
			});
		},
		[employee?.id],
	);

	const markAllAsRead = useCallback(async () => {
		if (!employee?.id) {
			return;
		}

		const unreadNotificationIds = items.filter((item) => !item.isRead).map((item) => item.id);

		if (!unreadNotificationIds.length) {
			return;
		}

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
		<List disablePadding sx={{ maxHeight: 432, overflowY: 'auto', px: 1.25, py: 1.25 }}>
			{items.map((item, index) => {
				const severityStyles = getSeverityStyles(item.severity, item.isRead);

				return (
					<Box key={item.id} sx={{ mb: index < items.length - 1 ? 1 : 0 }}>
						<ListItemButton
							alignItems="flex-start"
							onClick={() => handleNavigate(item)}
							sx={{
								alignItems: 'stretch',
								p: 0,
								borderRadius: 3,
								overflow: 'hidden',
								border: '1px solid',
								borderColor: (theme) =>
									item.isRead
										? theme.palette.employeeSurface.borderSoft
										: alpha(theme.palette.primary.main, 0.2),
								backgroundColor: (theme) =>
									item.isRead
										? theme.palette.employeeSurface.card
										: alpha(
												theme.palette.primary.main,
												theme.palette.mode === 'dark' ? 0.14 : 0.05,
										  ),
								boxShadow: (theme) =>
									item.isRead
										? theme.palette.employeeSurface.shadowSoft
										: theme.palette.employeeSurface.shadowMedium,
								transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
								'&:hover': {
									backgroundColor: (theme) =>
										item.isRead
											? theme.palette.employeeSurface.card
											: alpha(
													theme.palette.primary.main,
													theme.palette.mode === 'dark' ? 0.18 : 0.08,
											  ),
									borderColor: (theme) =>
										item.isRead
											? theme.palette.employeeSurface.borderStrong
											: alpha(theme.palette.primary.main, 0.32),
									boxShadow: (theme) => theme.palette.employeeSurface.shadowMedium,
									transform: 'translateY(-1px)',
								},
								'&.Mui-focusVisible': {
									outline: '2px solid rgba(25, 118, 210, 0.28)',
									outlineOffset: '-2px',
								},
							}}
						>
							<Box
								sx={{
									width: 4,
									flexShrink: 0,
									backgroundColor: severityStyles.accentColor,
								}}
							/>
							<Stack direction="row" spacing={1.5} sx={{ width: '100%', p: 1.5, pr: 1.6 }}>
								<Box
									sx={{
										mt: 0.2,
										width: 38,
										height: 38,
										borderRadius: 2.5,
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										flexShrink: 0,
										backgroundColor: severityStyles.iconBackground,
										color: severityStyles.iconColor,
									}}
								>
									{getSeverityIcon(item.severity)}
								</Box>
								<Stack spacing={0.85} sx={{ minWidth: 0, flex: 1 }}>
									<Stack
										direction="row"
										spacing={1}
										alignItems="flex-start"
										justifyContent="space-between"
									>
										<Box sx={{ minWidth: 0, flex: 1 }}>
											<Typography
												variant="body2"
												sx={{
													fontWeight: item.isRead ? 600 : 700,
													color: 'text.primary',
													lineHeight: 1.4,
													display: '-webkit-box',
													WebkitLineClamp: 2,
													WebkitBoxOrient: 'vertical',
													overflow: 'hidden',
												}}
											>
												{item.title}
											</Typography>
										</Box>
										<Box
											sx={{
												flexShrink: 0,
												px: 1,
												py: 0.4,
												borderRadius: 999,
												backgroundColor: (theme) =>
													item.isRead
														? alpha(
																theme.palette.text.primary,
																theme.palette.mode === 'dark' ? 0.12 : 0.06,
														  )
														: alpha(theme.palette.primary.main, 0.14),
												color: item.isRead ? 'text.secondary' : 'primary.main',
											}}
										>
											<Typography
												variant="caption"
												sx={{ fontWeight: item.isRead ? 500 : 700, lineHeight: 1 }}
											>
												{item.isRead ? 'Dibaca' : 'Baru'}
											</Typography>
										</Box>
									</Stack>
									<Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
										{item.dateLabel}
									</Typography>
									<Typography
										variant="body2"
										color="text.secondary"
										sx={{
											lineHeight: 1.55,
											display: '-webkit-box',
											WebkitLineClamp: 2,
											WebkitBoxOrient: 'vertical',
											overflow: 'hidden',
										}}
									>
										{item.description}
									</Typography>
								</Stack>
							</Stack>
						</ListItemButton>
					</Box>
				);
			})}
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
			<Stack spacing={0.9} alignItems="center" justifyContent="center" sx={{ py: 6, px: 3 }}>
				<Box
					sx={{
						width: 52,
						height: 52,
						borderRadius: 3,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						backgroundColor: (theme) =>
							alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.12 : 0.06),
						color: 'text.secondary',
					}}
				>
					<NotificationsOutlinedIcon />
				</Box>
				<Typography variant="body2" color="text.secondary" textAlign="center">
					Belum ada notifikasi aktif.
				</Typography>
			</Stack>
		);
	}

	return (
		<>
			<Tooltip title="Notifikasi">
				<IconButton
					size="small"
					onClick={handleOpen}
					sx={{
						width: 38,
						height: 38,
						borderRadius: 2.5,
						color: open ? 'primary.main' : 'text.primary',
						backgroundColor: (theme) =>
							open
								? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.18 : 0.12)
								: 'transparent',
						border: (theme) =>
							open ? `1px solid ${alpha(theme.palette.primary.main, 0.18)}` : `1px solid transparent`,
						boxShadow: (theme) => (open ? theme.palette.employeeSurface.shadowSoft : 'none'),
						transition:
							'background-color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, color 0.18s ease',
						'&:hover': {
							backgroundColor: (theme) =>
								open
									? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.22 : 0.16)
									: alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.12 : 0.06),
						},
						'&.Mui-focusVisible': {
							outline: '2px solid rgba(25, 118, 210, 0.22)',
							outlineOffset: 1,
						},
					}}
				>
					<Badge
						color="error"
						overlap="rectangular"
						badgeContent={badgeCount > 0 ? badgeCount : null}
						max={99}
					>
						<NotificationsOutlinedIcon fontSize="medium" sx={{ color: 'inherit' }} />
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
						sx: {
							width: 388,
							maxWidth: 'calc(100vw - 20px)',
							borderRadius: 4,
							overflow: 'hidden',
							border: (theme) => `1px solid ${theme.palette.employeeSurface.borderSoft}`,
							boxShadow: (theme) => theme.palette.employeeSurface.shadowFloating,
							backgroundImage: 'none',
							backgroundColor: (theme) => theme.palette.employeeSurface.card,
						},
					},
				}}
			>
				<Stack spacing={0}>
					<Box
						sx={{
							px: 1.5,
							pt: 1.5,
							pb: 1.25,
							background: (theme) => theme.palette.employeeSurface.cardGradient,
						}}
					>
						<Stack spacing={1.35}>
							<Stack
								direction="row"
								spacing={1.25}
								alignItems="flex-start"
								justifyContent="space-between"
							>
								<Stack spacing={0.45} sx={{ minWidth: 0 }}>
									<Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
										<Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
											Notifikasi
										</Typography>
										<Box
											sx={{
												px: 1,
												py: 0.35,
												borderRadius: 999,
												backgroundColor: (theme) =>
													unreadCount
														? alpha(theme.palette.primary.main, 0.14)
														: alpha(
																theme.palette.text.primary,
																theme.palette.mode === 'dark' ? 0.12 : 0.06,
														  ),
												color: unreadCount ? 'primary.main' : 'text.secondary',
											}}
										>
											<Typography variant="caption" sx={{ fontWeight: 700, lineHeight: 1 }}>
												{unreadCount} baru
											</Typography>
										</Box>
									</Stack>
									<Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
										{unreadCount} belum dibaca dari {totalCount} alert aktif
									</Typography>
								</Stack>
								<IconButton
									size="small"
									onClick={() => loadNotifications()}
									sx={{
										mt: -0.2,
										width: 36,
										height: 36,
										flexShrink: 0,
										border: (theme) => `1px solid ${theme.palette.employeeSurface.borderSoft}`,
										backgroundColor: (theme) => theme.palette.employeeSurface.card,
										color: 'primary.main',
									}}
								>
									<RefreshOutlinedIcon fontSize="small" />
								</IconButton>
							</Stack>

							<Stack
								spacing={1}
								sx={{
									p: 1.1,
									borderRadius: 3,
									border: (theme) => `1px solid ${theme.palette.employeeSurface.borderSoft}`,
									backgroundColor: (theme) => theme.palette.employeeSurface.soft,
								}}
							>
								<Stack
									direction="row"
									spacing={1}
									alignItems="center"
									justifyContent="space-between"
									flexWrap="wrap"
									useFlexGap
								>
									<Stack direction="row" spacing={1} alignItems="center">
										<Box
											sx={{
												width: 34,
												height: 34,
												borderRadius: 2.5,
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												backgroundColor: (theme) =>
													isPushEnabled
														? 'rgba(31, 138, 91, 0.12)'
														: alpha(theme.palette.primary.main, 0.1),
												color: isPushEnabled ? '#1F8A5B' : 'primary.main',
											}}
										>
											<NotificationsActiveRoundedIcon fontSize="small" />
										</Box>
										<Box>
											<Typography
												variant="caption"
												sx={{ color: 'text.secondary', fontWeight: 600 }}
											>
												Push notification
											</Typography>
											<Typography
												variant="body2"
												sx={{ color: 'text.primary', fontWeight: 700, lineHeight: 1.25 }}
											>
												{isPushEnabled ? 'Aktif di perangkat ini' : 'Belum aktif'}
											</Typography>
										</Box>
									</Stack>

									{pushStatus.supported && pushStatus.configured ? (
										<Button
											size="small"
											variant={pushButtonVariant}
											startIcon={<BoltRoundedIcon fontSize="small" />}
											onClick={handleEnablePush}
											disabled={pushActionLoading || isPushEnabled}
											sx={{
												minHeight: 36,
												borderRadius: 999,
												px: 1.5,
												fontWeight: 700,
												textTransform: 'none',
												boxShadow: pushButtonVariant === 'contained' ? 'none' : undefined,
											}}
										>
											{pushButtonLabel}
										</Button>
									) : null}
								</Stack>

								<Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
									{pushStatus.supported && pushStatus.configured && isPushEnabled ? (
										<Button
											size="small"
											variant="outlined"
											startIcon={
												pushTestLoading ? (
													<CircularProgress size={14} color="inherit" />
												) : (
													<AutorenewRoundedIcon fontSize="small" />
												)
											}
											onClick={handleSendPushTest}
											disabled={pushTestLoading}
											sx={{
												minHeight: 34,
												borderRadius: 999,
												px: 1.5,
												fontWeight: 700,
												textTransform: 'none',
											}}
										>
											{pushTestLoading ? 'Mengirim...' : 'Test Push'}
										</Button>
									) : null}

									<Button
										size="small"
										variant="text"
										startIcon={<MarkEmailReadRoundedIcon fontSize="small" />}
										onClick={markAllAsRead}
										disabled={!unreadCount}
										sx={{
											minHeight: 34,
											borderRadius: 999,
											px: 1.2,
											fontWeight: 700,
											textTransform: 'none',
										}}
									>
										Tandai semua
									</Button>
								</Stack>
							</Stack>

							{pushStatus.supported && pushStatus.configured && pushStatus.permission === 'denied' ? (
								<Alert
									severity="warning"
									variant="outlined"
									sx={{
										borderRadius: 2.5,
										py: 0.35,
										alignItems: 'center',
										'& .MuiAlert-message': { fontSize: 12.5, lineHeight: 1.45 },
									}}
								>
									Izin notifikasi diblokir. Aktifkan lewat pengaturan browser perangkat Anda.
								</Alert>
							) : null}

							{pushStatusMessage ? (
								<Alert
									severity="success"
									variant="outlined"
									sx={{
										borderRadius: 2.5,
										py: 0.35,
										alignItems: 'center',
										'& .MuiAlert-message': { fontSize: 12.5, lineHeight: 1.45 },
									}}
								>
									{pushStatusMessage}
								</Alert>
							) : null}
						</Stack>
					</Box>
					<Divider />
					<Box sx={{ backgroundColor: (theme) => theme.palette.employeeSurface.card }}>{content}</Box>
				</Stack>
			</Menu>
		</>
	);
}

export default EmployeeNotificationButton;
