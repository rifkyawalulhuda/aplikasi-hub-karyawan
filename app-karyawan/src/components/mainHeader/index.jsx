import { useCallback, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
// MUI
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import ButtonBase from '@mui/material/ButtonBase';
// Icons
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';

// assets
import logo from '@/assets/images/logo/png/Color_logotext2_nobg.png';

import NavLinks from '@/components/navbar/navLinks';
import MobileNavDrawer from '@/components/navbar/mobileNavDrawer';
import LoggedUser from './loggedUser';
import NotificationsButton from './notificationButton';
import SiteSelector from './SiteSelector';
import SiteLabel from './SiteLabel';

const SEARCH_HINT = 'Cari halaman atau data (Ctrl K)';

function MainHeader({ navItems = [], sticky = false, onOpenPalette }) {
	const [drawerOpen, setDrawerOpen] = useState(false);

	const handleOpenDrawer = useCallback(() => setDrawerOpen(true), []);
	const handleCloseDrawer = useCallback(() => setDrawerOpen(false), []);

	return (
		<AppBar
			position={sticky ? 'sticky' : 'static'}
			elevation={0}
			sx={{
				bgcolor: 'background.paper',
				borderBottom: 1,
				borderColor: 'border',
				backgroundImage: 'none',
			}}
		>
			<Container maxWidth="lg">
				<Stack direction="row" alignItems="center" spacing={2} sx={{ height: 64 }}>
					<IconButton
						onClick={handleOpenDrawer}
						aria-label="Buka menu navigasi"
						sx={{ display: { xs: 'inline-flex', lg: 'none' }, ml: -1 }}
					>
						<MenuRoundedIcon />
					</IconButton>

					<ButtonBase
						component={RouterLink}
						to="/dashboard"
						aria-label="Hub Karyawan - ke Dashboard"
						sx={{ borderRadius: 1.5, flexShrink: 0 }}
					>
						<Box
							component="img"
							src={logo}
							alt="Sankyu"
							sx={{ height: 24, width: 'auto', maxWidth: 132 }}
						/>
					</ButtonBase>

					<Box sx={{ flex: 1, minWidth: 0 }}>
						<NavLinks navItems={navItems} />
					</Box>

					<Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0 }}>
						<Tooltip title={SEARCH_HINT}>
							<IconButton onClick={onOpenPalette} aria-label={SEARCH_HINT} sx={{ width: 40, height: 40 }}>
								<SearchRoundedIcon sx={{ fontSize: 21 }} />
							</IconButton>
						</Tooltip>

						<Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1 }}>
							<SiteSelector />
							<SiteLabel />
						</Box>

						<NotificationsButton />

						<LoggedUser />
					</Stack>
				</Stack>
			</Container>

			<MobileNavDrawer
				open={drawerOpen}
				onClose={handleCloseDrawer}
				navItems={navItems}
				onOpenSearch={onOpenPalette}
			/>
		</AppBar>
	);
}

export default MainHeader;
