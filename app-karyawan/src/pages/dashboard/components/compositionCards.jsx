import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import Chart from 'react-apexcharts';

import { chartBaseOptions } from '../chartTheme';
import { DRILL_DOWN, formatNumber, percentOf } from '../constants';
import { useReducedMotion } from '../motion';
import { SectionCard, SectionLink, EmptyState } from './sectionCard';

const MAX_DEPARTMENT_ROWS = 7;
const MAX_JOB_LEVEL_SLICES = 6;

/** Collapse a ranked list into `max` entries, folding the tail into "Lainnya". */
function withOthers(items, max) {
	const head = items.slice(0, max - 1).map((item) => ({ ...item }));
	const rest = items.slice(max - 1);

	if (rest.length > 0) {
		head.push({
			name: `Lainnya (${rest.length})`,
			count: rest.reduce((sum, item) => sum + item.count, 0),
			isOther: true,
		});
	}

	return head;
}

function usePaletteCycle() {
	const theme = useTheme();

	return useMemo(
		() => [
			theme.palette.primary.main,
			theme.palette.cuaternary?.main || theme.palette.info.main,
			theme.palette.secondary.main,
			theme.palette.tertiary?.main || theme.palette.primary.light,
			theme.palette.success.main,
			theme.palette.warning.main,
			theme.palette.error.main,
		],
		[theme],
	);
}

/** Ranked distribution as an accessible bar list — no chart clipping on long names. */
function RankedBarList({ items, total, color, onSelect, fill = false }) {
	const max = items.reduce((peak, item) => Math.max(peak, item.count), 0) || 1;

	return (
		<Stack
			component="ul"
			spacing={1.25}
			sx={[{ listStyle: 'none', m: 0, p: 0 }, fill ? { flexGrow: 1, justifyContent: 'space-between' } : null]}
		>
			{items.map((item) => {
				const share = Math.round((item.count / max) * 100);

				return (
					<Box
						component="li"
						key={item.name}
						onClick={onSelect}
						onKeyDown={
							onSelect
								? (event) => {
										if (event.key === 'Enter' || event.key === ' ') {
											event.preventDefault();
											onSelect();
										}
								  }
								: undefined
						}
						role={onSelect ? 'button' : undefined}
						tabIndex={onSelect ? 0 : undefined}
						sx={{
							cursor: onSelect ? 'pointer' : 'default',
							borderRadius: 1,
							px: 0.75,
							py: 0.5,
							mx: -0.75,
							transition: 'background-color 150ms ease',
							'&:hover': onSelect ? { bgcolor: 'action.hover' } : undefined,
							'&:focus-visible': { outline: 2, outlineColor: 'primary.main', outlineOffset: 2 },
						}}
					>
						<Stack direction="row" alignItems="baseline" spacing={1}>
							<Typography
								variant="body2"
								noWrap
								title={item.name}
								sx={{
									flexGrow: 1,
									minWidth: 0,
									fontStyle: item.isOther ? 'italic' : 'normal',
								}}
								color={item.isOther ? 'text.secondary' : 'text.primary'}
							>
								{item.name}
							</Typography>
							<Typography
								variant="body2"
								fontWeight={700}
								sx={{ fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}
							>
								{formatNumber(item.count)}
							</Typography>
							<Typography
								variant="caption"
								color="text.secondary"
								sx={{
									width: 34,
									textAlign: 'right',
									flexShrink: 0,
									fontVariantNumeric: 'tabular-nums',
								}}
							>
								{percentOf(item.count, total)}%
							</Typography>
						</Stack>
						<Box
							sx={{
								mt: 0.5,
								height: 6,
								borderRadius: 3,
								bgcolor: 'action.hover',
								overflow: 'hidden',
							}}
						>
							<Box
								sx={{
									width: `${share}%`,
									minWidth: item.count > 0 ? 3 : 0,
									height: '100%',
									borderRadius: 3,
									bgcolor: item.isOther ? 'text.disabled' : color,
								}}
							/>
						</Box>
					</Box>
				);
			})}
		</Stack>
	);
}

/** Top departments as a ranked bar list, largest on top. */
function DepartmentDistributionCard({ byDepartment = [], totalEmployees = 0, delay = 0 }) {
	const theme = useTheme();
	const navigate = useNavigate();

	const items = useMemo(() => withOthers(byDepartment, MAX_DEPARTMENT_ROWS), [byDepartment]);

	return (
		<SectionCard
			title="Sebaran karyawan per departemen"
			subtitle={
				byDepartment.length > 0
					? `${byDepartment.length} departemen · rata-rata ${formatNumber(
							Math.round(totalEmployees / byDepartment.length),
					  )} karyawan`
					: 'Belum ada data departemen'
			}
			delay={delay}
			contentSx={{ display: 'flex', flexDirection: 'column' }}
			footer={<SectionLink href={DRILL_DOWN.employees} label="Lihat detail karyawan" />}
		>
			{items.length === 0 ? (
				<EmptyState
					title="Belum ada data departemen"
					description="Lengkapi data departemen karyawan untuk melihat sebarannya."
				/>
			) : (
				<RankedBarList
					items={items}
					total={totalEmployees}
					color={theme.palette.primary.main}
					onSelect={() => navigate(DRILL_DOWN.employees)}
					fill
				/>
			)}
		</SectionCard>
	);
}

/** Job level composition as a donut (top slices + tail) with an explicit value legend. */
function JobLevelDistributionCard({ byJobLevel = [], byEmploymentType = [], totalEmployees = 0, delay = 0 }) {
	const theme = useTheme();
	const reducedMotion = useReducedMotion();
	const palette = usePaletteCycle();

	// A donut reads clearly up to ~6 slices; the long tail is folded into "Lainnya".
	const slices = useMemo(() => withOthers(byJobLevel, MAX_JOB_LEVEL_SLICES), [byJobLevel]);

	const colors = slices.map((item, index) => palette[index % palette.length]);
	const labels = slices.map((item) => item.name);
	const series = slices.map((item) => item.count);

	const permanent = byEmploymentType.find((item) => item.name === 'Permanent')?.count || 0;
	const contract = byEmploymentType.find((item) => item.name !== 'Permanent')?.count || 0;
	const permanentPct = percentOf(permanent, permanent + contract);

	const options = useMemo(() => {
		const base = chartBaseOptions(theme, { reducedMotion });

		return {
			...base,
			colors,
			labels,
			stroke: { width: 2, colors: [theme.palette.background.paper] },
			plotOptions: {
				pie: {
					donut: {
						size: '70%',
						labels: {
							show: true,
							name: {
								show: true,
								fontSize: '12px',
								fontFamily: theme.typography.fontFamily,
								color: theme.palette.text.secondary,
								offsetY: -4,
							},
							value: {
								show: true,
								fontSize: '26px',
								fontWeight: 800,
								fontFamily: theme.typography.fontFamily,
								color: theme.palette.text.primary,
								offsetY: 4,
								formatter: (value) => formatNumber(value),
							},
							total: {
								show: true,
								label: 'Karyawan',
								fontSize: '12px',
								fontFamily: theme.typography.fontFamily,
								color: theme.palette.text.secondary,
								formatter: () => formatNumber(series.reduce((sum, value) => sum + value, 0)),
							},
						},
					},
				},
			},
			tooltip: { ...base.tooltip, y: { formatter: (value) => `${formatNumber(value)} karyawan` } },
			legend: { show: false },
		};
	}, [colors, labels, reducedMotion, series, theme]);

	const isEmpty = series.length === 0;

	return (
		<SectionCard
			title="Komposisi job level"
			subtitle={
				isEmpty
					? 'Belum ada data job level'
					: `${byJobLevel.length} level · ${formatNumber(totalEmployees)} karyawan`
			}
			delay={delay}
			footer={<SectionLink href={DRILL_DOWN.employees} label="Buka data karyawan" />}
		>
			{isEmpty ? (
				<EmptyState
					title="Belum ada data job level"
					description="Data job level akan tampil setelah karyawan memiliki level jabatan."
				/>
			) : (
				<Stack spacing={2}>
					<Chart type="donut" height={180} options={options} series={series} />

					<Box
						component="ul"
						sx={{
							listStyle: 'none',
							m: 0,
							p: 0,
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
							columnGap: 2,
							rowGap: 0.75,
						}}
					>
						{slices.map((item, index) => (
							<Stack
								key={item.name}
								component="li"
								direction="row"
								alignItems="center"
								spacing={1}
								sx={{ fontSize: 13, minWidth: 0 }}
							>
								<Box
									sx={{
										width: 8,
										height: 8,
										borderRadius: '50%',
										bgcolor: colors[index],
										flexShrink: 0,
									}}
								/>
								<Typography
									variant="body2"
									sx={{ flexGrow: 1, minWidth: 0, fontStyle: item.isOther ? 'italic' : 'normal' }}
									color={item.isOther ? 'text.secondary' : 'text.primary'}
									noWrap
									title={item.name}
								>
									{item.name}
								</Typography>
								<Typography
									variant="body2"
									fontWeight={700}
									sx={{ fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}
								>
									{formatNumber(item.count)}
								</Typography>
								<Typography
									variant="caption"
									color="text.secondary"
									sx={{
										width: 34,
										textAlign: 'right',
										flexShrink: 0,
										fontVariantNumeric: 'tabular-nums',
									}}
								>
									{percentOf(item.count, totalEmployees)}%
								</Typography>
							</Stack>
						))}
					</Box>

					<Box sx={{ pt: 1, borderTop: 1, borderColor: 'divider' }}>
						<Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.75}>
							<Typography variant="caption" color="text.secondary" fontWeight={600}>
								Status kepegawaian
							</Typography>
							<Typography variant="caption" color="text.secondary">
								{permanentPct}% permanent
							</Typography>
						</Stack>
						<Stack
							direction="row"
							sx={{ height: 8, borderRadius: 4, overflow: 'hidden', bgcolor: 'action.hover' }}
						>
							<Box sx={{ width: `${permanentPct}%`, bgcolor: 'primary.main' }} />
							<Box sx={{ flexGrow: 1, bgcolor: 'secondary.main' }} />
						</Stack>
						<Stack direction="row" justifyContent="space-between" mt={0.75}>
							<Stack direction="row" spacing={0.75} alignItems="center">
								<Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main' }} />
								<Typography variant="caption">Permanent {formatNumber(permanent)}</Typography>
							</Stack>
							<Stack direction="row" spacing={0.75} alignItems="center">
								<Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'secondary.main' }} />
								<Typography variant="caption">Kontrak {formatNumber(contract)}</Typography>
							</Stack>
						</Stack>
					</Box>
				</Stack>
			)}
		</SectionCard>
	);
}

/** Headcount per site — only meaningful for the all-sites (super admin) view. */
function SiteDistributionCard({ bySite = [], totalEmployees = 0, delay = 0 }) {
	const theme = useTheme();
	const navigate = useNavigate();

	const items = useMemo(() => [...bySite].slice(0, 8), [bySite]);

	return (
		<SectionCard
			title="Karyawan per site"
			subtitle={`${bySite.length} site aktif`}
			delay={delay}
			contentSx={{ display: 'flex', flexDirection: 'column' }}
			footer={<SectionLink href={DRILL_DOWN.sites} label="Kelola master site" />}
		>
			{items.length === 0 ? (
				<EmptyState
					title="Belum ada data site"
					description="Data site akan tampil setelah site aktif tersedia."
				/>
			) : (
				<RankedBarList
					items={items}
					total={totalEmployees || items.reduce((sum, item) => sum + item.count, 0)}
					color={theme.palette.cuaternary?.main || theme.palette.info.main}
					onSelect={() => navigate(DRILL_DOWN.sites)}
					fill
				/>
			)}
		</SectionCard>
	);
}

export { DepartmentDistributionCard, JobLevelDistributionCard, SiteDistributionCard };
