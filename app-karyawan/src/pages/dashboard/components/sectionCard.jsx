import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router-dom';
import { alpha } from '@mui/material/styles';

import ChevronRightOutlinedIcon from '@mui/icons-material/ChevronRightOutlined';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';

import { entranceSx } from '../motion';

/** Consistent bordered surface used by every dashboard section. */
function SectionCard({ title, subtitle, actions, children, footer, contentSx, delay = 0, sx }) {
	return (
		<Card
			elevation={0}
			type="none"
			sx={[
				{
					display: 'flex',
					flexDirection: 'column',
					height: '100%',
					border: 1,
					borderColor: 'divider',
					borderRadius: 2,
					overflow: 'hidden',
				},
				entranceSx(delay),
				...(Array.isArray(sx) ? sx : [sx]),
			]}
		>
			<Stack
				direction="row"
				justifyContent="space-between"
				alignItems="flex-start"
				gap={1.5}
				sx={{ px: 2.5, pt: 2, pb: 1.5 }}
			>
				<Box sx={{ minWidth: 0 }}>
					<Typography variant="subtitle1" fontWeight={700} lineHeight={1.3}>
						{title}
					</Typography>
					{subtitle ? (
						<Typography variant="caption" color="text.secondary" display="block" mt={0.25}>
							{subtitle}
						</Typography>
					) : null}
				</Box>
				{actions ? (
					<Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 1 }}>{actions}</Box>
				) : null}
			</Stack>

			<Box sx={[{ px: 2.5, pb: 2.5, flexGrow: 1, minWidth: 0 }, contentSx]}>{children}</Box>

			{footer ? (
				<>
					<Divider />
					<Box sx={{ px: 2.5, py: 1.25 }}>{footer}</Box>
				</>
			) : null}
		</Card>
	);
}

/** Footer link that sends the user to the full page behind a summary card. */
function SectionLink({ href, label }) {
	return (
		<Stack
			component={RouterLink}
			direction="row"
			alignItems="center"
			justifyContent="space-between"
			to={href}
			underline="none"
			sx={{
				color: 'primary.main',
				fontWeight: 600,
				fontSize: 13,
				borderRadius: 1,
				py: 0.5,
				'&:hover': { textDecoration: 'underline' },
				'&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
			}}
		>
			{label}
			<ChevronRightOutlinedIcon fontSize="small" />
		</Stack>
	);
}

/** Neutral empty state with an optional call to action. */
function EmptyState({ icon: Icon = InboxOutlinedIcon, title, description, tone = 'text.secondary', minHeight = 180 }) {
	return (
		<Stack alignItems="center" justifyContent="center" spacing={1} sx={{ minHeight, textAlign: 'center', py: 2 }}>
			<Box
				sx={(theme) => ({
					width: 44,
					height: 44,
					borderRadius: '50%',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					bgcolor: alpha(theme.palette[tone === 'text.secondary' ? 'primary' : tone].main, 0.1),
				})}
			>
				<Icon sx={{ color: tone === 'text.secondary' ? 'primary.main' : `${tone}.main`, fontSize: 22 }} />
			</Box>
			<Typography variant="body2" fontWeight={600}>
				{title}
			</Typography>
			{description ? (
				<Typography variant="caption" color="text.secondary" maxWidth={280}>
					{description}
				</Typography>
			) : null}
		</Stack>
	);
}

export { SectionCard, SectionLink, EmptyState };
export default SectionCard;
