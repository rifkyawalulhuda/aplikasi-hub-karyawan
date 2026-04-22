import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { alpha } from '@mui/material/styles';

import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import CardActionArea from '@mui/material/CardActionArea';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import ReportGmailerrorredOutlinedIcon from '@mui/icons-material/ReportGmailerrorredOutlined';
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import WorkOutlineRoundedIcon from '@mui/icons-material/WorkOutlineRounded';
import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';

import FeedbackState from '@/components/employeePortal/feedbackState';
import InstallAppCard from '@/components/employeePortal/installAppCard';
import { useEmployeeAuth } from '@/contexts/employeeAuthContext';
import { getDisciplineDocumentTitle } from '@/pages/employeeData/warningLetters/utils';
import { employeeMeRequest } from '@/services/employeeApi';
import { formatLongDate, getEmployeePortalErrorMessage, handleEmployeeUnauthorized } from '@/utils/employeePortal';

const QUICK_MENU_ITEMS = [
	{
		title: 'Cuti Saya',
		icon: <CalendarMonthOutlinedIcon />,
		path: '/karyawan/cuti',
		description: 'Lihat pengajuan dan saldo cuti',
		accent: '#2F74BC',
		tint: 'rgba(47, 116, 188, 0.12)',
	},
	{
		title: 'Profil',
		icon: <BadgeOutlinedIcon />,
		path: '/karyawan/profil',
		description: 'Data diri dan keamanan akun',
		accent: '#123B66',
		tint: 'rgba(18, 59, 102, 0.1)',
	},
	{
		title: 'Bimbingan',
		icon: <DescriptionOutlinedIcon />,
		path: '/karyawan/bimbingan-pengarahan',
		description: 'Riwayat bimbingan dan pengarahan',
		accent: '#356FA8',
		tint: 'rgba(53, 111, 168, 0.12)',
	},
	{
		title: 'Pelatihan',
		icon: <SchoolOutlinedIcon />,
		path: '/karyawan/pelatihan',
		description: 'Daftar pelatihan yang diikuti',
		accent: '#2E6F40',
		tint: 'rgba(46, 111, 64, 0.12)',
	},
	{
		title: 'Catatan',
		icon: <ReportGmailerrorredOutlinedIcon />,
		path: '/karyawan/surat-peringatan',
		description: 'Surat peringatan dan teguran',
		accent: '#4D83BF',
		tint: 'rgba(77, 131, 191, 0.12)',
	},
];

function SummaryCard({ label, value, helper, icon, accent = '#123B66', badgeLabel = '', onClick = null }) {
	const content = (
		<Stack spacing={1.25} sx={{ p: 1.75 }}>
			<Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
				<Avatar
					variant="rounded"
					sx={{
						width: 38,
						height: 38,
						bgcolor: alpha(accent, 0.12),
						color: accent,
						borderRadius: 3,
						flexShrink: 0,
					}}
				>
					{icon}
				</Avatar>
				<Stack spacing={0.75} alignItems="flex-end" sx={{ minWidth: 0 }}>
					{badgeLabel ? (
						<Chip
							label={badgeLabel}
							size="small"
							sx={{
								height: 24,
								borderRadius: 999,
								fontWeight: 700,
								bgcolor: (theme) => alpha(accent, theme.palette.mode === 'dark' ? 0.24 : 0.1),
								color: accent,
								maxWidth: '100%',
							}}
						/>
					) : null}
					<Typography
						variant="caption"
						sx={{ color: 'text.secondary', letterSpacing: '0.08em', textAlign: 'right' }}
					>
						{label}
					</Typography>
				</Stack>
			</Stack>
			<Typography
				variant="h6"
				sx={{ color: 'text.primary', fontWeight: 700, lineHeight: 1.15, fontSize: '1.05rem' }}
			>
				{value}
			</Typography>
			<Typography
				variant="caption"
				color="text.secondary"
				sx={{
					fontSize: '0.7rem',
					lineHeight: 1.45,
					display: '-webkit-box',
					WebkitLineClamp: 2,
					WebkitBoxOrient: 'vertical',
					overflow: 'hidden',
				}}
			>
				{helper}
			</Typography>
		</Stack>
	);

	return (
		<Paper
			elevation={0}
			sx={{
				borderRadius: 4,
				border: (theme) => `1px solid ${theme.palette.employeeSurface.borderSoft}`,
				boxShadow: (theme) => theme.palette.employeeSurface.shadowSoft,
				backgroundColor: (theme) => theme.palette.employeeSurface.card,
				overflow: 'hidden',
			}}
		>
			{onClick ? (
				<CardActionArea
					onClick={onClick}
					sx={{
						display: 'block',
						'&:active': {
							transform: 'scale(0.995)',
						},
					}}
				>
					{content}
				</CardActionArea>
			) : (
				content
			)}
		</Paper>
	);
}

function ActivityCard({ title, subtitle, description, meta, icon, accent = '#2F74BC' }) {
	return (
		<Paper
			elevation={0}
			sx={{
				p: 1.5,
				borderRadius: 4,
				border: (theme) => `1px solid ${theme.palette.employeeSurface.borderSoft}`,
				backgroundColor: (theme) => theme.palette.employeeSurface.card,
			}}
		>
			<Stack direction="row" spacing={1.5} alignItems="flex-start">
				<Avatar
					variant="rounded"
					sx={{
						width: 40,
						height: 40,
						bgcolor: alpha(accent, 0.1),
						color: accent,
						borderRadius: 3,
						flexShrink: 0,
					}}
				>
					{icon}
				</Avatar>
				<Stack spacing={0.5} sx={{ minWidth: 0, flex: 1 }}>
					<Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
						<Box sx={{ minWidth: 0 }}>
							<Typography variant="subtitle2" sx={{ color: 'text.primary', fontWeight: 700 }}>
								{title}
							</Typography>
							<Typography variant="caption" color="text.secondary">
								{subtitle}
							</Typography>
						</Box>
						{meta ? (
							<Typography
								variant="caption"
								color="text.secondary"
								sx={{ textAlign: 'right', flexShrink: 0 }}
							>
								{meta}
							</Typography>
						) : null}
					</Stack>
					<Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.45 }}>
						{description}
					</Typography>
				</Stack>
			</Stack>
		</Paper>
	);
}

function QuickMenuCard({ item, onClick }) {
	return (
		<Paper
			elevation={0}
			sx={{
				borderRadius: 4,
				overflow: 'hidden',
				border: (theme) => `1px solid ${theme.palette.employeeSurface.borderSoft}`,
				backgroundColor: (theme) => theme.palette.employeeSurface.card,
				boxShadow: (theme) => theme.palette.employeeSurface.shadowSoft,
			}}
		>
			<CardActionArea
				onClick={onClick}
				sx={{
					height: '100%',
					p: 0,
					'&:active': {
						transform: 'scale(0.995)',
					},
				}}
			>
				<Stack spacing={1.25} sx={{ p: 1.75, minHeight: 118 }}>
					<Avatar
						variant="rounded"
						sx={{
							width: 48,
							height: 48,
							borderRadius: 3.5,
							bgcolor: item.tint,
							color: item.accent,
						}}
					>
						{item.icon}
					</Avatar>
					<Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
						<Box sx={{ minWidth: 0 }}>
							<Typography variant="subtitle2" sx={{ color: 'text.primary', fontWeight: 700 }}>
								{item.title}
							</Typography>
							<Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
								{item.description}
							</Typography>
						</Box>
						<ArrowForwardIosRoundedIcon sx={{ fontSize: 15, color: 'text.secondary', mt: 0.25 }} />
					</Stack>
				</Stack>
			</CardActionArea>
		</Paper>
	);
}

function InfoRow({ icon, label, value }) {
	return (
		<Paper
			elevation={0}
			sx={{
				p: 1.25,
				borderRadius: 3.5,
				border: (theme) => `1px solid ${theme.palette.employeeSurface.borderSoft}`,
				backgroundColor: (theme) => theme.palette.employeeSurface.muted,
			}}
		>
			<Stack direction="row" spacing={1} alignItems="flex-start">
				<Avatar
					variant="rounded"
					sx={{
						width: 30,
						height: 30,
						bgcolor: (theme) =>
							alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.08),
						color: '#356FA8',
						borderRadius: 2.25,
						flexShrink: 0,
					}}
				>
					{icon}
				</Avatar>
				<Box sx={{ minWidth: 0, pt: 0.125 }}>
					<Typography
						variant="caption"
						sx={{
							display: 'block',
							color: 'text.secondary',
							letterSpacing: '0.1em',
							fontSize: '0.58rem',
							lineHeight: 1.3,
						}}
					>
						{label}
					</Typography>
					<Typography
						sx={{
							color: 'text.primary',
							fontWeight: 700,
							fontSize: '0.84rem',
							lineHeight: 1.35,
							wordBreak: 'break-word',
						}}
					>
						{value || '-'}
					</Typography>
				</Box>
			</Stack>
		</Paper>
	);
}

function EmployeeDashboardPage() {
	const navigate = useNavigate();
	const { enqueueSnackbar } = useSnackbar();
	const { logout } = useEmployeeAuth();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [data, setData] = useState(null);

	const loadDashboard = async () => {
		setLoading(true);
		setError('');

		try {
			const response = await employeeMeRequest('/dashboard');
			setData(response);
		} catch (requestError) {
			if (
				handleEmployeeUnauthorized({
					error: requestError,
					logout,
					navigate,
					enqueueSnackbar,
				})
			) {
				return;
			}

			setError(getEmployeePortalErrorMessage(requestError));
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadDashboard();
	}, []);

	if (loading) {
		return <FeedbackState loading />;
	}

	if (error) {
		return (
			<FeedbackState
				type="error"
				title="Data dashboard belum bisa dimuat."
				description={error}
				actionLabel="Coba Lagi"
				onAction={loadDashboard}
			/>
		);
	}

	const profile = data?.profile;
	const activeLeaveProcess = data?.summary?.activeLeaveProcess;
	const recentActivities = [
		...(data?.recentGuidanceRecords || []).slice(0, 2).map((item) => ({
			id: `guidance-${item.id}`,
			title: item.categoryLabel,
			subtitle: `${formatLongDate(item.meetingDate)}${item.meetingTime ? ` | ${item.meetingTime}` : ''}`,
			description: item.problemFaced,
			meta: item.location || '',
			icon: <DescriptionOutlinedIcon fontSize="small" />,
			accent: '#356FA8',
		})),
		...(data?.recentWarningLetters || []).slice(0, 2).map((item) => ({
			id: `warning-${item.id}`,
			title: getDisciplineDocumentTitle(item.category, item.warningLevel),
			subtitle: formatLongDate(item.letterDate),
			description: item.violation,
			meta: item.letterNumber || '',
			icon: <WarningAmberRoundedIcon fontSize="small" />,
			accent: '#C67A1B',
		})),
	].slice(0, 3);

	return (
		<Stack spacing={2}>
			<Paper
				elevation={0}
				sx={{
					position: 'relative',
					overflow: 'hidden',
					p: 2.5,
					borderRadius: 6,
					border: (theme) => `1px solid ${alpha('#FFFFFF', theme.palette.mode === 'dark' ? 0.1 : 0.16)}`,
					boxShadow: (theme) => theme.palette.employeeSurface.shadowFloating,
					background: (theme) => theme.palette.employeeSurface.heroGradient,
					color: '#FFFFFF',
					'&::before': {
						content: '""',
						position: 'absolute',
						inset: 0,
						background:
							'radial-gradient(circle at top right, rgba(255,255,255,0.16), transparent 28%), radial-gradient(circle at bottom left, rgba(255,255,255,0.08), transparent 32%)',
					},
				}}
			>
				<Stack spacing={2} sx={{ position: 'relative', zIndex: 1 }}>
					<Stack spacing={1.25}>
						<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
							<Chip
								label={profile?.employmentTypeLabel || 'Karyawan'}
								size="small"
								sx={{ bgcolor: 'rgba(255,255,255,0.16)', color: '#FFFFFF', fontWeight: 600 }}
							/>
							{profile?.gradeLabel ? (
								<Chip
									label={profile.gradeLabel}
									size="small"
									sx={{ bgcolor: 'rgba(255,255,255,0.16)', color: '#FFFFFF', fontWeight: 600 }}
								/>
							) : null}
						</Stack>
						<Typography
							variant="h4"
							sx={{
								color: '#FFFFFF',
								fontWeight: 800,
								lineHeight: 1.15,
								fontSize: 'clamp(1.7rem, 5.8vw, 2.2rem)',
								wordBreak: 'break-word',
							}}
						>
							{profile?.fullName || '-'}
						</Typography>
						<Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
							NIK {profile?.employeeNo || '-'}
						</Typography>
					</Stack>

					<Stack spacing={1}>
						<Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
							{profile?.departmentName || '-'} | {profile?.jobRoleName || '-'}
						</Typography>
					</Stack>

					<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
						<Chip
							label={profile?.siteDiv || '-'}
							size="small"
							sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: '#FFFFFF' }}
						/>
						<Chip
							label={profile?.workLocationName || '-'}
							size="small"
							sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: '#FFFFFF' }}
						/>
					</Stack>
				</Stack>
			</Paper>

			<InstallAppCard />

			<Paper
				elevation={0}
				sx={{
					p: 2,
					borderRadius: 5,
					backgroundColor: (theme) => theme.palette.employeeSurface.soft,
					border: (theme) => `1px solid ${theme.palette.employeeSurface.borderSoft}`,
					boxShadow: (theme) => theme.palette.employeeSurface.shadowSoft,
					backdropFilter: 'blur(10px)',
				}}
			>
				<Stack spacing={1.5}>
					<Box>
						<Typography variant="caption" sx={{ color: 'text.secondary', letterSpacing: '0.12em' }}>
							QUICK STATUS
						</Typography>
					</Box>
					<Stack spacing={1}>
						{activeLeaveProcess ? (
							<SummaryCard
								label={activeLeaveProcess.title}
								value={activeLeaveProcess.statusLabel}
								helper={`${activeLeaveProcess.requestNumber} • ${activeLeaveProcess.description}`}
								icon={
									activeLeaveProcess.isActionRequired ? (
										<AssignmentTurnedInRoundedIcon fontSize="small" />
									) : (
										<AccessTimeRoundedIcon fontSize="small" />
									)
								}
								accent={activeLeaveProcess.isActionRequired ? '#356FA8' : '#2F74BC'}
								badgeLabel={
									activeLeaveProcess.totalActiveCount > 1
										? `${activeLeaveProcess.totalActiveCount} aktif`
										: activeLeaveProcess.roleLabel
								}
								onClick={() => navigate(activeLeaveProcess.targetPath)}
							/>
						) : null}
						<SummaryCard
							label="Pengajuan Cuti"
							value={`${data?.summary?.leaveRequestCount ?? 0} Request`}
							helper="Lihat status pengajuan cuti Anda"
							icon={<CalendarMonthOutlinedIcon fontSize="small" />}
							accent="#2F74BC"
						/>
						<SummaryCard
							label="Bimbingan"
							value={`${data?.summary?.guidanceCount ?? 0} Catatan`}
							helper="Riwayat bimbingan dan pengarahan"
							icon={<AssignmentTurnedInRoundedIcon fontSize="small" />}
							accent="#356FA8"
						/>
						{(data?.summary?.warningLetterCount ?? 0) > 0 ? (
							<SummaryCard
								label="Peringatan"
								value={`${data?.summary?.warningLetterCount ?? 0} Dokumen`}
								helper="Riwayat surat peringatan/teguran"
								icon={<WarningAmberRoundedIcon fontSize="small" />}
								accent="#C67A1B"
							/>
						) : null}
					</Stack>
				</Stack>
			</Paper>

			<Paper
				elevation={0}
				sx={{
					p: 2,
					borderRadius: 5,
					background: (theme) => theme.palette.employeeSurface.cardGradient,
					border: (theme) => `1px solid ${theme.palette.employeeSurface.borderSoft}`,
					boxShadow: (theme) => theme.palette.employeeSurface.shadowSoft,
				}}
			>
				<Stack spacing={1.5}>
					<Box>
						<Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 800 }}>
							Quick Menu
						</Typography>
					</Box>
					<Box
						sx={{
							display: 'grid',
							gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
							gap: 1.25,
						}}
					>
						{QUICK_MENU_ITEMS.map((item) => (
							<QuickMenuCard key={item.path} item={item} onClick={() => navigate(item.path)} />
						))}
					</Box>
				</Stack>
			</Paper>

			<Paper
				elevation={0}
				sx={{
					p: 2.5,
					borderRadius: 5,
					border: (theme) => `1px solid ${theme.palette.employeeSurface.borderSoft}`,
					boxShadow: (theme) => theme.palette.employeeSurface.shadowSoft,
					backgroundColor: (theme) => theme.palette.employeeSurface.card,
				}}
			>
				<Stack spacing={2}>
					<Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
						<Box>
							<Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 700 }}>
								Informasi Karyawan
							</Typography>
						</Box>
					</Stack>
					<Box
						sx={{
							display: 'grid',
							gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
							gap: 1.1,
						}}
					>
						<InfoRow
							icon={<ApartmentRoundedIcon fontSize="small" />}
							label="DEPARTMENT"
							value={profile?.departmentName}
							fontSize="small"
						/>
						<InfoRow
							icon={<WorkOutlineRoundedIcon fontSize="small" />}
							label="POSISI"
							value={profile?.jobLevelName || profile?.jobRoleName}
							fontSize="small"
						/>
						<InfoRow
							icon={<PlaceOutlinedIcon fontSize="small" />}
							label="SITE / DIVISION"
							value={`${profile?.siteDiv || '-'}${
								profile?.workLocationName ? ` | ${profile.workLocationName}` : ''
							}`}
						/>
						<InfoRow
							icon={<AccessTimeRoundedIcon fontSize="small" />}
							label="JOIN DATE"
							value={`${formatLongDate(profile?.joinDate)}${
								profile?.lengthOfService ? ` | ${profile.lengthOfService}` : ''
							}`}
						/>
						<InfoRow
							icon={<PhoneOutlinedIcon fontSize="small" />}
							label="NO TELEPON"
							value={profile?.phoneNumber}
						/>
						<InfoRow icon={<EmailOutlinedIcon fontSize="small" />} label="EMAIL" value={profile?.email} />
					</Box>
				</Stack>
			</Paper>

			<Paper
				elevation={0}
				sx={{
					p: 2.5,
					borderRadius: 5,
					border: (theme) => `1px solid ${theme.palette.employeeSurface.borderSoft}`,
					boxShadow: (theme) => theme.palette.employeeSurface.shadowSoft,
					backgroundColor: (theme) => theme.palette.employeeSurface.card,
				}}
			>
				<Stack spacing={1.5}>
					<Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 700 }}>
						Aktivitas Terbaru
					</Typography>
					<Stack spacing={1.25}>
						{recentActivities.length ? (
							recentActivities.map((item) => (
								<ActivityCard
									key={item.id}
									title={item.title}
									subtitle={item.subtitle}
									description={item.description}
									meta={item.meta}
									icon={item.icon}
									accent={item.accent}
								/>
							))
						) : (
							<Typography variant="body2" color="text.secondary">
								Belum ada aktivitas terbaru yang perlu ditampilkan.
							</Typography>
						)}
					</Stack>
				</Stack>
			</Paper>
		</Stack>
	);
}

export default EmployeeDashboardPage;
