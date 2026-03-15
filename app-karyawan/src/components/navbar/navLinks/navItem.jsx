import { Link as RouterLink, useMatch } from 'react-router-dom';
import { alpha } from '@mui/material/styles';
// MUI
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import ButtonBase from '@mui/material/ButtonBase';
// Icons
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export function NavItem({ Icon, title, showExpand = false, selected = false }) {
	return (
		<Stack
			width="100%"
			direction="row"
			px={{ xs: 1.5, md: 2.5 }}
			py={1.5}
			border={1}
			borderColor="border"
			alignItems="center"
			alignContent="center"
			justifyContent="center"
			spacing={0.75}
			title={title}
			sx={{
				borderLeftWidth: { xs: 0, md: 1 },
				borderTopWidth: { xs: 0, md: 1 },
				borderBottomWidth: 0,
				borderRightWidth: 0,
			}}
		>
			{Icon && (
				<Icon
					sx={{
						fontSize: 17,
						color: (theme) => (selected ? theme.palette.primary.contrastText : theme.palette.primary[300]),
					}}
				/>
			)}
			<Typography
				pt={0.2}
				display={{
					xs: 'none',
					md: 'inline',
				}}
				textTransform="uppercase"
				fontWeight="500"
				fontSize="12.5px"
				letterSpacing={0.2}
				color={selected ? 'primary.contrastText' : 'text.tertiary'}
			>
				{title}
			</Typography>
			{showExpand && (
				<ExpandMoreIcon
					fontSize="small"
					sx={{
						color: selected ? 'primary.contrastText' : 'text.secondary',
						fontSize: 17,
					}}
				/>
			)}
		</Stack>
	);
}

export function NavItemButton({ children, selected, sx, ...rest }) {
	return (
		<ButtonBase
			sx={{
				flexGrow: { xs: 1, md: 0 },
				flexShrink: 0,
				minWidth: { xs: '50%', sm: '50%', md: 260 },
				...(selected && {
					backgroundImage: (theme) =>
						`linear-gradient(90deg, ${theme.palette.primary[300]} 0%,${theme.palette.primary.dark} 100% )`,
					// bgcolor: selected ? '#000' : 'transparent',
				}),
				'&:hover': {
					bgcolor: (theme) => alpha(theme.palette.primary.light, 0.1),
				},
				...sx,
			}}
			{...rest}
		>
			{children}
		</ButtonBase>
	);
}
export function NavLink({ href, Icon, title }) {
	const match = useMatch({
		path: href,
	});

	return (
		<NavItemButton selected={match} component={RouterLink} to={href}>
			<NavItem Icon={Icon} title={title} selected={match} />
		</NavItemButton>
	);
}

export default NavLink;
