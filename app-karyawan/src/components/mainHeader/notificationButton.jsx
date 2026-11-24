import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { alpha } from '@mui/material/styles';

import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
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
	const statusLabel = getAdminNotificationStatusLabel(item.isRead);
	const categoryLabel = getAdminNotificationCategoryLabel(item.category);

	return (
		<Box
			component="button"
			type="button"
			onClick={() => onOpen(item)}
			aria-label={`${item.title}. ${categoryLabel}. ${item.dateLabel}. ${statusLabel}`}
			sx={{
				appearance: 'none',
				width: '100%',
				m: 0,
				border: 0,
				textAlign: 'left',
				font: 'inherit',
				color: 'inherit',
				px: 1.25,
				py: 1.1,
				borderRadius: 2,
				cursor: 'pointer',
				bgcolor: item.isRead ? 'transparent' : (theme) => alpha(theme.palette.primary.main, 0.06),
				transition: 'background-color 160ms ease',
				'&:hover': {
					bgcolor: (theme) => alpha(theme.palette.primary.main, item.isRead ? 0.07 : 0.12),
				},
				'&:focus-visible': {
					outline: (theme) => `2px solid ${theme.palette.primary.main}`,
					outlineOffset: -2,
				},
			}}
		>
			<Stack direction="row" spacing={1.25} alignItems="flex-start">
				<Avatar
					variant="rounded"
					aria-hidden
					sx={{
						width: 30,
						height: 30,
						bgcolor: visual.tint,
						color: visual.color,
						borderRadius: 2,
						flexShrink: 0,
						mt: 0.25,
					}}
				>
					{visual.icon}
				</Avatar>
				<Stack spacing={0.4} sx={{ minWidth: 0, flex: 1 }}>
					<Stack direction="row" spacing={1} alignItems="flex-start">
						<Typography
							variant="body2"
							sx={{
								color: 'text.primary',
								fontWeight: item.isRead ? 600 : 700,
								lineHeight: 1.35,
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
							aria-hidden
							sx={{
								width: 6,
								height: 6,
								mt: 0.75,
								borderRadius: '50%',
								bgcolor: item.isRead ? 'divider' : 'primary.main',
								flexShrink: 0,
							}}
						/>
					</Stack>
					<Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap alignItems="center">
						<Typography variant="caption" sx={{ color: visual.color, fontWeight: 700 }}>
							{categoryLabel}
						</Typography>
						<Box aria-hidden sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'text.disabled' }} />
						<Typography variant="caption" sx={{ color: 'text.secondary' }}>
							{item.dateLabel}
						</Typography>
					</Stack>
					<Typography
						variant="caption"
						sx={{
							color: 'text.secondary',
							lineHeight: 1.45,
							display: '-webkit-box',
							overflow: 'hidden',
							WebkitBoxOrient: 'vertical',
							WebkitLineClamp: 2,
						}}
					>
						{item.description}
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
	const badgeLabel = unreadCount > 99 ? '99+' : String(badgeCount);

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
				const response = await fetchAdminNotifications({ limit: PANEL_LIMIT });
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
					await markAdminNotificationAsRead(item.id);
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
			await markAllAdminNotificationsAsRead();
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
		<Stack spacing={0.25} sx={{ p: 1, maxHeight: 400, overflowY: 'auto' }}>
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
				<Alert severity="error" sx={{ borderRadius: 2 }}>
					{errorMessage}
				</Alert>
			</Stack>
		);
	} else if (items.length === 0) {
		content = (
			<Stack spacing={1} alignItems="center" justifyContent="center" sx={{ py: 6, px: 3 }}>
				<Box
					aria-hidden
					sx={{
						width: 44,
						height: 44,
						borderRadius: '50%',
						display: 'grid',
						placeItems: 'center',
						bgcolor: 'action.hover',
						color: 'text.disabled',
					}}
				>
					<NotificationsOutlinedIcon sx={{ fontSize: 22 }} />
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
					onClick={handleOpen}
					aria-label={unreadCount > 0 ? `Notifikasi, ${unreadCount} belum dibaca` : 'Notifikasi'}
					aria-haspopup="true"
					aria-expanded={open}
					sx={{ width: 40, height: 40 }}
				>
					<Box sx={{ position: 'relative', display: 'inline-flex' }}>
						<NotificationsOutlinedIcon sx={{ fontSize: 20 }} />
						{badgeCount > 0 ? (
							<Box
								component="span"
								aria-hidden
								sx={{
									position: 'absolute',
									top: -5,
									right: -6,
									minWidth: 15,
									height: 15,
									px: '4px',
									borderRadius: 8,
									bgcolor: 'error.main',
									color: 'error.contrastText',
									fontSize: '0.625rem',
									fontWeight: 700,
									lineHeight: '15px',
									textAlign: 'center',
									fontVariantNumeric: 'tabular-nums',
									boxShadow: (theme) => `0 0 0 2px ${theme.palette.background.paper}`,
									pointerEvents: 'none',
								}}
							>
								{badgeLabel}
							</Box>
						) : null}
					</Box>
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
				PaperProps={{
					sx: {
						width: 384,
						maxWidth: 'calc(100vw - 32px)',
						mt: 1,
						borderRadius: 2,
						overflow: 'hidden',
						border: 1,
						borderColor: 'divider',
						boxShadow: (theme) => theme.shadows[8],
					},
				}}
			>
				<Stack spacing={0}>
					<Stack
						direction="row"
						alignItems="flex-start"
						justifyContent="space-between"
						spacing={1.5}
						sx={{ px: 2, pt: 1.75, pb: 1.25 }}
					>
						<Box sx={{ minWidth: 0 }}>
							<Stack direction="row" alignItems="center" spacing={0.75}>
								<Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.25 }}>
									Notifikasi
								</Typography>
								{unreadCount > 0 ? (
									<Chip
										size="small"
										color="error"
										label={badgeLabel}
										sx={{
											height: 18,
											fontSize: '0.6875rem',
											fontWeight: 700,
											'& .MuiChip-label': { px: 0.75 },
										}}
									/>
								) : null}
							</Stack>
							<Typography variant="caption" color="text.secondary">
								{unreadCount} belum dibaca dari {totalCount} alert aktif
							</Typography>
						</Box>
						<Stack direction="row" spacing={0.25} sx={{ mt: -0.5, mr: -0.5 }}>
							<Tooltip title="Tandai semua dibaca">
								<span>
									<IconButton
										size="small"
										onClick={handleMarkAll}
										disabled={!unreadCount}
										aria-label="Tandai semua notifikasi dibaca"
									>
										<DoneAllRoundedIcon fontSize="small" />
									</IconButton>
								</span>
							</Tooltip>
							<Tooltip title="Muat ulang notifikasi">
								<IconButton
									size="small"
									onClick={() => loadNotifications()}
									aria-label="Muat ulang notifikasi"
								>
									<RefreshOutlinedIcon fontSize="small" />
								</IconButton>
							</Tooltip>
						</Stack>
					</Stack>

					<Divider />
					{content}
					<Divider />

					<Box sx={{ p: 0.75 }}>
						<Button
							fullWidth
							variant="text"
							endIcon={<WestRoundedIcon sx={{ transform: 'rotate(180deg)' }} fontSize="small" />}
							onClick={handleOpenHistory}
							sx={{
								justifyContent: 'space-between',
								px: 1.25,
								py: 0.85,
								borderRadius: 1.5,
								fontWeight: 600,
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
