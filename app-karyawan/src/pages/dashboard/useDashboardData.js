import { useCallback, useEffect, useRef, useState } from 'react';

import apiRequest from '@/services/api';

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Loads the dashboard payload, keeps the previous render while refreshing,
 * and re-fetches every 5 minutes.
 */
function useDashboardData({ siteId, period }) {
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState(null);
	const activeRequestRef = useRef(0);

	const load = useCallback(
		async ({ silent = false } = {}) => {
			const requestId = activeRequestRef.current + 1;
			activeRequestRef.current = requestId;

			if (silent) {
				setRefreshing(true);
			} else {
				setLoading(true);
			}

			try {
				const params = new URLSearchParams();
				if (siteId) {
					params.set('siteId', String(siteId));
				}
				if (period) {
					params.set('period', period);
				}

				const query = params.toString();
				const result = await apiRequest(`/dashboard${query ? `?${query}` : ''}`);

				if (activeRequestRef.current === requestId) {
					setData(result);
					setError(null);
				}
			} catch (requestError) {
				if (activeRequestRef.current === requestId) {
					setError(requestError);
				}
			} finally {
				if (activeRequestRef.current === requestId) {
					setLoading(false);
					setRefreshing(false);
				}
			}
		},
		[period, siteId],
	);

	useEffect(() => {
		load();
	}, [load]);

	useEffect(() => {
		const intervalId = setInterval(() => {
			load({ silent: true });
		}, REFRESH_INTERVAL_MS);

		return () => clearInterval(intervalId);
	}, [load]);

	const refresh = useCallback(() => load({ silent: Boolean(data) }), [data, load]);

	return { data, loading, refreshing, error, refresh };
}

export default useDashboardData;
