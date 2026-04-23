import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { alpha, useTheme } from '@mui/material/styles';
import { useSnackbar } from 'notistack';

import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import InputAdornment from '@mui/material/InputAdornment';
import Link from '@mui/material/Link';
import MenuItem from '@mui/material/MenuItem';
import Pagination from '@mui/material/Pagination';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import DoneAllRoundedIcon from '@mui/icons-material/DoneAllRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';

import PageHeader from '@/components/pageHeader';
import { useAuth } from '@/contexts/authContext';
import {
	fetchAdminNotificationHistory,
	markAdminNotificationAsRead,
	markAllAdminNotificationsAsRead,
} from '@/services/adminNotifications';
import {
	getAdminNotificationCategoryLabel,
	getAdminNotificationStatusLabel,
	getAdminNotificationVisual,
} from '@/utils/adminNotifications';

const READ_TABS = [
	{ value: 'all', label: 'Semua' },
	{ value: 'unread', label: 'Belum Dibaca' },
	{ value: 'read', label: 'Sudah Dibaca' },
];

const ACTIVE_STATUS_OPTIONS = [
	{ value: 'all', label: 'Semua Status' },
	{ value: 'active', label: 'Masih Aktif' },
	{ value: 'archived', label: 'Riwayat / Arsip' },
];

function getPageSurfaceStyles(theme) {
	const isDarkMode = theme.palette.mode === 'dark';
	const surfaceSoft = isDarkMode ? alpha(theme.palette.common.white, 0.04) : alpha(theme.palette.primary.main, 0.02);
	const surfaceMuted = isDarkMode ? alpha(theme.palette.common.white, 0.03) : alpha(theme.palette.primary.main, 0.03);
	const surfaceBorderStrong = isDarkMode
		? alpha(theme.palette.common.white, 0.12)
		: alpha(theme.palette.primary.main, 0.12);
	const surfaceBorderSoft = isDarkMode
		? alpha(theme.palette.common.white, 0.08)
		: alpha(theme.palette.primary.main, 0.08);

	return {
		surface: theme.palette.background.paper,
		surfaceSoft,
		surfaceMuted,
		surfaceBorderStrong,
		surfaceBorderSoft,
		textPrimary: theme.palette.text.primary,
		textSecondary: theme.palette.text.secondary,
		titleColor: theme.palette.text.primary,
		emptyIcon: theme.palette.text.disabled,
	};
}

function SummaryCard({ label, value, helper }) {
	const theme = useTheme();
	const colors = getPageSurfaceStyles(theme);

	return (
		<Paper
			elevation={0}
			sx={{
				p: 2,
				borderRadius: 3.5,
				border: `1px solid ${colors.surfaceBorderSoft}`,
				backgroundColor: colors.surface,
			}}
		>
			<Stack spacing={0.5}>
				<Typography variant="caption" sx={{ color: colors.textSecondary, letterSpacing: '0.08em' }}>
					{label}
				</Typography>
				<Typography variant="h5" sx={{ color: colors.titleColor, fontWeight: 700 }}>
					{value}
				</Typography>
				<Typography variant="body2" color="text.secondary">
					{helper}
				</Typography>
			</Stack>
		</Paper>
	);
}

function NotificationHistoryItem({ item, onMarkRead, onOpen }) {
	const theme = useTheme();
	const colors = getPageSurfaceStyles(theme);
	const visual = getAdminNotificationVisual(item);

	return (
		<Paper
			elevation={0}
			sx={{
				p: 2,
				borderRadius: 4,
				border: `1px solid ${item.isRead ? colors.surfaceBorderSoft : colors.surfaceBorderStrong}`,
				backgroundColor: item.isRead ? colors.surface : colors.surfaceMuted,
				boxShadow:
					theme.palette.mode === 'dark'
						? '0 12px 32px rgba(0, 0, 0, 0.24)'
						: '0 10px 30px rgba(18, 59, 102, 0.06)',
			}}
		>
			<Stack spacing={1.5}>
				<Stack direction="row" spacing={1.5} alignItems="flex-start">
					<Avatar
						variant="rounded"
						sx={{
							width: 40,
							height: 40,
							bgcolor: visual.tint,
							color: visual.color,
							borderRadius: 3,
							flexShrink: 0,
						}}
					>
						{visual.icon}
					</Avatar>
					<Stack spacing={0.75} sx={{ minWidth: 0, flex: 1 }}>
						<Stack
							direction={{ xs: 'column', md: 'row' }}
							spacing={1}
							justifyContent="space-between"
							alignItems={{ xs: 'flex-start', md: 'flex-start' }}
						>
							<Box sx={{ minWidth: 0 }}>
								<Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 0.4 }}>
									<Chip
										label={getAdminNotificationCategoryLabel(item.category)}
										size="small"
										sx={{
											height: 24,
											borderRadius: 999,
											bgcolor: alpha(visual.color, 0.1),
											color: visual.color,
											fontWeight: 700,
										}}
									/>
									<Chip
										label={item.isActive ? 'Aktif' : 'Riwayat'}
										size="small"
										variant="outlined"
										sx={{
											height: 24,
											borderRadius: 999,
											borderColor: 'rgba(18,59,102,0.12)',
											color: '#698099',
										}}
									/>
								</Stack>
								<Typography
									variant="subtitle1"
									sx={{
										color: '#123B66',
										fontWeight: item.isRead ? 700 : 800,
										lineHeight: 1.3,
									}}
								>
									{item.title}
								</Typography>
							</Box>
							<Stack
								spacing={0.35}
								alignItems={{ xs: 'flex-start', md: 'flex-end' }}
								sx={{ flexShrink: 0 }}
							>
								<Typography variant="caption" sx={{ color: '#6C839C' }}>
									{item.dateLabel || '-'}
								</Typography>
								<Typography variant="caption" sx={{ color: '#90A0B5' }}>
									{getAdminNotificationStatusLabel(item.isRead)}
								</Typography>
							</Stack>
						</Stack>

						<Typography
							variant="body2"
							sx={{
								color: '#5B728C',
								lineHeight: 1.55,
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

				<Stack
					direction={{ xs: 'column', md: 'row' }}
					spacing={1}
					justifyContent="space-between"
					alignItems={{ xs: 'stretch', md: 'center' }}
				>
					<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
						<Typography variant="caption" sx={{ color: '#8EA0B4' }}>
							Terdeteksi pertama: {new Date(item.firstDetectedAt).toLocaleDateString('id-ID')}
						</Typography>
						<Typography variant="caption" sx={{ color: '#8EA0B4' }}>
							Update terakhir: {new Date(item.lastDetectedAt).toLocaleDateString('id-ID')}
						</Typography>
					</Stack>
					<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
						{!item.isRead ? (
							<Button size="small" variant="text" onClick={() => onMarkRead(item)}>
								Tandai dibaca
							</Button>
						) : null}
						<Button
							size="small"
							variant="outlined"
							endIcon={<OpenInNewRoundedIcon fontSize="small" />}
							onClick={() => onOpen(item)}
						>
							Buka Halaman
						</Button>
					</Stack>
				</Stack>
			</Stack>
		</Paper>
	);
}

function AdminNotificationsPage() {
	const navigate = useNavigate();
	const { enqueueSnackbar } = useSnackbar();
	const { user } = useAuth();
	const theme = useTheme();
	const colors = getPageSurfaceStyles(theme);
	const [response, setResponse] = useState({
		items: [],
		totalCount: 0,
		unreadCount: 0,
		activeCount: 0,
		page: 1,
		pageSize: 12,
		totalPages: 1,
		categories: [],
	});
	const [loading, setLoading] = useState(true);
	const [errorMessage, setErrorMessage] = useState('');
	const [keywordInput, setKeywordInput] = useState('');
	const [keyword, setKeyword] = useState('');
	const [readStatus, setReadStatus] = useState('all');
	const [activeStatus, setActiveStatus] = useState('all');
	const [category, setCategory] = useState('ALL');
	const [page, setPage] = useState(1);

	useEffect(() => {
		const timeoutId = window.setTimeout(() => {
			setKeyword(keywordInput.trim());
			setPage(1);
		}, 250);

		return () => {
			window.clearTimeout(timeoutId);
		};
	}, [keywordInput]);

	const loadData = useCallback(
		async ({ silent = false, nextPage = page } = {}) => {
			if (!user?.employeeId) {
				return;
			}

			if (!silent) {
				setLoading(true);
			}

			try {
				const historyResponse = await fetchAdminNotificationHistory(user, {
					page: nextPage,
					pageSize: response.pageSize,
					readStatus,
					activeStatus,
					category,
					keyword,
				});
				setResponse((current) => ({
					...current,
					...historyResponse,
				}));
				setErrorMessage('');
			} catch (error) {
				setErrorMessage(error.message || 'Riwayat notifikasi belum bisa dimuat.');
			} finally {
				if (!silent) {
					setLoading(false);
				}
			}
		},
		[activeStatus, category, keyword, page, response.pageSize, user],
	);

	useEffect(() => {
		loadData({ nextPage: page });
	}, [loadData, page]);

	const patchItemAsRead = useCallback((notificationId) => {
		setResponse((current) => ({
			...current,
			unreadCount: Math.max(
				0,
				current.unreadCount -
					(current.items.some((item) => item.id === notificationId && !item.isRead) ? 1 : 0),
			),
			items: current.items.map((item) =>
				item.id === notificationId
					? {
							...item,
							isRead: true,
							readAt: new Date().toISOString(),
					  }
					: item,
			),
		}));
	}, []);

	const handleMarkRead = useCallback(
		async (item, options = {}) => {
			const { silent = false } = options;

			if (item.isRead) {
				return;
			}

			try {
				await markAdminNotificationAsRead(user, item.id);
				if (readStatus === 'unread') {
					loadData({ nextPage: page });
				} else {
					patchItemAsRead(item.id);
				}
				if (!silent) {
					enqueueSnackbar('Notifikasi ditandai sebagai dibaca.', { variant: 'success' });
				}
			} catch (error) {
				enqueueSnackbar(error.message || 'Status baca notifikasi gagal diperbarui.', { variant: 'error' });
			}
		},
		[enqueueSnackbar, loadData, page, patchItemAsRead, readStatus, user],
	);

	const handleOpen = useCallback(
		async (item) => {
			if (!item.isRead) {
				await handleMarkRead(item, { silent: true });
			}

			navigate(item.href || item.targetPath || '/');
		},
		[handleMarkRead, navigate],
	);

	const handleMarkAll = useCallback(async () => {
		try {
			await markAllAdminNotificationsAsRead(user);
			enqueueSnackbar('Semua notifikasi berhasil ditandai dibaca.', { variant: 'success' });
			loadData({ nextPage: page });
		} catch (error) {
			enqueueSnackbar(error.message || 'Semua notifikasi belum bisa ditandai dibaca.', { variant: 'error' });
		}
	}, [enqueueSnackbar, loadData, page, user]);

	const availableCategories = useMemo(
		() => [{ value: 'ALL', label: 'Semua Tipe' }, ...(response.categories || [])],
		[response.categories],
	);

	let listContent = (
		<Paper
			elevation={0}
			sx={{
				py: 9,
				px: 3,
				borderRadius: 4,
				border: `1px dashed ${colors.surfaceBorderStrong}`,
				backgroundColor: colors.surfaceMuted,
			}}
		>
			<Stack spacing={1} alignItems="center">
				<NotificationsNoneRoundedIcon sx={{ fontSize: 28, color: colors.emptyIcon }} />
				<Typography variant="subtitle1" sx={{ color: colors.titleColor, fontWeight: 700 }}>
					Belum ada record notifikasi
				</Typography>
				<Typography variant="body2" color="text.secondary" textAlign="center">
					Coba ubah filter atau refresh jika Anda ingin memuat notifikasi terbaru.
				</Typography>
			</Stack>
		</Paper>
	);

	if (loading) {
		listContent = (
			<Stack alignItems="center" justifyContent="center" py={10}>
				<CircularProgress />
			</Stack>
		);
	} else if (errorMessage) {
		listContent = <Alert severity="error">{errorMessage}</Alert>;
	} else if (response.items.length) {
		listContent = (
			<Stack spacing={1.5}>
				{response.items.map((item) => (
					<NotificationHistoryItem
						key={item.id}
						item={item}
						onMarkRead={handleMarkRead}
						onOpen={handleOpen}
					/>
				))}
			</Stack>
		);
	}

	return (
		<>
			<PageHeader title="Record Notifikasi Admin">
				<Breadcrumbs aria-label="breadcrumb" sx={{ textTransform: 'uppercase' }}>
					<Link underline="hover" href="#!">
						System
					</Link>
					<Typography color="text.tertiary">Record Notifikasi</Typography>
				</Breadcrumbs>
			</PageHeader>

			<Stack spacing={2.5}>
				<Stack
					sx={{
						display: 'grid',
						gridTemplateColumns: {
							xs: 'repeat(1, minmax(0, 1fr))',
							md: 'repeat(3, minmax(0, 1fr))',
						},
						gap: 2,
					}}
				>
					<SummaryCard
						label="TOTAL RECORD"
						value={response.totalCount}
						helper="Riwayat yang sesuai filter saat ini"
					/>
					<SummaryCard
						label="BELUM DIBACA"
						value={response.unreadCount}
						helper="Masih perlu perhatian admin"
					/>
					<SummaryCard
						label="MASIH AKTIF"
						value={response.activeCount}
						helper="Alert yang masih live saat ini"
					/>
				</Stack>

				<Card
					sx={{
						minHeight: '68vh',
						p: 3,
						bgcolor: colors.surface,
						border: `1px solid ${colors.surfaceBorderSoft}`,
					}}
				>
					<Stack spacing={2.25}>
						<Stack
							direction={{ xs: 'column', lg: 'row' }}
							spacing={1.5}
							justifyContent="space-between"
							alignItems={{ xs: 'stretch', lg: 'center' }}
						>
							<Box>
								<Typography variant="h5" sx={{ color: colors.titleColor, fontWeight: 800 }}>
									Inbox Notifikasi
								</Typography>
								<Typography variant="body2" color="text.secondary">
									Riwayat notifikasi admin yang bisa difilter, ditandai dibaca, dan dibuka ke halaman
									terkait.
								</Typography>
							</Box>
							<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
								<Button
									size="small"
									variant="text"
									startIcon={<DoneAllRoundedIcon fontSize="small" />}
									onClick={handleMarkAll}
									disabled={!response.unreadCount}
								>
									Tandai semua
								</Button>
								<Button
									size="small"
									variant="outlined"
									startIcon={<RefreshOutlinedIcon fontSize="small" />}
									onClick={() => loadData({ nextPage: page })}
								>
									Refresh
								</Button>
							</Stack>
						</Stack>

						<Paper
							elevation={0}
							sx={{
								p: 1,
								borderRadius: 3.5,
								border: `1px solid ${colors.surfaceBorderSoft}`,
								backgroundColor: colors.surfaceSoft,
							}}
						>
							<Stack spacing={1.25}>
								<Tabs
									value={readStatus}
									onChange={(_event, nextValue) => {
										setReadStatus(nextValue);
										setPage(1);
									}}
									variant="scrollable"
									scrollButtons={false}
									sx={{
										minHeight: 0,
										'& .MuiTab-root': {
											minHeight: 38,
											textTransform: 'none',
											fontWeight: 700,
										},
									}}
								>
									{READ_TABS.map((tab) => (
										<Tab key={tab.value} value={tab.value} label={tab.label} />
									))}
								</Tabs>
								<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.25}>
									<TextField
										fullWidth
										size="small"
										label="Cari Notifikasi"
										value={keywordInput}
										onChange={(event) => setKeywordInput(event.target.value)}
										placeholder="Judul, deskripsi, request number..."
										InputProps={{
											startAdornment: (
												<InputAdornment position="start">
													<SearchOutlinedIcon fontSize="small" />
												</InputAdornment>
											),
										}}
									/>
									<TextField
										select
										size="small"
										label="Tipe"
										value={category}
										onChange={(event) => {
											setCategory(event.target.value);
											setPage(1);
										}}
										sx={{ minWidth: 220 }}
									>
										{availableCategories.map((item) => (
											<MenuItem key={item.value} value={item.value}>
												{item.label}
											</MenuItem>
										))}
									</TextField>
									<TextField
										select
										size="small"
										label="Status Alert"
										value={activeStatus}
										onChange={(event) => {
											setActiveStatus(event.target.value);
											setPage(1);
										}}
										sx={{ minWidth: 200 }}
									>
										{ACTIVE_STATUS_OPTIONS.map((item) => (
											<MenuItem key={item.value} value={item.value}>
												{item.label}
											</MenuItem>
										))}
									</TextField>
								</Stack>
							</Stack>
						</Paper>

						<Divider />
						{listContent}

						{response.totalPages > 1 ? (
							<Stack direction="row" justifyContent="center" pt={1}>
								<Pagination
									page={response.page}
									count={response.totalPages}
									color="primary"
									onChange={(_event, nextPage) => setPage(nextPage)}
								/>
							</Stack>
						) : null}
					</Stack>
				</Card>
			</Stack>
		</>
	);
}

export default AdminNotificationsPage;
