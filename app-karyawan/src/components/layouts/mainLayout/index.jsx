import { useCallback, useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import withScrollTopFabButton from '@hocs/withScrollTopFabButton';
import WidthPageTransition from '@hocs/widthPageTransition';

import { useSelector } from '@/store';
import { selectThemeConfig } from '@/store/theme/selectors';
import { useAuth } from '@/contexts/authContext';
// MUI
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Fab from '@mui/material/Fab';
// Icons
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

import navItems from './navItems';
import { filterNavItemsByRole, flattenNavItems, isNavItemActive } from '@/utils/navigation';
import useRecentPages from '@/hooks/useRecentPages';

// Components
import Footer from '@/components/footer';
import MainHeader from '@/components/mainHeader';
import Breadcrumb from '@/components/breadcrumb';
import CommandPalette from '@/components/commandPalette';

function FabButton() {
	return (
		<Fab size="small" aria-label="Kembali ke atas" color="primary">
			<KeyboardArrowUpIcon />
		</Fab>
	);
}

function MainLayout({ container = 'lg', pb = true }) {
	const location = useLocation();
	const { pageTransitions, stickyHeader } = useSelector(selectThemeConfig);
	const { user } = useAuth();
	const { recent, pushRecent } = useRecentPages();
	const [paletteOpen, setPaletteOpen] = useState(false);

	const filteredNavItems = useMemo(() => filterNavItemsByRole(navItems, user?.role), [user?.role]);
	const flatNavItems = useMemo(() => flattenNavItems(filteredNavItems), [filteredNavItems]);
	const activePage = useMemo(
		() => flatNavItems.find((page) => isNavItemActive(page, location.pathname)),
		[flatNavItems, location.pathname],
	);

	const handleOpenPalette = useCallback(() => setPaletteOpen(true), []);
	const handleClosePalette = useCallback(() => setPaletteOpen(false), []);

	useEffect(() => {
		if (activePage) {
			pushRecent({ href: activePage.href, title: activePage.title, subtitle: activePage.subtitle });
		}
	}, [activePage, pushRecent]);

	useEffect(() => {
		const handleKeyDown = (event) => {
			const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';

			if (!isShortcut) {
				return;
			}

			event.preventDefault();
			setPaletteOpen((prev) => !prev);
		};

		window.addEventListener('keydown', handleKeyDown);

		return () => window.removeEventListener('keydown', handleKeyDown);
	}, []);

	return (
		<Box display="flex" minHeight="100vh" flexDirection="column" className="app-shell-root">
			<Box className="app-shell-header no-print">
				<MainHeader navItems={filteredNavItems} sticky={stickyHeader} onOpenPalette={handleOpenPalette} />
			</Box>
			<Breadcrumb navItems={filteredNavItems} maxWidth={container} />
			<Container
				maxWidth={container}
				component="main"
				className="app-shell-main"
				sx={{
					flex: '1 0 auto',
					...(pb && {
						pb: 5,
					}),
				}}
			>
				{pageTransitions ? (
					<WidthPageTransition location={location.key}>
						<Outlet />
					</WidthPageTransition>
				) : (
					<Outlet />
				)}
			</Container>
			<Box className="app-shell-fab no-print">{withScrollTopFabButton(FabButton)}</Box>
			<Box className="app-shell-footer no-print">
				<Footer />
			</Box>
			<CommandPalette
				open={paletteOpen}
				onClose={handleClosePalette}
				navItems={filteredNavItems}
				recent={recent}
			/>
		</Box>
	);
}

export default MainLayout;
