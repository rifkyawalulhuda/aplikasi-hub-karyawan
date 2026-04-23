import { Outlet } from 'react-router-dom';

import Box from '@mui/material/Box';
import { alpha, useTheme } from '@mui/material/styles';

function MinimalLayout() {
	const theme = useTheme();
	const isDarkMode = theme.palette.mode === 'dark';
	const pageBackground = isDarkMode
		? `radial-gradient(circle at top left, ${alpha(
				theme.palette.primary.main,
				0.18,
		  )}, transparent 28%), radial-gradient(circle at bottom right, ${alpha(
				theme.palette.common.white,
				0.06,
		  )}, transparent 20%), linear-gradient(160deg, #06101B 0%, #102238 52%, #1B3353 100%)`
		: `radial-gradient(circle at top left, ${alpha(
				theme.palette.primary.main,
				0.16,
		  )}, transparent 28%), radial-gradient(circle at bottom right, ${alpha(
				theme.palette.common.white,
				0.12,
		  )}, transparent 22%), linear-gradient(160deg, #EAF3FF 0%, #D7E8FF 52%, #BFD8FF 100%)`;

	return (
		<Box
			component="main"
			minHeight="100vh"
			display="flex"
			justifyContent="center"
			alignItems="center"
			sx={{
				position: 'relative',
				overflow: 'hidden',
				px: 2,
				py: 4,
				backgroundColor: theme.palette.background.default,
				backgroundImage: pageBackground,
				'&::before': {
					content: '""',
					position: 'absolute',
					inset: 0,
					backgroundImage: isDarkMode
						? 'radial-gradient(circle at 18% 20%, rgba(151, 206, 255, 0.18), transparent 28%), radial-gradient(circle at 82% 18%, rgba(58, 147, 242, 0.18), transparent 24%), radial-gradient(circle at 50% 82%, rgba(255, 255, 255, 0.07), transparent 34%)'
						: 'radial-gradient(circle at 18% 20%, rgba(58, 147, 242, 0.14), transparent 28%), radial-gradient(circle at 82% 18%, rgba(58, 147, 242, 0.11), transparent 24%), radial-gradient(circle at 50% 82%, rgba(255, 255, 255, 0.36), transparent 34%)',
				},
				'&::after': {
					content: '""',
					position: 'absolute',
					inset: 0,
					backgroundImage: isDarkMode
						? 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)'
						: 'linear-gradient(rgba(58,147,242,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(58,147,242,0.05) 1px, transparent 1px)',
					backgroundSize: '64px 64px',
					opacity: isDarkMode ? 0.18 : 0.12,
					maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.7), rgba(0,0,0,0.2))',
				},
			}}
		>
			<Box position="relative" zIndex={1} width="100%" display="flex" justifyContent="center">
				<Outlet />
			</Box>
		</Box>
	);
}

export default MinimalLayout;
