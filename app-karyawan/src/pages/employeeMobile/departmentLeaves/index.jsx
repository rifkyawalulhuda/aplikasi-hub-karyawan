import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';

import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';

import FeedbackState from '@/components/employeePortal/feedbackState';
import { useEmployeeAuth } from '@/contexts/employeeAuthContext';
import { employeeMeRequest } from '@/services/employeeApi';
import { getEmployeePortalErrorMessage, handleEmployeeUnauthorized } from '@/utils/employeePortal';

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtDate(date) {
	if (!date) return '-';
	return new Date(date).toLocaleDateString('id-ID', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	});
}

function getInitials(name = '') {
	return name
		.split(' ')
		.slice(0, 2)
		.map((w) => w[0])
		.join('')
		.toUpperCase();
}

const STATUS_CONFIG = {
	IN_APPROVAL: {
		label: 'Proses Approval',
		color: 'warning',
		avatarBg: '#fef3c7',
		avatarColor: '#b45309',
	},
	APPROVED: {
		label: 'Sedang Cuti',
		color: 'success',
		avatarBg: '#dcfce7',
		avatarColor: '#15803d',
	},
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function FilterChip({ label, count, active, onClick }) {
	return (
		<Chip
			label={count !== undefined ? `${label} (${count})` : label}
			onClick={onClick}
			variant={active ? 'filled' : 'outlined'}
			color={active ? 'primary' : 'default'}
			size="small"
			sx={{ fontWeight: active ? 600 : 400 }}
		/>
	);
}

function LeaveCard({ item }) {
	const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.IN_APPROVAL;

	return (
		<Paper
			variant="outlined"
			sx={{
				p: 2,
				borderRadius: 3,
				display: 'flex',
				gap: 1.5,
				alignItems: 'flex-start',
				borderColor: 'divider',
			}}
		>
			{/* Avatar */}
			<Avatar
				sx={{
					width: 42,
					height: 42,
					bgcolor: cfg.avatarBg,
					color: cfg.avatarColor,
					fontWeight: 700,
					fontSize: 15,
					flexShrink: 0,
				}}
			>
				{getInitials(item.employeeName)}
			</Avatar>

			{/* Content */}
			<Box sx={{ flex: 1, minWidth: 0 }}>
				<Box
					sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, mb: 0.5 }}
				>
					<Typography
						variant="body2"
						fontWeight={600}
						sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}
					>
						{item.employeeName}
					</Typography>
					<Chip label={cfg.label} color={cfg.color} size="small" sx={{ flexShrink: 0, fontSize: 11 }} />
				</Box>

				<Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.75 }}>
					{item.employeeNo}
					{item.jobLevelName ? ` · ${item.jobLevelName}` : ''}
				</Typography>

				<Stack direction="row" spacing={1.5} flexWrap="wrap">
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
						<CalendarMonthOutlinedIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
						<Typography variant="caption" color="text.secondary">
							{fmtDate(item.periodStart)} – {fmtDate(item.periodEnd)}
						</Typography>
					</Box>
					<Typography variant="caption" color="text.secondary">
						{item.leaveDays} hari · {item.leaveType}
					</Typography>
				</Stack>
			</Box>
		</Paper>
	);
}

function SkeletonCard() {
	return (
		<Paper variant="outlined" sx={{ p: 2, borderRadius: 3, display: 'flex', gap: 1.5 }}>
			<Skeleton variant="circular" width={42} height={42} sx={{ flexShrink: 0 }} />
			<Box sx={{ flex: 1 }}>
				<Skeleton width="60%" height={18} sx={{ mb: 0.5 }} />
				<Skeleton width="40%" height={14} sx={{ mb: 1 }} />
				<Skeleton width="80%" height={14} />
			</Box>
		</Paper>
	);
}

// ─── Page ────────────────────────────────────────────────────────────────────

const FILTER_ALL = 'ALL';
const FILTER_IN_APPROVAL = 'IN_APPROVAL';
const FILTER_APPROVED = 'APPROVED';

export default function DepartmentLeavesPage() {
	const navigate = useNavigate();
	const { enqueueSnackbar } = useSnackbar();
	const { user } = useEmployeeAuth();

	const [leaves, setLeaves] = useState([]);
	const [loading, setLoading] = useState(true);
	const [filter, setFilter] = useState(FILTER_ALL);

	const departmentName = user?.departmentName || 'Departemen Saya';

	const fetchLeaves = useCallback(async () => {
		setLoading(true);
		try {
			const data = await employeeMeRequest('/department-leaves');
			setLeaves(Array.isArray(data) ? data : []);
		} catch (err) {
			if (handleEmployeeUnauthorized(err, navigate)) return;
			enqueueSnackbar(getEmployeePortalErrorMessage(err), { variant: 'error' });
		} finally {
			setLoading(false);
		}
	}, [navigate, enqueueSnackbar]);

	useEffect(() => {
		fetchLeaves();
	}, [fetchLeaves]);

	const filtered = filter === FILTER_ALL ? leaves : leaves.filter((l) => l.status === filter);

	const countAll = leaves.length;
	const countInApproval = leaves.filter((l) => l.status === FILTER_IN_APPROVAL).length;
	const countApproved = leaves.filter((l) => l.status === FILTER_APPROVED).length;

	return (
		<Box sx={{ minHeight: '100dvh', bgcolor: 'background.default' }}>
			{/* Header */}
			<Box
				sx={{
					position: 'sticky',
					top: 0,
					zIndex: 10,
					bgcolor: 'background.paper',
					borderBottom: 1,
					borderColor: 'divider',
					px: 2,
					py: 1.5,
					display: 'flex',
					alignItems: 'center',
					gap: 1,
				}}
			>
				<IconButton size="small" onClick={() => navigate(-1)} aria-label="Kembali">
					<ArrowBackIosNewRoundedIcon fontSize="small" />
				</IconButton>
				<Box sx={{ flex: 1, minWidth: 0 }}>
					<Typography variant="subtitle1" fontWeight={700} noWrap>
						Cuti Departemen
					</Typography>
					<Typography variant="caption" color="text.secondary" noWrap>
						{departmentName}
					</Typography>
				</Box>
				<PeopleOutlinedIcon sx={{ color: 'text.secondary', fontSize: 22 }} />
			</Box>

			<Box sx={{ px: 2, pt: 2, pb: 4 }}>
				{/* Filter chips */}
				{!loading && leaves.length > 0 && (
					<Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
						<FilterChip
							label="Semua"
							count={countAll}
							active={filter === FILTER_ALL}
							onClick={() => setFilter(FILTER_ALL)}
						/>
						{countInApproval > 0 && (
							<FilterChip
								label="Proses Approval"
								count={countInApproval}
								active={filter === FILTER_IN_APPROVAL}
								onClick={() => setFilter(FILTER_IN_APPROVAL)}
							/>
						)}
						{countApproved > 0 && (
							<FilterChip
								label="Sedang Cuti"
								count={countApproved}
								active={filter === FILTER_APPROVED}
								onClick={() => setFilter(FILTER_APPROVED)}
							/>
						)}
					</Stack>
				)}

				{/* Loading skeletons */}
				{loading && (
					<Stack spacing={1.5}>
						{[1, 2, 3].map((i) => (
							<SkeletonCard key={i} />
						))}
					</Stack>
				)}

				{/* Empty state */}
				{!loading && leaves.length === 0 && (
					<FeedbackState
						title="Tidak ada karyawan yang sedang cuti"
						description="Belum ada karyawan di departemen Anda yang sedang dalam proses pengajuan atau sedang cuti saat ini."
						icon={<CalendarMonthOutlinedIcon sx={{ fontSize: 48, color: 'text.disabled' }} />}
					/>
				)}

				{/* Filtered empty state */}
				{!loading && leaves.length > 0 && filtered.length === 0 && (
					<FeedbackState
						title="Tidak ada data"
						description="Tidak ada karyawan dengan status yang dipilih."
						icon={<CalendarMonthOutlinedIcon sx={{ fontSize: 48, color: 'text.disabled' }} />}
					/>
				)}

				{/* List */}
				{!loading && filtered.length > 0 && (
					<Stack spacing={1.5}>
						{filtered.map((item) => (
							<LeaveCard key={item.id} item={item} />
						))}
					</Stack>
				)}
			</Box>
		</Box>
	);
}
