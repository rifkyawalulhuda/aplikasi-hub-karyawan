import Box from '@mui/material/Box';

import { SectionCard, EmptyState } from './sectionCard';

/**
 * Card shell for a chart: title, optional toolbar and a fixed-height plot area
 * so loading/empty states never shift the layout.
 */
function ChartCard({
	title,
	subtitle,
	actions,
	height = 280,
	isEmpty = false,
	emptyTitle = 'Belum ada data',
	emptyDescription,
	emptyIcon,
	footer,
	delay = 0,
	children,
	sx,
}) {
	return (
		<SectionCard
			title={title}
			subtitle={subtitle}
			actions={actions}
			footer={footer}
			delay={delay}
			sx={sx}
			contentSx={{ px: 1.5, pb: 1.5 }}
		>
			<Box sx={{ minHeight: height, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
				{isEmpty ? (
					<EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} minHeight={height} />
				) : (
					children
				)}
			</Box>
		</SectionCard>
	);
}

export default ChartCard;
