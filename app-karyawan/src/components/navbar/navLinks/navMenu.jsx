import { useState, useCallback, useEffect } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
// MUI
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Divider from '@mui/material/Divider';
import Collapse from '@mui/material/Collapse';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
// Icons
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

import { NavItem, NavItemButton } from './navItem';

/**
 * Recursively checks if any href in `items` matches the current `pathname`.
 */
const deepMatch = ({ items, pathname }) =>
	items.some((el) => {
		if (el?.type === 'group') {
			return deepMatch({ items: el?.menuChildren ?? [], pathname });
		}
		return el?.href && pathname.includes(el.href);
	});

/**
 * A nested group rendered as an accordion-style collapsible block
 * inside the top-level dropdown Menu.
 */
function MenuGroup({ title, Icon, menuChildren, level = 0 }) {
	const [open, setOpen] = useState(false);
	const location = useLocation();
	const pathname = location.pathname + location.hash;
	const isActive = deepMatch({ items: menuChildren, pathname });

	const handleToggle = useCallback((e) => {
		e.stopPropagation();
		setOpen((prev) => !prev);
	}, []);

	// Auto-open group if a child is active
	useEffect(() => {
		if (isActive) setOpen(true);
	}, [isActive]);

	return (
		<>
			<ListItemButton
				onClick={handleToggle}
				dense
				sx={{
					borderRadius: 1.5,
					mx: 0.5,
					px: 1.5,
					py: 0.75,
					gap: 1,
					color: isActive ? 'primary.main' : 'text.primary',
					fontWeight: isActive ? 600 : 400,
					pl: level > 0 ? 2 + level * 1.5 : 1.5,
				}}
			>
				{Icon && (
					<ListItemIcon sx={{ minWidth: 28 }}>
						<Icon sx={{ fontSize: 18, color: isActive ? 'primary.main' : 'text.secondary' }} />
					</ListItemIcon>
				)}
				<ListItemText
					primary={title}
					primaryTypographyProps={{
						fontSize: 13,
						fontWeight: isActive ? 600 : 500,
					}}
				/>
				{open ? (
					<ExpandLessIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
				) : (
					<ExpandMoreIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
				)}
			</ListItemButton>
			<Collapse in={open} unmountOnExit>
				<List disablePadding>
					{menuChildren.map((child, i) => {
						if (child.type === 'group') {
							return (
								<MenuGroup
									key={child.id ?? i}
									title={child.title}
									Icon={child.Icon}
									menuChildren={child.menuChildren ?? []}
									level={level + 1}
								/>
							);
						}
						return (
							<MenuLeafItem
								key={child.id ?? i}
								href={child.href}
								title={child.title}
								Icon={child.Icon}
								level={level + 1}
							/>
						);
					})}
				</List>
			</Collapse>
		</>
	);
}

/**
 * A single leaf item inside the dropdown Menu.
 */
function MenuLeafItem({ href, title, Icon, level = 0 }) {
	const location = useLocation();
	const pathname = location.pathname + location.hash;
	const isActive = href && pathname.includes(href);

	return (
		<MenuItem
			component={RouterLink}
			to={href}
			selected={Boolean(isActive)}
			dense
			sx={{
				borderRadius: 1.5,
				mx: 0.5,
				fontSize: 13,
				pl: level > 0 ? 1.5 + level * 1.5 : 1.5,
				gap: 1,
				color: isActive ? 'primary.main' : 'text.primary',
				fontWeight: isActive ? 600 : 400,
				'&.Mui-selected': {
					bgcolor: 'primary.50',
					'&:hover': { bgcolor: 'primary.100' },
				},
			}}
		>
			{Icon && (
				<ListItemIcon sx={{ minWidth: 28 }}>
					<Icon sx={{ fontSize: 18, color: isActive ? 'primary.main' : 'text.secondary' }} />
				</ListItemIcon>
			)}
			{title}
		</MenuItem>
	);
}

/**
 * Top-level nav group button with a MUI Menu dropdown.
 * - Opens on click (not hover) for reliable touch + mouse support.
 * - Closes on outside click, Escape key, or item selection.
 * - Renders via portal (no clipping from AppBar overflow).
 * - Full keyboard navigation via MUI Menu.
 */
function NavMenu({ minWidth = 220, menuChildren = [], Icon, title }) {
	const [anchorEl, setAnchorEl] = useState(null);
	const open = Boolean(anchorEl);
	const location = useLocation();
	const pathname = location.pathname + location.hash;
	const isActive = deepMatch({ items: menuChildren, pathname });

	const handleOpen = useCallback((e) => {
		setAnchorEl(e.currentTarget);
	}, []);

	const handleClose = useCallback(() => {
		setAnchorEl(null);
	}, []);

	// Close dropdown on route change
	useEffect(() => {
		handleClose();
	}, [location, handleClose]);

	return (
		<>
			<NavItemButton
				selected={isActive}
				onClick={handleOpen}
				aria-haspopup="true"
				aria-expanded={open}
				aria-controls={open ? `nav-menu-${title}` : undefined}
			>
				<NavItem showExpand Icon={Icon} title={title} selected={isActive} expanded={open} />
			</NavItemButton>

			<Menu
				id={`nav-menu-${title}`}
				anchorEl={anchorEl}
				open={open}
				onClose={handleClose}
				onClick={handleClose}
				disablePortal={false}
				elevation={4}
				transformOrigin={{ horizontal: 'left', vertical: 'top' }}
				anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
				slotProps={{
					paper: {
						sx: {
							minWidth,
							mt: 0.5,
							borderRadius: 2,
							border: '1px solid',
							borderColor: 'divider',
							'& .MuiList-root': { py: 0.5 },
						},
					},
				}}
			>
				{menuChildren.map((item, i) => {
					const isLast = i === menuChildren.length - 1;
					if (item.type === 'group') {
						return (
							<span key={item.id ?? i}>
								<MenuGroup title={item.title} Icon={item.Icon} menuChildren={item.menuChildren ?? []} />
								{!isLast && <Divider sx={{ my: 0.5 }} />}
							</span>
						);
					}
					return <MenuLeafItem key={item.id ?? i} href={item.href} title={item.title} Icon={item.Icon} />;
				})}
			</Menu>
		</>
	);
}

export default NavMenu;
