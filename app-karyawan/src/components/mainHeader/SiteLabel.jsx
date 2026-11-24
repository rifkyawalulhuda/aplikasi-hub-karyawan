import Chip from '@mui/material/Chip';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';

import { useSite } from '@/contexts/siteContext';

function SiteLabel() {
	const { siteName, isSuperAdmin } = useSite();

	if (isSuperAdmin || !siteName) {
		return null;
	}

	return (
		<Chip
			icon={<LocationOnOutlinedIcon fontSize="small" />}
			label={siteName}
			size="small"
			variant="outlined"
			color="primary"
			sx={{
				height: 32,
				maxWidth: 180,
				fontSize: '0.75rem',
				fontWeight: 600,
				borderRadius: 2,
				'& .MuiChip-label': { px: 1 },
			}}
		/>
	);
}

export default SiteLabel;
