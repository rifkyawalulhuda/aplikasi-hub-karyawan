import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import { Link as RouterLink } from 'react-router-dom';

import { entranceSx, useCountUp } from '../motion';
import { formatNumber } from '../constants';

const TONE_MAP = {
	primary: 'primary',
	info: 'info',
	success: 'success',
	warning: 'warning',
	error: 'error',
	secondary: 'secondary',
};

/**
 * Headline metric card: count-up value, context line and a drill-down into the
 * page that owns the number.
 */
function KpiTile({
	icon: Icon,
	label,
	value,
	suffix,
	helper,
	helperTone = 'text.secondary',
	tone = 'primary',
	href,
	delay = 0,
}) {
	const theme = useTheme();
	const toneColor = theme.palette[TONE_MAP[tone] || 'primary'].main;
	const animatedValue = useCountUp(typeof value === 'number' ? value : 0, { duration: 700 });
	const displayValue = typeof value === 'number' ? formatNumber(animatedValue) : value;

	return (
		<Card
			elevation={0}
			type="none"
			sx={[
				{
					position: 'relative',
					height: '100%',
					border: 1,
					borderColor: 'divider',
					borderRadius: 2,
					overflow: 'hidden',
					transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
					'&:hover': {
						transform: 'translateY(-2px)',
						borderColor: toneColor,
						boxShadow: theme.shadows[6],
					},
				},
				entranceSx(delay),
			]}
		>
			<Box
				aria-hidden
				sx={{
					position: 'absolute',
					inset: 0,
					background: `radial-gradient(120px 90px at 100% 0%, ${alpha(toneColor, 0.16)} 0%, transparent 70%)`,
					pointerEvents: 'none',
				}}
			/>
			<CardActionArea component={RouterLink} to={href} sx={{ height: '100%', p: 2, borderRadius: 2 }}>
				<Stack spacing={0.75} sx={{ height: '100%' }}>
					<Stack direction="row" alignItems="flex-start" spacing={0.5} sx={{ minWidth: 0 }}>
						<Typography
							variant="caption"
							fontWeight={700}
							fontSize="0.7rem"
							letterSpacing={0.4}
							textTransform="uppercase"
							color="text.secondary"
							title={label}
							sx={{
								minWidth: 0,
								overflow: 'hidden',
								textOverflow: 'ellipsis',
								whiteSpace: 'nowrap',
								lineHeight: 1.35,
							}}
						>
							{label}
						</Typography>
						<Box sx={{ flexGrow: 1 }} />
						<Icon
							aria-hidden
							sx={{ fontSize: 15, color: toneColor, opacity: 0.9, flexShrink: 0, mt: 0.25 }}
						/>
					</Stack>

					<Stack direction="row" alignItems="baseline" spacing={0.5} sx={{ minHeight: 34 }}>
						<Typography
							variant="h4"
							fontWeight={800}
							lineHeight={1.1}
							title={typeof value === 'number' ? formatNumber(value) : undefined}
							sx={{ fontVariantNumeric: 'tabular-nums', color: 'text.primary' }}
						>
							{displayValue}
						</Typography>
						{suffix ? (
							<Typography variant="body2" fontWeight={600} color="text.secondary">
								{suffix}
							</Typography>
						) : null}
					</Stack>

					{helper ? (
						<Typography
							variant="caption"
							color={helperTone}
							fontWeight={600}
							display="block"
							lineHeight={1.45}
							title={helper}
							sx={{
								display: '-webkit-box',
								WebkitLineClamp: 2,
								WebkitBoxOrient: 'vertical',
								overflow: 'hidden',
								minHeight: '2.9em',
							}}
						>
							{helper}
						</Typography>
					) : null}
				</Stack>
			</CardActionArea>
		</Card>
	);
}

export default KpiTile;
