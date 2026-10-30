import { Link as RouterLink, useLocation } from 'react-router-dom';
import { alpha } from '@mui/material/styles';
// MUI
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import ButtonBase from '@mui/material/ButtonBase';
// Icons
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { isNavItemActive } from '@/utils/navigation';

export const navAccent = (theme) =>
	theme.palette.mode === 'dark' ? theme.palette.primary[200] : theme.palette.primary.main;

export const navAccentSoft = (theme) => alpha(navAccent(theme), theme.palette.mode === 'dark' ? 0.2 : 0.08);

export function NavItem({ Icon, title, showExpand = false, selected = false, expanded = false, label }) {
	const showIcon = Boolean(Icon);

	return (
		<Stack
			width="100%"
			direction="row"
			px={1.75}
			alignItems="center"
			justifyContent="center"
			spacing={0.75}
			title={label || title}
			sx={{ height: '100%' }}
		>
			{showIcon && (
				<Icon
					sx={{
						fontSize: 18,
						display: { xs: 'inline-flex', lg: 'none' },
						color: (theme) => (selected ? navAccent(theme) : theme.palette.text.tertiary),
					}}
				/>
			)}
			<Typography
				noWrap
				display={{ xs: 'none', lg: 'block' }}
				fontWeight={selected ? 600 : 500}
				fontSize="0.84rem"
				letterSpacing={0}
				color="inherit"
			>
				{title}
			</Typography>
			{showExpand && (
				<ExpandMoreIcon
					sx={{
						display: { xs: 'none', lg: 'block' },
						fontSize: 17,
						opacity: 0.75,
						transition: 'transform 180ms ease',
						transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
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
				position: 'relative',
				flexGrow: { xs: 1, lg: 0 },
				flexShrink: 0,
				height: 44,
				minWidth: { xs: 52, lg: 'auto' },
				borderRadius: 1.5,
				color: (theme) => (selected ? navAccent(theme) : theme.palette.text.tertiary),
				transition: 'color 150ms ease, background-color 150ms ease',
				cursor: 'pointer',
				'&::after': {
					content: '""',
					position: 'absolute',
					left: 14,
					right: 14,
					bottom: 0,
					height: 2,
					borderRadius: 1,
					bgcolor: (theme) => navAccent(theme),
					opacity: selected ? 1 : 0,
					transform: selected ? 'scaleX(1)' : 'scaleX(0.4)',
					transition: 'opacity 150ms ease, transform 150ms ease',
				},
				'&:hover': {
					bgcolor: (theme) => navAccentSoft(theme),
					color: (theme) => navAccent(theme),
				},
				'&:hover::after': {
					opacity: selected ? 1 : 0.35,
					transform: 'scaleX(1)',
				},
				'&:focus-visible': {
					outline: (theme) => `2px solid ${navAccent(theme)}`,
					outlineOffset: 2,
				},
				...sx,
			}}
			{...rest}
		>
			{children}
		</ButtonBase>
	);
}

export function NavLink({ href, Icon, title, matchPaths }) {
	const { pathname } = useLocation();
	const selected = isNavItemActive({ href, matchPaths }, pathname);

	return (
		<NavItemButton
			component={RouterLink}
			to={href}
			selected={selected}
			aria-current={selected ? 'page' : undefined}
		>
			<NavItem Icon={Icon} title={title} selected={selected} />
		</NavItemButton>
	);
}

export default NavLink;
