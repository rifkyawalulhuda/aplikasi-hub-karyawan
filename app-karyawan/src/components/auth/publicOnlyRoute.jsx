import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '@/contexts/authContext';

function PublicOnlyRoute() {
	const { isAuthenticated } = useAuth();

	if (isAuthenticated) {
		return <Navigate to="/" replace />;
	}

	return <Outlet />;
}

export default PublicOnlyRoute;
