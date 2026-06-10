import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './authContext';

const SITE_STORAGE_KEY = 'selectedSiteId';

const SiteContext = createContext(null);

function readStoredSiteId() {
	if (typeof window === 'undefined') {
		return null;
	}

	try {
		const stored = window.sessionStorage.getItem(SITE_STORAGE_KEY);
		if (!stored) {
			return null;
		}
		const parsed = Number(stored);
		return Number.isFinite(parsed) ? parsed : null;
	} catch {
		return null;
	}
}

function SiteProvider({ children }) {
	const { user } = useAuth();
	const isSuperAdmin = user?.role === 'super_admin';

	const [selectedSiteId, setSelectedSiteId] = useState(() => {
		if (!isSuperAdmin) return null;
		return readStoredSiteId();
	});

	// Persist selectedSiteId to sessionStorage for super_admin
	useEffect(() => {
		if (!isSuperAdmin) return;

		if (selectedSiteId != null) {
			window.sessionStorage.setItem(SITE_STORAGE_KEY, String(selectedSiteId));
		} else {
			window.sessionStorage.removeItem(SITE_STORAGE_KEY);
		}
	}, [isSuperAdmin, selectedSiteId]);

	// Reset selectedSiteId when user changes or is not super_admin
	useEffect(() => {
		if (!isSuperAdmin) {
			setSelectedSiteId(null);
		}
	}, [isSuperAdmin]);

	const value = useMemo(
		() => ({
			currentSiteId: isSuperAdmin ? selectedSiteId : user?.siteId ?? null,
			siteName: user?.siteName || null,
			isSuperAdmin,
			selectedSiteId,
			setSelectedSiteId,
		}),
		[user, isSuperAdmin, selectedSiteId],
	);

	return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

function useSite() {
	const context = useContext(SiteContext);

	if (!context) {
		throw new Error('useSite harus digunakan di dalam SiteProvider.');
	}

	return context;
}

export { SiteContext, SiteProvider, useSite };
