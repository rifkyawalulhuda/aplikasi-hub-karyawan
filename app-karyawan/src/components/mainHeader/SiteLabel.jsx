import Chip from '@mui/material/Chip';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';

import { useSite } from '@/contexts/siteContext';

function SiteLabel() {
	const { siteName, isSuperAdmin } = useSite();

	if (isSuperAdmin || !siteName) return null;

	return (
		<Chip
			icon={<LocationOnOutlinedIcon fontSize="small" />}
			label={siteName}
			size="small"
			variant="outlined"
			color="primary"
			sx={{ fontWeight: 500 }}
		/>
	);
}

export default SiteLabel;
