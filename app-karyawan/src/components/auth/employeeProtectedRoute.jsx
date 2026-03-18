import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useEmployeeAuth } from '@/contexts/employeeAuthContext';

function EmployeeProtectedRoute() {
	const location = useLocation();
	const { isAuthenticated } = useEmployeeAuth();

	if (!isAuthenticated) {
		return <Navigate to="/karyawan/login" replace state={{ from: location }} />;
	}

	return <Outlet />;
}

export default EmployeeProtectedRoute;
