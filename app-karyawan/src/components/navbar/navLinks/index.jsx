import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

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
					<Typography variant="h6" color="error" align="center">
						Menu Items Error
					</Typography>
				);
		}
	});
	return (
		<Stack
			component="nav"
			direction="row"
			flexWrap="wrap"
			width={{ xs: '100%', md: 'fit-content' }}
			maxWidth="100%"
			border={1}
			borderColor="border"
			justifyContent="flex-start"
		>
			{navMenuItems}
		</Stack>
	);
}

export default NavLinks;
