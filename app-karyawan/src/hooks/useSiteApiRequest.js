import { useCallback } from 'react';
import { useSite } from '@/contexts/siteContext';
import apiRequest, { appendSiteIdParam, downloadFile } from '@/services/api';

/**
 * Hook that returns site-filtered versions of apiRequest and downloadFile.
 * When a super_admin has selected a specific site, the siteId query parameter
 * is automatically appended to all requests. When "All Sites" (null) is selected,
 * no siteId parameter is sent.
 *
 * For site-scoped admins, the backend already filters by their assigned site
 * via middleware, so no client-side siteId parameter is needed.
 *
 * @returns {{ siteApiRequest: Function, siteDownloadFile: Function, currentSiteId: number|null }}
 */
function useSiteApiRequest() {
	const { currentSiteId, isSuperAdmin } = useSite();

	// Only append siteId for super_admin with a specific site selected
	const effectiveSiteId = isSuperAdmin ? currentSiteId : null;

	const siteApiRequest = useCallback(
		(path, options = {}) => {
			const filteredPath = appendSiteIdParam(path, effectiveSiteId);
			return apiRequest(filteredPath, options);
		},
		[effectiveSiteId],
	);

	const siteDownloadFile = useCallback(
		(url, fallbackFileName) => {
			const filteredUrl = appendSiteIdParam(url, effectiveSiteId);
			return downloadFile(filteredUrl, fallbackFileName);
		},
		[effectiveSiteId],
	);

	return { siteApiRequest, siteDownloadFile, currentSiteId: effectiveSiteId };
}

export default useSiteApiRequest;
