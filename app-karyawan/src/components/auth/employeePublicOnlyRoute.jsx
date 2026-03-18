import { Navigate, Outlet } from 'react-router-dom';

import { useEmployeeAuth } from '@/contexts/employeeAuthContext';

function EmployeePublicOnlyRoute() {
	const { isAuthenticated } = useEmployeeAuth();

	if (isAuthenticated) {
		return <Navigate to="/karyawan" replace />;
	}

	return <Outlet />;
}

export default EmployeePublicOnlyRoute;
