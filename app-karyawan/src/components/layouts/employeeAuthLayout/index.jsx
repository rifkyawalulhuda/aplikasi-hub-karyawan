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
				backgroundColor: (theme) => theme.palette.background.default,
				backgroundImage: (theme) => theme.palette.employeeSurface.authBackground,
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
