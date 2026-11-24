import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import Chart from 'react-apexcharts';

import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import TimelineRoundedIcon from '@mui/icons-material/TimelineRounded';

import { chartAxisLabel, chartBaseOptions, areaFill } from '../chartTheme';
import { DRILL_DOWN, formatKg, formatNumber, percentOf } from '../constants';
import { useReducedMotion } from '../motion';
import ChartCard from './chartCard';
import { SectionCard, SectionLink } from './sectionCard';

const B3_SERIES = {
	in: { key: 'in', label: 'Limbah masuk', color: 'warning' },
	out: { key: 'out', label: 'Limbah keluar', color: 'success' },
};

/** In/out waste trend with a chart type switch. */
function B3TrendCard({ trend = [], delay = 0 }) {
	const theme = useTheme();
	const reducedMotion = useReducedMotion();
	const [chartType, setChartType] = useState('area');
	const [activeSeries, setActiveSeries] = useState(['in', 'out']);

	const labels = trend.map((item) => item.bulan);
	const allSeries = {
		in: { name: B3_SERIES.in.label, data: trend.map((item) => item.masuk) },
		out: { name: B3_SERIES.out.label, data: trend.map((item) => item.keluar) },
	};
	const visibleKeys = activeSeries.length > 0 ? activeSeries : ['in'];
	const series = visibleKeys.map((key) => allSeries[key]);
	const colors = visibleKeys.map((key) => theme.palette[B3_SERIES[key].color].main);

	const options = useMemo(() => {
		const base = chartBaseOptions(theme, { reducedMotion });
		const axisLabel = chartAxisLabel(theme);

		return {
			...base,
			colors,
			stroke: { curve: 'smooth', width: chartType === 'bar' ? 0 : 2.5 },
			plotOptions: {
				bar: { columnWidth: '42%', borderRadius: 4, borderRadiusApplication: 'end' },
			},
			markers: { size: chartType === 'bar' ? 0 : 3, strokeWidth: 2 },
			fill: chartType === 'area' ? areaFill() : { type: 'solid', opacity: 1 },
			xaxis: {
				categories: labels,
				axisBorder: { show: false },
				axisTicks: { show: false },
				labels: { style: axisLabel.style },
				tooltip: { enabled: false },
			},
			yaxis: {
				labels: {
					style: axisLabel.style,
					formatter: (value) => formatNumber(Math.round(value)),
				},
				forceNiceScale: true,
			},
			tooltip: { ...base.tooltip, y: { formatter: (value) => formatKg(value) } },
			grid: { ...base.grid, padding: { left: 4, right: 12, top: 4, bottom: 0 } },
			legend: { show: false },
		};
	}, [chartType, colors, labels, reducedMotion, theme]);

	return (
		<ChartCard
			title="Aliran limbah B3"
			subtitle="Perbandingan volume limbah masuk dan keluar TPS"
			delay={delay}
			isEmpty={labels.length === 0}
			emptyTitle="Belum ada pencatatan limbah B3"
			emptyDescription="Catat limbah masuk dan keluar untuk melihat tren alirannya."
			footer={<SectionLink href={DRILL_DOWN.b3} label="Buka pencatatan limbah B3" />}
			actions={
				<ToggleButtonGroup
					size="small"
					exclusive
					value={chartType}
					onChange={(event, next) => next && setChartType(next)}
					aria-label="Tipe grafik limbah B3"
				>
					<ToggleButton value="area" aria-label="Area" sx={{ px: 1, py: 0.5 }}>
						<TimelineRoundedIcon fontSize="small" />
					</ToggleButton>
					<ToggleButton value="bar" aria-label="Batang" sx={{ px: 1, py: 0.5 }}>
						<BarChartRoundedIcon fontSize="small" />
					</ToggleButton>
				</ToggleButtonGroup>
			}
		>
			<Stack direction="row" sx={{ px: 1, mb: 1 }}>
				<ToggleButtonGroup
					size="small"
					value={activeSeries}
					onChange={(event, next) => setActiveSeries(next.length > 0 ? next : activeSeries)}
					aria-label="Deret limbah B3"
				>
					{Object.values(B3_SERIES).map((meta) => (
						<ToggleButton
							key={meta.key}
							value={meta.key}
							sx={{ gap: 0.75, px: 1.25, py: 0.4, textTransform: 'none', fontSize: 12, fontWeight: 600 }}
						>
							<Box
								sx={{
									width: 8,
									height: 8,
									borderRadius: '50%',
									bgcolor: `${meta.color}.main`,
									opacity: activeSeries.includes(meta.key) ? 1 : 0.35,
								}}
							/>
							{meta.label}
						</ToggleButton>
					))}
				</ToggleButtonGroup>
			</Stack>

			<Chart type={chartType} height={260} options={options} series={series} />
		</ChartCard>
	);
}

/** Bordered count tile used inside the B3 balance card. */
function MiniStat({ label, value, caption, tone = 'text.primary' }) {
	return (
		<Box
			sx={{
				flex: 1,
				minWidth: 0,
				px: 1.5,
				py: 1.25,
				border: 1,
				borderColor: 'divider',
				borderRadius: 1.5,
			}}
		>
			<Typography variant="caption" color="text.secondary" fontWeight={600} display="block" noWrap>
				{label}
			</Typography>
			<Stack direction="row" alignItems="baseline" spacing={0.5}>
				<Typography variant="h6" fontWeight={800} sx={{ fontVariantNumeric: 'tabular-nums', color: tone }}>
					{value}
				</Typography>
				{caption ? (
					<Typography variant="caption" color="text.secondary" noWrap>
						{caption}
					</Typography>
				) : null}
			</Stack>
		</Box>
	);
}

/** Human wording for a deadline that is a number of days away (negative = past). */
function formatRemainingDays(sisaHari) {
	if (sisaHari < 0) {
		return `Lewat ${Math.abs(sisaHari)} hari`;
	}

	if (sisaHari === 0) {
		return 'Berakhir hari ini';
	}

	return `${sisaHari} hari lagi`;
}

/** Chip tone for a storage deadline: past = error, within two weeks = warning. */
function deadlineColor(sisaHari) {
	if (sisaHari === undefined || sisaHari === null) {
		return 'default';
	}

	if (sisaHari < 0) {
		return 'error';
	}

	return sisaHari <= 14 ? 'warning' : 'success';
}

function StatBlock({ label, value, tone = 'text.primary' }) {
	return (
		<Box sx={{ flex: 1, minWidth: 0 }}>
			<Typography variant="caption" color="text.secondary" fontWeight={600} noWrap display="block">
				{label}
			</Typography>
			<Typography variant="subtitle1" fontWeight={800} color={tone} sx={{ fontVariantNumeric: 'tabular-nums' }}>
				{value}
			</Typography>
		</Box>
	);
}

/** Snapshot of the B3 waste balance plus overdue / near-deadline counts. */
function B3SummaryCard({ b3Waste, delay = 0 }) {
	const theme = useTheme();
	const {
		totalMasuk = 0,
		totalKeluar = 0,
		sisaDiTps = 0,
		overdueCount = 0,
		warningCount = 0,
		nearestDeadline = null,
	} = b3Waste || {};
	const managedPct = percentOf(totalKeluar, totalMasuk);
	const hasIssue = overdueCount > 0 || warningCount > 0;
	const deadlineText = nearestDeadline ? formatRemainingDays(nearestDeadline.sisaHari) : null;
	const deadlineTone = deadlineColor(nearestDeadline?.sisaHari);

	return (
		<SectionCard
			title="Neraca limbah B3"
			subtitle="Akumulasi seluruh pencatatan"
			delay={delay}
			contentSx={{ display: 'flex', flexDirection: 'column' }}
			footer={<SectionLink href={DRILL_DOWN.b3} label="Lihat neraca & pencatatan" />}
		>
			<Stack spacing={2.25} sx={{ flexGrow: 1, justifyContent: 'space-between' }}>
				<Stack direction="row" spacing={2} divider={<Box sx={{ borderLeft: 1, borderColor: 'divider' }} />}>
					<StatBlock label="Masuk" value={formatKg(totalMasuk)} />
					<StatBlock label="Keluar" value={formatKg(totalKeluar)} tone="success.main" />
					<StatBlock label="Sisa di TPS" value={formatKg(sisaDiTps)} tone="warning.main" />
				</Stack>

				<Box>
					<Stack direction="row" justifyContent="space-between" mb={0.75}>
						<Typography variant="caption" color="text.secondary" fontWeight={600}>
							Terkelola dari total limbah masuk
						</Typography>
						<Typography variant="caption" fontWeight={700}>
							{managedPct}%
						</Typography>
					</Stack>
					<Stack
						direction="row"
						sx={{ height: 8, borderRadius: 4, overflow: 'hidden', bgcolor: 'action.hover' }}
					>
						<Box sx={{ width: `${managedPct}%`, bgcolor: 'success.main' }} />
					</Stack>
				</Box>

				{nearestDeadline ? (
					<Stack
						direction="row"
						alignItems="center"
						justifyContent="space-between"
						gap={1}
						sx={{ px: 1.5, py: 1.25, borderRadius: 1.5, bgcolor: 'action.hover' }}
					>
						<Box sx={{ minWidth: 0 }}>
							<Typography
								variant="caption"
								color="text.secondary"
								fontWeight={600}
								display="block"
								noWrap
							>
								Batas penyimpanan terdekat
							</Typography>
							<Typography variant="body2" fontWeight={600} noWrap>
								{nearestDeadline.jenisLimbah || 'Limbah B3'} · {formatKg(nearestDeadline.sisaKg)}
							</Typography>
						</Box>
						<Chip
							size="small"
							color={deadlineTone}
							label={deadlineText}
							sx={{ fontWeight: 700, flexShrink: 0 }}
						/>
					</Stack>
				) : null}

				<Stack direction="row" spacing={1.5}>
					<MiniStat
						label="Melewati batas"
						value={overdueCount}
						caption={overdueCount > 0 ? 'perlu segera keluar' : 'aman'}
						tone={overdueCount > 0 ? 'error.main' : 'success.main'}
					/>
					<MiniStat
						label="Mendekati batas"
						value={warningCount}
						caption="≤ 14 hari"
						tone={warningCount > 0 ? 'warning.main' : 'success.main'}
					/>
				</Stack>

				<Box
					sx={{
						p: 1.5,
						borderRadius: 1.5,
						bgcolor: alpha(hasIssue ? theme.palette.warning.main : theme.palette.success.main, 0.1),
					}}
				>
					<Stack direction="row" spacing={1} alignItems="center">
						{hasIssue ? (
							<ReportProblemOutlinedIcon fontSize="small" sx={{ color: 'warning.main' }} />
						) : (
							<CheckCircleOutlineIcon fontSize="small" sx={{ color: 'success.main' }} />
						)}
						<Typography variant="body2" fontWeight={700} sx={{ minWidth: 0 }}>
							{hasIssue
								? 'Ada limbah yang perlu ditindaklanjuti'
								: 'Semua limbah dalam batas penyimpanan'}
						</Typography>
					</Stack>
				</Box>
			</Stack>
		</SectionCard>
	);
}

export { B3TrendCard, B3SummaryCard };
