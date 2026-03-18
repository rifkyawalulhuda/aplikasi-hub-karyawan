import { Outlet } from 'react-router-dom';

import Box from '@mui/material/Box';

function EmployeeAuthLayout() {
	return (
		<Box
			component="main"
			sx={{
				minHeight: '100vh',
				display: 'flex',
				alignItems: 'stretch',
				justifyContent: 'center',
				px: 2,
				py: 3,
				backgroundColor: '#071A2F',
				backgroundImage:
					'radial-gradient(circle at top left, rgba(76, 154, 232, 0.32), transparent 28%), radial-gradient(circle at bottom right, rgba(255,255,255,0.12), transparent 22%), linear-gradient(160deg, #071A2F 0%, #123B66 48%, #4C9AE8 100%)',
			}}
		>
			<Box
				sx={{
					width: '100%',
					maxWidth: 460,
					display: 'flex',
					alignItems: 'center',
				}}
			>
				<Outlet />
			</Box>
		</Box>
	);
}

export default EmployeeAuthLayout;
