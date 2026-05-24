import { useEffect, useState } from 'react';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';

import { useSite } from '@/contexts/siteContext';
import apiRequest from '@/services/api';

function SiteSelector() {
	const { isSuperAdmin, selectedSiteId, setSelectedSiteId } = useSite();
	const [sites, setSites] = useState([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!isSuperAdmin) return undefined;

		let cancelled = false;

		async function fetchSites() {
			setLoading(true);
			try {
				const data = await apiRequest('/master/sites');
				if (!cancelled) {
					setSites(Array.isArray(data) ? data : data?.data || []);
				}
			} catch {
				if (!cancelled) {
					setSites([]);
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		}

		fetchSites();

		return () => {
			cancelled = true;
		};
	}, [isSuperAdmin]);

	if (!isSuperAdmin) return null;

	return (
		<FormControl size="small" sx={{ minWidth: 140, maxWidth: 200 }}>
			<Select
				value={selectedSiteId ?? ''}
				onChange={(e) => {
					const val = e.target.value;
					setSelectedSiteId(val === '' ? null : Number(val));
				}}
				displayEmpty
				startAdornment={<LocationOnOutlinedIcon fontSize="small" sx={{ mr: 0.5, color: 'primary.main' }} />}
				sx={{
					fontSize: '0.85rem',
					'& .MuiSelect-select': {
						py: 0.75,
					},
				}}
			>
				<MenuItem value="">
					<Typography variant="body2" fontWeight={500}>
						Semua Site
					</Typography>
				</MenuItem>
				{loading && (
					<MenuItem disabled>
						<Box display="flex" alignItems="center" gap={1}>
							<CircularProgress size={16} />
							<Typography variant="body2">Memuat...</Typography>
						</Box>
					</MenuItem>
				)}
				{sites.map((site) => (
					<MenuItem key={site.id} value={site.id}>
						<Typography variant="body2">{site.name}</Typography>
					</MenuItem>
				))}
			</Select>
		</FormControl>
	);
}

export default SiteSelector;
