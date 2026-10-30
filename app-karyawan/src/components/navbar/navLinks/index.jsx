import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

import { NavLink } from './navItem';
import NavMenu from './navMenu';

function NavLinks({ navItems }) {
	const navMenuItems = navItems.map((item) => {
		const { title, fullTitle, type, Icon, id, menuChildren, href, matchPaths } = item;

		switch (type) {
			case 'group':
				return <NavMenu key={id} menuChildren={menuChildren} Icon={Icon} title={title} fullTitle={fullTitle} />;
			case 'item':
				return <NavLink key={id} href={href} Icon={Icon} title={title} matchPaths={matchPaths} />;
			default:
				return (
					<Typography key={id} variant="caption" color="error" align="center">
						Menu Items Error
					</Typography>
				);
		}
	});

	return (
		<Box
			component="nav"
			aria-label="Navigasi utama"
			sx={{
				display: { xs: 'none', lg: 'flex' },
				flexDirection: 'row',
				flexWrap: 'nowrap',
				alignItems: 'center',
				gap: 0.25,
				minWidth: 0,
				flexShrink: 1,
			}}
		>
			{navMenuItems}
		</Box>
	);
}

export default NavLinks;
