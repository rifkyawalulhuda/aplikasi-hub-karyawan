import { Outlet } from 'react-router-dom';

import Box from '@mui/material/Box';

function MinimalLayout() {
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
				backgroundColor: '#10335A',
				backgroundImage:
					'linear-gradient(135deg, rgb(16, 51, 90) 0%, rgb(26, 76, 130) 48%, rgb(58, 147, 242) 100%)',
				'&::before': {
					content: '""',
					position: 'absolute',
					inset: 0,
					backgroundImage:
						'radial-gradient(circle at 18% 20%, rgba(151, 206, 255, 0.18), transparent 28%), radial-gradient(circle at 82% 18%, rgba(58, 147, 242, 0.18), transparent 24%), radial-gradient(circle at 50% 82%, rgba(255, 255, 255, 0.07), transparent 34%)',
				},
				'&::after': {
					content: '""',
					position: 'absolute',
					inset: 0,
					backgroundImage:
						'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
					backgroundSize: '64px 64px',
					opacity: 0.18,
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
