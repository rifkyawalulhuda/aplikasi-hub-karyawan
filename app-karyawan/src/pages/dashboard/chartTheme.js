/**
 * Shared ApexCharts options so every dashboard chart follows the active MUI theme
 * (light/dark, palette tokens, typography) instead of hardcoded colors.
 */
export function chartBaseOptions(theme, { reducedMotion = false } = {}) {
	const isDark = theme.palette.mode === 'dark';

	return {
		chart: {
			fontFamily: theme.typography.fontFamily,
			foreColor: theme.palette.text.secondary,
			toolbar: { show: false },
			background: 'transparent',
			parentHeightOffset: 0,
			animations: {
				enabled: !reducedMotion,
				speed: 450,
				animateGradually: { enabled: !reducedMotion, delay: 80 },
				dynamicAnimation: { enabled: !reducedMotion, speed: 300 },
			},
		},
		grid: {
			borderColor: theme.palette.divider,
			strokeDashArray: 4,
			padding: { left: 4, right: 12, top: 0, bottom: 0 },
		},
		tooltip: {
			theme: isDark ? 'dark' : 'light',
			intersect: false,
		},
		dataLabels: { enabled: false },
		legend: {
			fontFamily: theme.typography.fontFamily,
			labels: { colors: theme.palette.text.secondary },
			markers: { width: 8, height: 8, radius: 4 },
		},
		states: {
			hover: { filter: { type: 'lighten', value: 0.04 } },
			active: { filter: { type: 'darken', value: 0.08 } },
		},
	};
}

/** Axis label styling shared by cartesian charts. */
export function chartAxisLabel(theme) {
	return {
		style: {
			colors: theme.palette.text.secondary,
			fontSize: '12px',
			fontFamily: theme.typography.fontFamily,
		},
	};
}

/** Rounded gradient area fill used by the trend charts. */
export function areaFill() {
	return {
		type: 'gradient',
		gradient: {
			shadeIntensity: 1,
			opacityFrom: 0.32,
			opacityTo: 0.04,
			stops: [0, 90, 100],
		},
	};
}
