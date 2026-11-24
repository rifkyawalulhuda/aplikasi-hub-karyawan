import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import Chart from 'react-apexcharts';

import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import ShowChartRoundedIcon from '@mui/icons-material/ShowChartRounded';
import TimelineRoundedIcon from '@mui/icons-material/TimelineRounded';

import { chartAxisLabel, chartBaseOptions, areaFill } from '../chartTheme';
import { useReducedMotion } from '../motion';
import { DRILL_DOWN, formatNumber } from '../constants';
import ChartCard from './chartCard';
import { SectionLink } from './sectionCard';

const SERIES_META = {
	leaves: { key: 'leaves', label: 'Pengajuan cuti', color: 'primary' },
	hires: { key: 'hires', label: 'Karyawan baru', color: 'success' },
};

const CHART_TYPES = [
	{ value: 'bar', label: 'Batang', icon: BarChartRoundedIcon },
	{ value: 'area', label: 'Area', icon: TimelineRoundedIcon },
	{ value: 'line', label: 'Garis', icon: ShowChartRoundedIcon },
];

function LeaveTrendCard({ monthlyLeaveTrend = [], hiresTrend = [], periodLabel, delay = 0 }) {
	const theme = useTheme();
	const reducedMotion = useReducedMotion();
	const [chartType, setChartType] = useState('bar');
	const [activeSeries, setActiveSeries] = useState(['leaves', 'hires']);

	const labels = monthlyLeaveTrend.map((item) => item.label);
	const totalLeaves = monthlyLeaveTrend.reduce((sum, item) => sum + item.count, 0);
	const totalHires = hiresTrend.reduce((sum, item) => sum + item.count, 0);

	const allSeries = {
		leaves: { name: SERIES_META.leaves.label, data: monthlyLeaveTrend.map((item) => item.count) },
		hires: { name: SERIES_META.hires.label, data: hiresTrend.map((item) => item.count) },
	};

	const visibleKeys = activeSeries.length > 0 ? activeSeries : ['leaves'];
	const series = visibleKeys.map((key) => allSeries[key]);
	const colors = visibleKeys.map((key) => theme.palette[SERIES_META[key].color].main);

	const options = useMemo(() => {
		const base = chartBaseOptions(theme, { reducedMotion });
		const axisLabel = chartAxisLabel(theme);

		return {
			...base,
			colors,
			stroke: { curve: 'smooth', width: chartType === 'bar' ? 0 : 2.5 },
			plotOptions: {
				bar: {
					columnWidth: '48%',
					borderRadius: 4,
					borderRadiusApplication: 'end',
				},
			},
			markers: {
				size: chartType === 'line' ? 4 : 0,
				strokeWidth: 2,
				hover: { size: 6 },
			},
			fill: chartType === 'area' ? areaFill() : { type: 'solid', opacity: 1 },
			xaxis: {
				categories: labels,
				axisBorder: { show: false },
				axisTicks: { show: false },
				labels: { style: axisLabel.style },
				tooltip: { enabled: false },
			},
			yaxis: {
				labels: { style: axisLabel.style, formatter: (value) => formatNumber(Math.round(value)) },
				forceNiceScale: true,
			},
			tooltip: {
				...base.tooltip,
				y: { formatter: (value) => `${formatNumber(value)} dokumen` },
			},
			grid: { ...base.grid, padding: { left: 4, right: 12, top: 4, bottom: 0 } },
			legend: { show: false },
		};
	}, [chartType, colors, labels, reducedMotion, theme]);

	const isEmpty = labels.length === 0;

	return (
		<ChartCard
			title="Tren pengajuan cuti & rekrutmen"
			subtitle={`${formatNumber(totalLeaves)} pengajuan cuti · ${formatNumber(
				totalHires,
			)} karyawan baru pada ${periodLabel?.toLowerCase()}`}
			delay={delay}
			isEmpty={isEmpty}
			emptyTitle="Belum ada aktivitas pada periode ini"
			emptyDescription="Pengajuan cuti dan karyawan baru akan tampil di sini."
			footer={<SectionLink href={DRILL_DOWN.leaves} label="Buka data cuti karyawan" />}
			actions={
				<ToggleButtonGroup
					size="small"
					exclusive
					value={chartType}
					onChange={(event, next) => next && setChartType(next)}
					aria-label="Tipe grafik tren"
				>
					{CHART_TYPES.map(({ value, label, icon: Icon }) => (
						<ToggleButton key={value} value={value} aria-label={label} sx={{ px: 1, py: 0.5 }}>
							<Icon fontSize="small" />
						</ToggleButton>
					))}
				</ToggleButtonGroup>
			}
		>
			<Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} sx={{ px: 1, mb: 1 }}>
				<ToggleButtonGroup
					size="small"
					value={activeSeries}
					onChange={(event, next) => setActiveSeries(next.length > 0 ? next : activeSeries)}
					aria-label="Deret data yang ditampilkan"
				>
					{Object.values(SERIES_META).map((meta) => (
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
				<Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
					Klik legenda untuk membandingkan
				</Typography>
			</Stack>

			<Chart type={chartType} height={280} options={options} series={series} />
		</ChartCard>
	);
}

export default LeaveTrendCard;
