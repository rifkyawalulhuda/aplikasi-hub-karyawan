import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import SearchIcon from '@mui/icons-material/Search';

import navItems from '@/components/layouts/mainLayout/navItems';
import apiRequest from '@/services/api';

function flattenNavItems(items, parents = []) {
	return items.flatMap((item) => {
		const currentParents = item.type === 'group' ? [...parents, item.title] : parents;

		if (item.menuChildren?.length) {
			return flattenNavItems(item.menuChildren, currentParents);
		}

		if (item.type !== 'item' || !item.href) {
			return [];
		}

		return [
			{
				id: `page-${item.id}`,
				type: 'page',
				group: 'Halaman',
				title: item.title,
				subtitle: currentParents.join(' / '),
				href: item.href,
			},
		];
	});
}

function normalizeString(value = '') {
	return String(value).trim().replace(/\s+/g, ' ').toLowerCase();
}

function SearchBar() {
	const navigate = useNavigate();
	const [inputValue, setInputValue] = useState('');
	const [selectedOption, setSelectedOption] = useState(null);
	const [remoteOptions, setRemoteOptions] = useState([]);
	const [loading, setLoading] = useState(false);

	const pageOptions = useMemo(() => flattenNavItems(navItems), []);
	const normalizedQuery = normalizeString(inputValue);

	const filteredPageOptions = useMemo(() => {
		if (!normalizedQuery) {
			return pageOptions;
		}

		return pageOptions.filter((item) =>
			[item.title, item.subtitle].some((value) => normalizeString(value).includes(normalizedQuery)),
		);
	}, [normalizedQuery, pageOptions]);

	useEffect(() => {
		let active = true;

		if (normalizedQuery.length < 2) {
			setRemoteOptions([]);
			setLoading(false);
			return () => {
				active = false;
			};
		}

		setLoading(true);
		const timeoutId = window.setTimeout(async () => {
			try {
				const response = await apiRequest(`/global-search?q=${encodeURIComponent(inputValue.trim())}`);

				if (!active) {
					return;
				}

				setRemoteOptions(response.items || []);
			} catch {
				if (active) {
					setRemoteOptions([]);
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
	}, [inputValue, normalizedQuery]);

	const options = useMemo(() => {
		const deduped = new Map();

		[...filteredPageOptions, ...remoteOptions].forEach((item) => {
			const key = `${item.type}-${item.href}-${item.title}`;

			if (!deduped.has(key)) {
				deduped.set(key, item);
			}
		});

		return Array.from(deduped.values()).slice(0, 24);
	}, [filteredPageOptions, remoteOptions]);

	const handleNavigate = (option) => {
		if (!option?.href) {
			return;
		}

		setSelectedOption(null);
		setInputValue('');
		navigate(option.href);
	};

	return (
		<Stack
			display={{
				xs: 'none',
				md: 'inline-flex',
			}}
			sx={{ width: { md: 310, lg: 360 } }}
		>
			<Autocomplete
				fullWidth
				openOnFocus
				autoHighlight
				filterOptions={(items) => items}
				options={options}
				value={selectedOption}
				inputValue={inputValue}
				loading={loading}
				noOptionsText={
					normalizedQuery ? 'Tidak ada hasil pencarian.' : 'Ketik untuk mencari halaman atau data.'
				}
				getOptionLabel={(option) => option?.title || ''}
				groupBy={(option) => option.group || 'Lainnya'}
				onInputChange={(_event, nextValue) => {
					setInputValue(nextValue);
				}}
				onChange={(_event, option) => {
					setSelectedOption(option);
					handleNavigate(option);
				}}
				renderGroup={(params) => (
					<li key={params.key}>
						<Typography
							sx={{
								px: 1.5,
								py: 0.75,
								fontSize: '0.72rem',
								fontWeight: 700,
								color: '#5D738B',
								textTransform: 'uppercase',
								letterSpacing: '0.06em',
							}}
						>
							{params.group}
						</Typography>
						<ul style={{ padding: 0, margin: 0 }}>{params.children}</ul>
					</li>
				)}
				renderOption={(props, option) => (
					<Box component="li" {...props} key={option.id}>
						<Stack spacing={0.25} sx={{ py: 0.4 }}>
							<Stack direction="row" spacing={1} alignItems="center">
								<Typography variant="body2" sx={{ fontWeight: 600, color: '#123B66' }}>
									{option.title}
								</Typography>
								<Typography variant="caption" color="text.secondary">
									{option.type === 'page' ? 'Halaman' : 'Data'}
								</Typography>
							</Stack>
							{option.subtitle ? (
								<Typography variant="caption" color="text.secondary">
									{option.subtitle}
								</Typography>
							) : null}
						</Stack>
					</Box>
				)}
				renderInput={(params) => (
					<TextField
						{...params}
						size="small"
						color="primary"
						placeholder="Pencarian"
						InputProps={{
							...params.InputProps,
							endAdornment: (
								<InputAdornment position="end">
									{loading ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
									<IconButton color="primary" edge="end" tabIndex={-1}>
										<SearchIcon />
									</IconButton>
								</InputAdornment>
							),
							sx: {
								pr: 0,
								bgcolor: 'background.paper',
								borderRadius: '20px',
								overflow: 'hidden',
								height: 40,
							},
						}}
					/>
				)}
				slotProps={{
					popper: {
						sx: {
							'& .MuiAutocomplete-paper': {
								mt: 1,
								borderRadius: 2,
								boxShadow: '0px 12px 24px rgba(15, 23, 42, 0.16)',
							},
						},
					},
				}}
			/>
		</Stack>
	);
}

export default SearchBar;
