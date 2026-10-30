import { Link as RouterLink, useLocation } from 'react-router-dom';
// MUI
import Container from '@mui/material/Container';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

import { countSegments, findNavTrail } from '@/utils/navigation';

function Breadcrumb({ navItems, maxWidth = 'lg' }) {
	const { pathname } = useLocation();
	const trail = findNavTrail(navItems ?? [], pathname);

	if (!trail || trail.length < 2) {
		return null;
	}

	const lastEntry = trail[trail.length - 1];
	const isDeep = countSegments(pathname) > countSegments(lastEntry.href ?? '');

	if (!isDeep) {
		return null;
	}

	return (
		<Container maxWidth={maxWidth} className="no-print" sx={{ pt: 1.5 }}>
			<Breadcrumbs
				separator={<NavigateNextIcon sx={{ fontSize: 14 }} />}
				aria-label="Breadcrumb"
				sx={{
					'& .MuiBreadcrumbs-ol': { flexWrap: 'nowrap' },
					'& .MuiBreadcrumbs-li': { minWidth: 0 },
					'& .MuiBreadcrumbs-separator': { mx: 0.75, color: 'text.tertiary' },
				}}
			>
				{trail.map((entry, index) => {
					const isLast = index === trail.length - 1;

					if (!isLast && entry.href) {
						return (
							<Link
								key={`${entry.title}-${index}`}
								component={RouterLink}
								to={entry.href}
								underline="hover"
								noWrap
								sx={{ fontSize: '0.72rem', color: 'text.secondary' }}
							>
								{entry.title}
							</Link>
						);
					}

					return (
						<Typography
							key={`${entry.title}-${index}`}
							noWrap
							sx={{
								fontSize: '0.72rem',
								color: isLast ? 'text.primary' : 'text.tertiary',
								fontWeight: isLast ? 600 : 400,
							}}
						>
							{entry.title}
						</Typography>
					);
				})}
			</Breadcrumbs>
		</Container>
	);
}

export default Breadcrumb;
