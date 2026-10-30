import { useCallback, useState } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
// MUI
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ButtonBase from '@mui/material/ButtonBase';
// Icons
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { isGroupActive, isNavItemActive } from '@/utils/navigation';
import { navAccent, navAccentSoft } from './navLinks/navItem';

function DrawerLeaf({ item, pathname, onNavigate, nested = false }) {
	const ItemIcon = item.Icon;
	const active = isNavItemActive(item, pathname);

	return (
		<ButtonBase
			component={RouterLink}
			to={item.href}
			onClick={onNavigate}
			aria-current={active ? 'page' : undefined}
			sx={{
				display: 'flex',
				alignItems: 'center',
				gap: 1.25,
				width: '100%',
				minHeight: 44,
				pl: nested ? 4.5 : 2,
				pr: 2,
				borderRadius: 1.5,
				textAlign: 'left',
				color: (theme) => (active ? navAccent(theme) : theme.palette.text.primary),
				bgcolor: (theme) => (active ? navAccentSoft(theme) : 'transparent'),
				fontWeight: active ? 600 : 400,
				'&:hover': { bgcolor: (theme) => navAccentSoft(theme) },
			}}
		>
			{ItemIcon && (
				<ItemIcon
					sx={{ fontSize: 18, color: (theme) => (active ? navAccent(theme) : theme.palette.text.tertiary) }}
				/>
			)}
			<Typography component="span" fontSize="0.85rem" fontWeight="inherit">
				{item.title}
			</Typography>
		</ButtonBase>
	);
}

function DrawerGroup({ item, pathname, onNavigate }) {
	const [expanded, setExpanded] = useState(() => isGroupActive(item.menuChildren, pathname));
	const ItemIcon = item.Icon;
	const active = isGroupActive(item.menuChildren, pathname);

	const handleToggle = useCallback(() => {
		setExpanded((prev) => !prev);
	}, []);

	return (
		<>
			<ButtonBase
				onClick={handleToggle}
				aria-expanded={expanded}
				sx={{
					display: 'flex',
					alignItems: 'center',
					gap: 1.25,
					width: '100%',
					minHeight: 44,
					px: 2,
					borderRadius: 1.5,
					color: (theme) => (active ? navAccent(theme) : theme.palette.text.primary),
					fontWeight: active ? 600 : 500,
					'&:hover': { bgcolor: (theme) => navAccentSoft(theme) },
				}}
			>
				{ItemIcon && (
					<ItemIcon
						sx={{
							fontSize: 18,
							color: (theme) => (active ? navAccent(theme) : theme.palette.text.tertiary),
						}}
					/>
				)}
				<Typography
					component="span"
					fontSize="0.85rem"
					fontWeight="inherit"
					sx={{ flex: 1, textAlign: 'left' }}
				>
					{item.title}
				</Typography>
				<ExpandMoreIcon
					sx={{
						fontSize: 18,
						color: 'text.tertiary',
						transition: 'transform 180ms ease',
						transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
					}}
				/>
			</ButtonBase>
			<Collapse in={expanded} unmountOnExit>
				<Stack spacing={0.25} sx={{ py: 0.5 }}>
					{(item.menuChildren ?? []).map((child) =>
						child.type === 'group' ? (
							<DrawerGroup key={child.id} item={child} pathname={pathname} onNavigate={onNavigate} />
						) : (
							<DrawerLeaf
								key={child.id}
								item={child}
								pathname={pathname}
								onNavigate={onNavigate}
								nested
							/>
						),
					)}
				</Stack>
			</Collapse>
		</>
	);
}

function MobileNavDrawer({ open, onClose, navItems, onOpenSearch }) {
	const { pathname } = useLocation();

	return (
		<Drawer
			anchor="left"
			open={open}
			onClose={onClose}
			ModalProps={{ keepMounted: true }}
			PaperProps={{ sx: { width: 'min(88vw, 320px)', borderRadius: '0 16px 16px 0' } }}
		>
			<Stack direction="row" alignItems="center" justifyContent="space-between" px={2} py={1.5}>
				<Typography variant="subtitle1" fontWeight={600}>
					Menu
				</Typography>
				<IconButton onClick={onClose} aria-label="Tutup menu" size="small">
					<CloseRoundedIcon fontSize="small" />
				</IconButton>
			</Stack>
			<Divider />
			<Box component="nav" aria-label="Navigasi utama" sx={{ p: 1, overflowY: 'auto', flex: 1 }}>
				<Stack spacing={0.25}>
					{navItems.map((item) =>
						item.type === 'group' ? (
							<DrawerGroup key={item.id} item={item} pathname={pathname} onNavigate={onClose} />
						) : (
							<DrawerLeaf key={item.id} item={item} pathname={pathname} onNavigate={onClose} />
						),
					)}
				</Stack>
			</Box>
			<Divider />
			<ButtonBase
				onClick={() => {
					onClose();
					onOpenSearch();
				}}
				sx={{
					m: 1,
					minHeight: 44,
					borderRadius: 1.5,
					justifyContent: 'flex-start',
					px: 2,
					gap: 1.25,
					color: 'text.tertiary',
				}}
			>
				<Typography component="span" fontSize="0.85rem">
					Cari halaman atau data
				</Typography>
			</ButtonBase>
		</Drawer>
	);
}

export default MobileNavDrawer;
