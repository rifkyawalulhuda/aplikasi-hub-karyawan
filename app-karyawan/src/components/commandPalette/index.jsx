import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// MUI
import Dialog from '@mui/material/Dialog';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import InputBase from '@mui/material/InputBase';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import ButtonBase from '@mui/material/ButtonBase';
// Icons
import SearchIcon from '@mui/icons-material/Search';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import SubdirectoryArrowLeftRoundedIcon from '@mui/icons-material/SubdirectoryArrowLeftRounded';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';

import { useAuth } from '@/contexts/authContext';
import { useDispatch, useSelector } from '@/store';
import { setConfigKey } from '@/store/theme';
import { selectThemeMode } from '@/store/theme/selectors';
import apiRequest from '@/services/api';
import { flattenNavItems } from '@/utils/navigation';

const DATA_SEARCH_MIN = 2;
const RESULT_LIMIT = 24;

function normalizeString(value = '') {
	return String(value).trim().replace(/\s+/g, ' ').toLowerCase();
}

function PaletteRow({ item, active, onHover, onRun }) {
	const ItemIcon = item.Icon;

	return (
		<ButtonBase
			id={`palette-option-${item.key}`}
			role="option"
			aria-selected={active}
			onMouseMove={onHover}
			onClick={onRun}
			sx={{
				display: 'flex',
				alignItems: 'center',
				gap: 1.25,
				width: '100%',
				minHeight: 44,
				px: 2,
				py: 0.75,
				textAlign: 'left',
				bgcolor: active ? 'rgba(21, 96, 189, 0.09)' : 'transparent',
				'&:hover': { bgcolor: 'rgba(21, 96, 189, 0.09)' },
			}}
		>
			<Box sx={{ display: 'flex', color: active ? 'primary.main' : 'text.tertiary' }}>
				{ItemIcon ? <ItemIcon sx={{ fontSize: 19 }} /> : <DescriptionOutlinedIcon sx={{ fontSize: 19 }} />}
			</Box>
			<Box sx={{ minWidth: 0, flex: 1 }}>
				<Typography component="span" display="block" fontSize="0.85rem" fontWeight={active ? 600 : 500} noWrap>
					{item.title}
				</Typography>
				{item.subtitle ? (
					<Typography component="span" display="block" fontSize="0.72rem" color="text.secondary" noWrap>
						{item.subtitle}
					</Typography>
				) : null}
			</Box>
			{active && <SubdirectoryArrowLeftRoundedIcon sx={{ fontSize: 16, color: 'text.tertiary' }} />}
		</ButtonBase>
	);
}

function CommandPalette({ open, onClose, navItems, recent }) {
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const mode = useSelector(selectThemeMode);
	const { logout } = useAuth();

	const [query, setQuery] = useState('');
	const [activeIndex, setActiveIndex] = useState(0);
	const [dataResults, setDataResults] = useState([]);
	const [loading, setLoading] = useState(false);
	const listRef = useRef(null);

	const pages = useMemo(() => flattenNavItems(navItems), [navItems]);

	const actions = useMemo(
		() => [
			{
				key: 'action-create-slip',
				title: 'Buat Lembar Pengiriman',
				subtitle: 'Aksi cepat',
				Icon: LocalShippingOutlinedIcon,
				run: () => navigate('/dokumen/lembar-pengiriman'),
			},
			{
				key: 'action-toggle-theme',
				title: mode === 'dark' ? 'Ganti ke mode terang' : 'Ganti ke mode gelap',
				subtitle: 'Aksi cepat',
				Icon: DarkModeOutlinedIcon,
				run: () => dispatch(setConfigKey({ key: 'mode', value: mode === 'dark' ? 'light' : 'dark' })),
			},
			{
				key: 'action-logout',
				title: 'Keluar dari akun',
				subtitle: 'Aksi cepat',
				Icon: ExitToAppIcon,
				run: () => {
					logout();
					navigate('/login', { replace: true });
				},
			},
		],
		[dispatch, logout, mode, navigate],
	);

	const normalizedQuery = normalizeString(query);

	useEffect(() => {
		if (!open) {
			setQuery('');
			setActiveIndex(0);
			setDataResults([]);
		}
	}, [open]);

	useEffect(() => {
		let active = true;

		if (!open || normalizedQuery.length < DATA_SEARCH_MIN) {
			setDataResults([]);
			setLoading(false);
			return () => {
				active = false;
			};
		}

		setLoading(true);
		const timeoutId = window.setTimeout(async () => {
			try {
				const response = await apiRequest(`/global-search?q=${encodeURIComponent(query.trim())}`);

				if (active) {
					setDataResults(response.items || []);
				}
			} catch {
				if (active) {
					setDataResults([]);
				}
			} finally {
				if (active) {
					setLoading(false);
				}
			}
		}, 250);

		return () => {
			active = false;
			window.clearTimeout(timeoutId);
		};
	}, [open, query, normalizedQuery]);

	const groups = useMemo(() => {
		const matches = (item) =>
			!normalizedQuery ||
			[item.title, item.subtitle].some((value) => normalizeString(value).includes(normalizedQuery));

		const pageItems = pages.filter(matches).map((page) => ({
			key: `page-${page.id}`,
			title: page.title,
			subtitle: page.subtitle,
			Icon: page.Icon,
			run: () => navigate(page.href),
		}));

		const recentItems = recent.filter(matches).map((entry) => ({
			key: `recent-${entry.href}`,
			title: entry.title,
			subtitle: entry.subtitle,
			Icon: HistoryRoundedIcon,
			run: () => navigate(entry.href),
		}));

		const dataItems = dataResults.slice(0, RESULT_LIMIT).map((entry, index) => ({
			key: `data-${entry.id ?? index}`,
			title: entry.title,
			subtitle: entry.subtitle,
			Icon: DescriptionOutlinedIcon,
			run: () => entry.href && navigate(entry.href),
		}));

		const actionItems = normalizedQuery ? [] : actions;

		return [
			{ label: 'Aksi Cepat', items: actionItems },
			{ label: 'Terakhir Dibuka', items: recentItems },
			{ label: 'Halaman', items: pageItems },
			{ label: 'Data', items: dataItems },
		].filter((group) => group.items.length > 0);
	}, [actions, dataResults, navigate, normalizedQuery, pages, recent]);

	const flatItems = useMemo(() => groups.flatMap((group) => group.items), [groups]);

	useEffect(() => {
		setActiveIndex(0);
	}, [normalizedQuery, groups.length]);

	useEffect(() => {
		if (!open) {
			return;
		}

		const node = listRef.current?.querySelector(`#palette-option-${flatItems[activeIndex]?.key}`);

		node?.scrollIntoView({ block: 'nearest' });
	}, [activeIndex, flatItems, open]);

	const runItem = useCallback(
		(item) => {
			if (!item) {
				return;
			}

			onClose();
			item.run();
		},
		[onClose],
	);

	const handleKeyDown = useCallback(
		(event) => {
			if (event.key === 'ArrowDown') {
				event.preventDefault();
				setActiveIndex((prev) => (flatItems.length === 0 ? 0 : (prev + 1) % flatItems.length));
				return;
			}

			if (event.key === 'ArrowUp') {
				event.preventDefault();
				setActiveIndex((prev) =>
					flatItems.length === 0 ? 0 : (prev - 1 + flatItems.length) % flatItems.length,
				);
				return;
			}

			if (event.key === 'Enter') {
				event.preventDefault();
				runItem(flatItems[activeIndex]);
			}
		},
		[activeIndex, flatItems, runItem],
	);

	return (
		<Dialog
			open={open}
			onClose={onClose}
			fullWidth
			maxWidth="sm"
			aria-labelledby="command-palette-title"
			PaperProps={{
				sx: {
					borderRadius: 3,
					overflow: 'hidden',
					alignSelf: 'flex-start',
					mt: { xs: 4, md: 10 },
					boxShadow: '0px 24px 64px rgba(15, 23, 42, 0.24)',
				},
			}}
			sx={{ '& .MuiDialog-container': { alignItems: 'flex-start' } }}
		>
			<Box
				sx={{
					display: 'flex',
					alignItems: 'center',
					gap: 1.25,
					px: 2,
					py: 1.25,
					borderBottom: 1,
					borderColor: 'border',
				}}
			>
				<SearchIcon sx={{ fontSize: 20, color: 'text.tertiary' }} />
				<InputBase
					autoFocus
					fullWidth
					value={query}
					onChange={(event) => setQuery(event.target.value)}
					onKeyDown={handleKeyDown}
					placeholder="Cari halaman, data, atau aksi..."
					role="combobox"
					aria-expanded
					aria-controls="command-palette-list"
					aria-autocomplete="list"
					aria-activedescendant={
						flatItems[activeIndex] ? `palette-option-${flatItems[activeIndex].key}` : undefined
					}
					inputProps={{ 'aria-label': 'Cari halaman, data, atau aksi', id: 'command-palette-title' }}
					sx={{ fontSize: '0.9rem' }}
				/>
				{loading ? <CircularProgress size={16} /> : null}
			</Box>

			<Box
				id="command-palette-list"
				ref={listRef}
				role="listbox"
				aria-label="Hasil pencarian"
				sx={{ maxHeight: 'min(60vh, 460px)', overflowY: 'auto', py: 1 }}
			>
				{groups.length === 0 && !loading ? (
					<Typography
						sx={{ px: 2, py: 3, textAlign: 'center', fontSize: '0.82rem', color: 'text.secondary' }}
					>
						Tidak ada hasil untuk &ldquo;{query}&rdquo;.
					</Typography>
				) : null}

				{groups.map((group) => (
					<Box key={group.label} sx={{ mb: 0.5 }}>
						<Typography
							sx={{
								px: 2,
								pt: 1,
								pb: 0.5,
								fontSize: '0.66rem',
								fontWeight: 700,
								letterSpacing: '0.06em',
								textTransform: 'uppercase',
								color: 'text.tertiary',
							}}
						>
							{group.label}
						</Typography>
						{group.items.map((item) => {
							const index = flatItems.findIndex((entry) => entry.key === item.key);

							return (
								<PaletteRow
									key={item.key}
									item={item}
									active={index === activeIndex}
									onHover={() => setActiveIndex(index)}
									onRun={() => runItem(item)}
								/>
							);
						})}
					</Box>
				))}
			</Box>

			<Divider />
			<Stack direction="row" spacing={2} sx={{ px: 2, py: 1, color: 'text.tertiary' }}>
				<Typography sx={{ fontSize: '0.68rem' }}>↑↓ navigasi</Typography>
				<Typography sx={{ fontSize: '0.68rem' }}>↵ buka</Typography>
				<Typography sx={{ fontSize: '0.68rem' }}>esc tutup</Typography>
			</Stack>
		</Dialog>
	);
}

export default CommandPalette;
