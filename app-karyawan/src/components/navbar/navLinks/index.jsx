import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

import { NavLink } from './navItem';
import NavMenu from './navMenu';

function NavLinks({ navItems }) {
	const navMenuItems = navItems.map((item) => {
		const { title, type, Icon, id, menuMinWidth, menuChildren, href } = item;

		switch (type) {
			case 'group':
				return (
					<NavMenu key={id} minWidth={menuMinWidth} menuChildren={menuChildren} Icon={Icon} title={title} />
				);
			case 'item':
				return <NavLink key={id} href={href} Icon={Icon} title={title} />;
			default:
				return (
					<Typography key={id} variant="h6" color="error" align="center">
						Menu Items Error
					</Typography>
				);
		}
	});

	return (
		<Box
			sx={{
				position: 'relative',
				maxWidth: '100%',
				// Fade-out gradient on the right edge to hint horizontal scroll on mobile
				'&::after': {
					content: '""',
					display: { xs: 'block', md: 'none' },
					position: 'absolute',
					top: 0,
					right: 0,
					width: 32,
					height: '100%',
					pointerEvents: 'none',
					background: (theme) => `linear-gradient(to right, transparent, ${theme.palette.background.paper})`,
				},
			}}
		>
			<Box
				component="nav"
				aria-label="Main navigation"
				sx={{
					display: 'flex',
					flexDirection: 'row',
					flexWrap: 'nowrap',
					width: { xs: '100%', md: 'fit-content' },
					maxWidth: '100%',
					border: 1,
					borderColor: 'border',
					justifyContent: 'flex-start',
					overflowX: 'auto',
					scrollbarWidth: 'none', // Hide scrollbar Firefox
					'&::-webkit-scrollbar': { display: 'none' }, // Hide scrollbar Chrome
				}}
			>
				{navMenuItems}
			</Box>
		</Box>
	);
}

export default NavLinks;
