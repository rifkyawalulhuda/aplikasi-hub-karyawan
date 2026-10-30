import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
// MUI
import Popover from '@mui/material/Popover';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ButtonBase from '@mui/material/ButtonBase';

import { NavItem, NavItemButton, navAccent, navAccentSoft } from './navItem';
import { isGroupActive, isNavItemActive } from '@/utils/navigation';

const MAX_COLUMNS = 3;

function groupBySection(menuChildren) {
	const sections = new Map();

	menuChildren.forEach((item) => {
		const key = item.section || 'Lainnya';

		if (!sections.has(key)) {
			sections.set(key, []);
		}
		sections.get(key).push(item);
	});

	return Array.from(sections, ([name, items]) => ({ name, items }));
}

function MegaMenuItem({ item, active, onSelect }) {
	const ItemIcon = item.Icon;

	return (
		<ButtonBase
			component={RouterLink}
			to={item.href}
			onClick={onSelect}
			data-mega-item
			aria-current={active ? 'page' : undefined}
			sx={{
				display: 'flex',
				alignItems: 'flex-start',
				gap: 1.25,
				width: '100%',
				px: 1.5,
				py: 1,
				borderRadius: 1.5,
				textAlign: 'left',
				color: (theme) => (active ? navAccent(theme) : theme.palette.text.primary),
				bgcolor: (theme) => (active ? navAccentSoft(theme) : 'transparent'),
				transition: 'background-color 120ms ease',
				'&:hover': { bgcolor: (theme) => navAccentSoft(theme) },
				'&:focus-visible': {
					outline: (theme) => `2px solid ${navAccent(theme)}`,
					outlineOffset: -2,
				},
			}}
		>
			{ItemIcon && (
				<Box sx={{ display: 'flex', pt: 0.25 }}>
					<ItemIcon
						sx={{
							fontSize: 20,
							color: (theme) => (active ? navAccent(theme) : theme.palette.text.tertiary),
						}}
					/>
				</Box>
			)}
			<Box sx={{ minWidth: 0 }}>
				<Typography
					component="span"
					display="block"
					fontSize="0.84rem"
					fontWeight={active ? 600 : 500}
					lineHeight={1.35}
				>
					{item.title}
				</Typography>
				{item.description && (
					<Typography
						component="span"
						display="block"
						fontSize="0.72rem"
						color="text.secondary"
						lineHeight={1.4}
						mt={0.25}
					>
						{item.description}
					</Typography>
				)}
			</Box>
		</ButtonBase>
	);
}

function NavMenu({ menuChildren = [], Icon, title, fullTitle }) {
	const [anchorEl, setAnchorEl] = useState(null);
	const paperRef = useRef(null);
	const { pathname } = useLocation();
	const open = Boolean(anchorEl);
	const active = isGroupActive(menuChildren, pathname);
	const sections = useMemo(() => groupBySection(menuChildren), [menuChildren]);
	const columns = Math.max(1, Math.min(sections.length, MAX_COLUMNS));
	const accessibleTitle = fullTitle || title;

	const handleOpen = useCallback((event) => {
		setAnchorEl(event.currentTarget);
	}, []);

	const handleClose = useCallback(() => {
		setAnchorEl(null);
	}, []);

	useEffect(() => {
		handleClose();
	}, [pathname, handleClose]);

	const focusFirstItem = useCallback(() => {
		const firstItem = paperRef.current?.querySelector('[data-mega-item]');
		firstItem?.focus({ preventScroll: true });
	}, []);

	const handleKeyDown = useCallback((event) => {
		const nodes = Array.from(event.currentTarget.querySelectorAll('[data-mega-item]'));

		if (nodes.length === 0) {
			return;
		}

		const currentIndex = nodes.indexOf(document.activeElement);
		const { key } = event;

		if (key === 'ArrowDown' || key === 'ArrowRight') {
			event.preventDefault();
			nodes[(currentIndex + 1) % nodes.length]?.focus();
			return;
		}

		if (key === 'ArrowUp' || key === 'ArrowLeft') {
			event.preventDefault();
			nodes[(currentIndex - 1 + nodes.length) % nodes.length]?.focus();
			return;
		}

		if (key === 'Home') {
			event.preventDefault();
			nodes[0]?.focus();
			return;
		}

		if (key === 'End') {
			event.preventDefault();
			nodes[nodes.length - 1]?.focus();
		}
	}, []);

	return (
		<>
			<NavItemButton
				selected={active}
				onClick={handleOpen}
				aria-haspopup="true"
				aria-expanded={open}
				aria-controls={open ? `nav-menu-${title}` : undefined}
				aria-label={accessibleTitle}
				aria-current={active ? 'true' : undefined}
			>
				<NavItem
					showExpand
					Icon={Icon}
					title={title}
					selected={active}
					expanded={open}
					label={accessibleTitle}
				/>
			</NavItemButton>

			<Popover
				id={`nav-menu-${title}`}
				open={open}
				anchorEl={anchorEl}
				onClose={handleClose}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
				transformOrigin={{ vertical: 'top', horizontal: 'left' }}
				TransitionProps={{ onEntered: focusFirstItem }}
				ModalProps={{ disableAutoFocus: true }}
				PaperProps={{
					sx: {
						mt: 1,
						p: 1,
						borderRadius: 2.5,
						border: '1px solid',
						borderColor: 'border',
						boxShadow: '0px 16px 40px rgba(15, 23, 42, 0.14)',
						maxWidth: 'min(92vw, 720px)',
					},
				}}
			>
				<Box
					ref={paperRef}
					onKeyDown={handleKeyDown}
					sx={{
						display: 'grid',
						gridTemplateColumns: { xs: '1fr', md: `repeat(${columns}, minmax(210px, 1fr))` },
						gap: 1,
					}}
				>
					{sections.map((section) => (
						<Stack key={section.name} spacing={0.25} sx={{ minWidth: 0 }}>
							<Typography
								sx={{
									px: 1.5,
									pt: 0.75,
									pb: 0.5,
									fontSize: '0.66rem',
									fontWeight: 700,
									letterSpacing: '0.06em',
									textTransform: 'uppercase',
									color: 'text.tertiary',
								}}
							>
								{section.name}
							</Typography>
							{section.items.map((item) => (
								<MegaMenuItem
									key={item.id}
									item={item}
									active={isNavItemActive(item, pathname)}
									onSelect={handleClose}
								/>
							))}
						</Stack>
					))}
				</Box>
			</Popover>
		</>
	);
}

export default NavMenu;
