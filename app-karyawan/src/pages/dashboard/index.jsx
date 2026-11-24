import { useEffect, useMemo, useState } from 'react';
import { useSnackbar } from 'notistack';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import AssignmentIndOutlinedIcon from '@mui/icons-material/AssignmentIndOutlined';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import SyncRoundedIcon from '@mui/icons-material/SyncRounded';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';

import PageHeader from '@/components/pageHeader';
import { useSite } from '@/contexts/siteContext';

import KpiTile from './components/kpiTile';
import LicenseAlerts from './components/licenseAlerts';
import ApprovalQueue from './components/approvalQueue';
import LeaveTrendCard from './components/leaveTrendCard';
import {
	DepartmentDistributionCard,
	JobLevelDistributionCard,
	SiteDistributionCard,
} from './components/compositionCards';
import { B3SummaryCard, B3TrendCard } from './components/b3Cards';
import RecentLeaveTable from './components/recentLeaveTable';
import DashboardSkeleton from './components/dashboardSkeleton';
import useDashboardData from './useDashboardData';
import { DEFAULT_PERIOD, DRILL_DOWN, PERIOD_OPTIONS, formatNumber, formatTime } from './constants';

/** Wording + tone for the B3 tile, driven by storage-deadline issues. */
function describeB3State(overdue, warning) {
	if (overdue > 0) {
		return { helper: `${overdue} melewati batas simpan`, tone: 'error.main' };
	}

	if (warning > 0) {
		return { helper: `${warning} mendekati batas simpan`, tone: 'warning.main' };
	}

	return { helper: 'Semua limbah dalam batas simpan', tone: 'success.main' };
}

function DashboardPage() {
	const { enqueueSnackbar } = useSnackbar();
	const { isSuperAdmin, selectedSiteId, siteName } = useSite();
	const [period, setPeriod] = useState(DEFAULT_PERIOD);

	const { data, loading, refreshing, error, refresh } = useDashboardData({
		siteId: isSuperAdmin ? selectedSiteId : null,
		period,
	});

	useEffect(() => {
		if (error) {
			enqueueSnackbar(error.message || 'Gagal memuat data dashboard.', { variant: 'error' });
		}
	}, [enqueueSnackbar, error]);

	const summary = data?.summary || {};
	const charts = data?.charts || {};
	const tables = data?.tables || {};
	const b3Waste = data?.b3Waste;
	const meta = data?.meta;

	const periodLabel = meta?.period?.label || PERIOD_OPTIONS.find((option) => option.value === period)?.label || '';
	const scopeLabel =
		meta?.scope && !meta.scope.isAllSites ? meta.scope.siteName || siteName || 'Site terpilih' : 'Semua site';

	const showSiteChart = Boolean(meta?.scope?.isAllSites) && (charts.bySite?.length || 0) > 1;
	const hasB3Data = Boolean(
		b3Waste &&
			(b3Waste.totalMasuk > 0 ||
				b3Waste.totalKeluar > 0 ||
				(b3Waste.trendBulanan || []).some((row) => row.masuk > 0 || row.keluar > 0)),
	);

	const b3Overdue = b3Waste?.overdueCount || 0;
	const b3Warning = b3Waste?.warningCount || 0;

	const kpiTiles = useMemo(() => {
		const b3State = describeB3State(b3Overdue, b3Warning);

		return [
			{
				key: 'employees',
				icon: PeopleOutlinedIcon,
				label: 'Total karyawan',
				value: summary.totalEmployees || 0,
				tone: 'primary',
				href: DRILL_DOWN.employees,
				helper:
					summary.newHiresInPeriod > 0
						? `+${formatNumber(summary.newHiresInPeriod)} masuk ${periodLabel.toLowerCase()}`
						: 'Tidak ada penambahan pada periode ini',
				helperTone: summary.newHiresInPeriod > 0 ? 'success.main' : 'text.secondary',
			},
			{
				key: 'contract',
				icon: AssignmentIndOutlinedIcon,
				label: 'Kontrak aktif',
				value: summary.contractCount || 0,
				tone: 'secondary',
				href: DRILL_DOWN.employees,
				helper: `${
					summary.totalEmployees > 0
						? Math.round(((summary.contractCount || 0) / summary.totalEmployees) * 100)
						: 0
				}% dari total karyawan`,
				helperTone: 'text.secondary',
			},
			{
				key: 'leaves',
				icon: EventNoteOutlinedIcon,
				label: 'Cuti menunggu',
				value: summary.activeLeaveRequests || 0,
				tone: summary.activeLeaveRequests > 0 ? 'warning' : 'success',
				href: DRILL_DOWN.leaves,
				helper:
					summary.activeLeaveRequests > 0
						? `${formatNumber(summary.submittedLeaveRequests)} diajukan · ${formatNumber(
								summary.inApprovalLeaveRequests,
						  )} dalam approval`
						: `${formatNumber(summary.leaveRequestsInPeriod)} pengajuan pada periode ini`,
				helperTone: 'text.secondary',
			},
			{
				key: 'licenses',
				icon: WarningAmberOutlinedIcon,
				label: 'Lisensi expired',
				value: summary.expiredLicenses || 0,
				tone: summary.expiredLicenses > 0 ? 'error' : 'success',
				href: DRILL_DOWN.licenses,
				helper:
					summary.expiringSoonLicenses > 0
						? `${formatNumber(summary.expiringSoonLicenses)} berakhir dalam ${
								meta?.licenseSoonDays ?? 25
						  } hari`
						: 'Tidak ada lisensi mendekati kedaluwarsa',
				helperTone: summary.expiringSoonLicenses > 0 ? 'warning.main' : 'text.secondary',
			},
			{
				key: 'b3',
				icon: ScienceOutlinedIcon,
				label: 'Sisa limbah B3',
				value: Math.round(b3Waste?.sisaDiTps || 0),
				suffix: 'kg',
				tone: 'info',
				href: DRILL_DOWN.b3,
				helper: b3State.helper,
				helperTone: b3State.tone,
			},
			{
				key: 'sites',
				icon: BusinessOutlinedIcon,
				label: 'Site aktif',
				value: summary.siteCount || 0,
				tone: 'success',
				href: DRILL_DOWN.sites,
				helper: `${formatNumber(charts.byDepartment?.length)} departemen · ${formatNumber(
					charts.byJobLevel?.length,
				)} job level`,
				helperTone: 'text.secondary',
			},
		];
	}, [
		b3Overdue,
		b3Warning,
		b3Waste,
		charts.byDepartment,
		charts.byJobLevel,
		periodLabel,
		summary,
		meta?.licenseSoonDays,
	]);

	if (loading && !data) {
		return (
			<>
				<PageHeader title="Dashboard" />
				<DashboardSkeleton />
			</>
		);
	}

	if (!data) {
		return (
			<>
				<PageHeader title="Dashboard" />
				<Alert
					severity="error"
					action={
						<Button color="inherit" size="small" onClick={refresh}>
							Coba lagi
						</Button>
					}
				>
					Data dashboard tidak dapat dimuat. Periksa koneksi lalu coba lagi.
				</Alert>
			</>
		);
	}

	return (
		<>
			<PageHeader title="Dashboard">
				<Stack direction="row" alignItems="center" flexWrap="wrap" textTransform="none" sx={{ gap: 1 }}>
					<FormControl size="small" sx={{ minWidth: 138 }}>
						<Select
							value={period}
							onChange={(event) => setPeriod(event.target.value)}
							inputProps={{ 'aria-label': 'Pilih periode tren' }}
							startAdornment={
								<CalendarMonthOutlinedIcon fontSize="small" sx={{ mr: 0.5, color: 'primary.main' }} />
							}
							sx={{
								fontSize: '0.82rem',
								height: 40,
								'& .MuiSelect-select': { py: 0.75 },
								'& .MuiOutlinedInput-notchedOutline': { borderColor: 'border' },
							}}
						>
							{PERIOD_OPTIONS.map((option) => (
								<MenuItem key={option.value} value={option.value}>
									<Typography variant="body2">{option.label}</Typography>
								</MenuItem>
							))}
						</Select>
					</FormControl>
					<Tooltip title="Muat ulang data (otomatis setiap 5 menit)">
						<span>
							<IconButton
								size="small"
								onClick={refresh}
								disabled={refreshing}
								aria-label="Muat ulang data dashboard"
								sx={{ border: 1, borderColor: 'border', borderRadius: 1.5, width: 40, height: 40 }}
							>
								<SyncRoundedIcon
									fontSize="small"
									sx={{
										'@keyframes dashboardSpin': {
											from: { transform: 'rotate(0deg)' },
											to: { transform: 'rotate(360deg)' },
										},
										animation: refreshing ? 'dashboardSpin 900ms linear infinite' : 'none',
										'@media (prefers-reduced-motion: reduce)': { animation: 'none' },
									}}
								/>
							</IconButton>
						</span>
					</Tooltip>
				</Stack>
			</PageHeader>

			<Stack spacing={2.5} sx={{ pb: 4 }}>
				<Stack direction="row" alignItems="center" flexWrap="wrap" sx={{ gap: 1 }}>
					<Chip size="small" variant="outlined" icon={<PlaceOutlinedIcon />} label={scopeLabel} />
					<Typography variant="caption" color="text.secondary">
						{periodLabel} · diperbarui {formatTime(meta?.generatedAt)} · angkanya mengikuti site aktif dan
						disegarkan otomatis setiap 5 menit.
					</Typography>
				</Stack>

				<Grid container spacing={2}>
					{kpiTiles.map((tile, index) => (
						<Grid item xs={6} sm={6} md={4} lg={2} key={tile.key}>
							<KpiTile {...tile} delay={index * 45} />
						</Grid>
					))}
				</Grid>

				<Grid container spacing={2}>
					<Grid item xs={12} lg={7}>
						<LicenseAlerts
							alerts={tables.licenseAlerts}
							summary={summary}
							soonDays={meta?.licenseSoonDays ?? 25}
							delay={240}
						/>
					</Grid>
					<Grid item xs={12} lg={5}>
						<ApprovalQueue
							pendingLeaves={tables.pendingLeaves}
							recentLeaves={tables.recentLeaves}
							summary={summary}
							periodLabel={periodLabel}
							delay={285}
						/>
					</Grid>
				</Grid>

				<Grid container spacing={2}>
					<Grid item xs={12} lg={7}>
						<LeaveTrendCard
							monthlyLeaveTrend={charts.monthlyLeaveTrend}
							hiresTrend={charts.hiresTrend}
							periodLabel={periodLabel}
							delay={330}
						/>
					</Grid>
					<Grid item xs={12} lg={5}>
						<DepartmentDistributionCard
							byDepartment={charts.byDepartment}
							totalEmployees={summary.totalEmployees}
							delay={375}
						/>
					</Grid>
				</Grid>

				<Grid container spacing={2}>
					<Grid item xs={12} lg={showSiteChart ? 5 : 6}>
						<JobLevelDistributionCard
							byJobLevel={charts.byJobLevel}
							byEmploymentType={charts.byEmploymentType}
							totalEmployees={summary.totalEmployees}
							delay={420}
						/>
					</Grid>
					{showSiteChart ? (
						<Grid item xs={12} lg={3}>
							<SiteDistributionCard
								bySite={charts.bySite}
								totalEmployees={summary.totalEmployees}
								delay={465}
							/>
						</Grid>
					) : null}
					<Grid item xs={12} lg={showSiteChart ? 4 : 6}>
						<RecentLeaveTable recentLeaves={tables.recentLeaves} delay={510} />
					</Grid>
				</Grid>

				{hasB3Data ? (
					<Grid container spacing={2}>
						<Grid item xs={12} lg={7}>
							<B3TrendCard trend={b3Waste.trendBulanan} delay={555} />
						</Grid>
						<Grid item xs={12} lg={5}>
							<B3SummaryCard b3Waste={b3Waste} delay={600} />
						</Grid>
					</Grid>
				) : null}
			</Stack>
		</>
	);
}

export default DashboardPage;
