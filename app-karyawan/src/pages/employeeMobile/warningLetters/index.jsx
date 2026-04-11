import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';

import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import { alpha } from '@mui/material/styles';

import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import ClearRoundedIcon from '@mui/icons-material/ClearRounded';

import FeedbackState from '@/components/employeePortal/feedbackState';
import { useEmployeeAuth } from '@/contexts/employeeAuthContext';
import { employeeMeRequest } from '@/services/employeeApi';
import { formatLongDate, getEmployeePortalErrorMessage, handleEmployeeUnauthorized } from '@/utils/employeePortal';

const LEVEL_FILTERS = [
	{ label: 'Semua', value: 'ALL' },
	{ label: 'Surat Teguran', value: 'NONE' },
	{ label: 'SP 1', value: '1' },
	{ label: 'SP 2', value: '2' },
	{ label: 'SP 3', value: '3' },
];

function normalizeSearchValue(value = '') {
	return String(value).toLowerCase().replace(/\s+/g, ' ').trim();
}

function buildSearchText(item) {
	return [
		item.warningLevel ? `Surat Peringatan ${item.warningLevel}` : 'Surat Teguran',
		formatLongDate(item.letterDate),
		item.letterNumber,
		item.jobLevelName,
		item.violation,
		item.articleLabel,
		item.articleContent,
		item.superiorName,
		item.superiorJobLevelName,
	].join(' ');
}

function WarningLetterCard({ item }) {
	return (
		<Paper
			elevation={0}
			sx={{
				borderRadius: 4,
				overflow: 'hidden',
				border: (theme) => `1px solid ${theme.palette.employeeSurface.borderSoft}`,
				backgroundColor: (theme) => theme.palette.employeeSurface.card,
				boxShadow: (theme) => theme.palette.employeeSurface.shadowSoft,
			}}
		>
			<Accordion
				disableGutters
				elevation={0}
				square
				sx={{
					'&:before': { display: 'none' },
					backgroundColor: 'transparent',
				}}
			>
				<AccordionSummary
					expandIcon={<ExpandMoreRoundedIcon />}
					sx={{
						px: 2,
						py: 1.5,
						'& .MuiAccordionSummary-content': {
							my: 0,
						},
						'& .MuiAccordionSummary-expandIconWrapper': {
							color: 'text.secondary',
						},
					}}
				>
					<Stack spacing={1} sx={{ width: '100%' }}>
						<Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
							<Box sx={{ minWidth: 0, flex: 1 }}>
								<Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 800 }}>
									{item.warningLevel ? `Surat Peringatan ${item.warningLevel}` : 'Surat Teguran'}
								</Typography>
								<Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
									{formatLongDate(item.letterDate)} | {item.letterNumber}
								</Typography>
							</Box>
							<Chip
								label={item.jobLevelName || 'Dokumen'}
								color="primary"
								variant="outlined"
								size="small"
								sx={{ flexShrink: 0 }}
							/>
						</Stack>
						<Typography
							variant="caption"
							sx={{ color: 'text.secondary', letterSpacing: '0.04em', textTransform: 'uppercase' }}
						>
							Tap untuk lihat detail
						</Typography>
					</Stack>
				</AccordionSummary>
				<AccordionDetails sx={{ px: 2, pb: 2 }}>
					<Stack spacing={1.5}>
						<Box>
							<Typography variant="caption" sx={{ color: 'text.secondary', letterSpacing: '0.08em' }}>
								Pelanggaran
							</Typography>
							<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.6 }}>
								{item.violation}
							</Typography>
						</Box>
						{item.articleLabel || item.articleContent ? (
							<Box>
								<Typography variant="caption" sx={{ color: 'text.secondary', letterSpacing: '0.08em' }}>
									Pasal PKB
								</Typography>
								<Stack spacing={0.75} sx={{ mt: 0.5 }}>
									{item.articleLabel ? (
										<Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 700 }}>
											{item.articleLabel}
										</Typography>
									) : null}
									{item.articleContent ? (
										<Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
											{item.articleContent}
										</Typography>
									) : null}
								</Stack>
							</Box>
						) : null}
						<Box
							sx={{
								p: 1.5,
								borderRadius: 3,
								backgroundColor: (theme) => theme.palette.employeeSurface.muted,
							}}
						>
							<Typography variant="caption" sx={{ color: 'text.secondary', letterSpacing: '0.08em' }}>
								Superior
							</Typography>
							<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
								{item.superiorName} | {item.superiorJobLevelName}
							</Typography>
						</Box>
					</Stack>
				</AccordionDetails>
			</Accordion>
		</Paper>
	);
}

function EmployeeWarningLettersPage() {
	const navigate = useNavigate();
	const { enqueueSnackbar } = useSnackbar();
	const { logout } = useEmployeeAuth();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [rows, setRows] = useState([]);
	const [searchQuery, setSearchQuery] = useState('');
	const [levelFilter, setLevelFilter] = useState('ALL');

	const loadData = async () => {
		setLoading(true);
		setError('');

		try {
			const response = await employeeMeRequest('/warning-letters');
			setRows(response);
		} catch (requestError) {
			if (
				handleEmployeeUnauthorized({
					error: requestError,
					logout,
					navigate,
					enqueueSnackbar,
				})
			) {
				return;
			}

			setError(getEmployeePortalErrorMessage(requestError));
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadData();
	}, []);

	const normalizedSearchQuery = normalizeSearchValue(searchQuery);
	const filteredRows = rows.filter((item) => {
		const currentLevel = item.warningLevel ? String(item.warningLevel) : 'NONE';
		const matchesLevel = levelFilter === 'ALL' || currentLevel === levelFilter;
		const matchesSearch =
			!normalizedSearchQuery || normalizeSearchValue(buildSearchText(item)).includes(normalizedSearchQuery);

		return matchesLevel && matchesSearch;
	});

	if (loading) {
		return <FeedbackState loading />;
	}

	if (error) {
		return (
			<FeedbackState
				type="error"
				title="Riwayat surat peringatan belum bisa dimuat."
				description={error}
				actionLabel="Coba Lagi"
				onAction={loadData}
			/>
		);
	}

	if (!rows.length) {
		return (
			<FeedbackState
				title="Belum ada surat peringatan."
				description="Jika ada dokumen disipliner yang terkait dengan Anda, datanya akan tampil di halaman ini."
			/>
		);
	}

	return (
		<Stack spacing={1.5}>
			<Paper
				elevation={0}
				sx={{
					p: 2,
					borderRadius: 4,
					border: (theme) => `1px solid ${theme.palette.employeeSurface.borderSoft}`,
					background: (theme) => theme.palette.employeeSurface.cardGradient,
					boxShadow: (theme) => theme.palette.employeeSurface.shadowSoft,
				}}
			>
				<Stack spacing={1.5}>
					<Box>
						<Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 800 }}>
							Filter & Pencarian
						</Typography>
						<Typography variant="body2" color="text.secondary">
							Cari surat peringatan berdasarkan nomor, pelanggaran, atau superior.
						</Typography>
					</Box>
					<TextField
						fullWidth
						size="small"
						placeholder="Cari data surat, pelanggaran, atau superior..."
						value={searchQuery}
						onChange={(event) => setSearchQuery(event.target.value)}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<SearchRoundedIcon sx={{ color: 'text.secondary' }} />
								</InputAdornment>
							),
							endAdornment: searchQuery ? (
								<InputAdornment position="end">
									<Chip
										label="Bersihkan"
										size="small"
										variant="outlined"
										icon={<ClearRoundedIcon sx={{ fontSize: 14 }} />}
										onClick={() => setSearchQuery('')}
										sx={{
											cursor: 'pointer',
											'& .MuiChip-icon': { ml: 0.5 },
										}}
									/>
								</InputAdornment>
							) : null,
						}}
						sx={{
							'& .MuiOutlinedInput-root': {
								borderRadius: 3,
								backgroundColor: (theme) =>
									alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.5 : 0.96),
							},
						}}
					/>
					<Box
						sx={{
							display: 'flex',
							flexWrap: 'wrap',
							gap: 1,
							alignItems: 'center',
						}}
					>
						{LEVEL_FILTERS.map((item) => (
							<Chip
								key={item.value}
								label={item.label}
								clickable
								color={levelFilter === item.value ? 'primary' : 'default'}
								variant={levelFilter === item.value ? 'filled' : 'outlined'}
								onClick={() => setLevelFilter(item.value)}
								sx={{
									fontWeight: 700,
									borderRadius: 999,
									px: 0.5,
									height: 34,
									'& .MuiChip-label': {
										px: 1.15,
									},
								}}
							/>
						))}
					</Box>
					<Divider />
					<Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
						<Typography variant="body2" color="text.secondary">
							Menampilkan <strong>{filteredRows.length}</strong> dari <strong>{rows.length}</strong> data
						</Typography>
						{searchQuery || levelFilter !== 'ALL' ? (
							<Typography
								variant="caption"
								sx={{ color: 'text.secondary', cursor: 'pointer' }}
								onClick={() => {
									setSearchQuery('');
									setLevelFilter('ALL');
								}}
							>
								Reset filter
							</Typography>
						) : null}
					</Stack>
				</Stack>
			</Paper>

			{filteredRows.length ? (
				filteredRows.map((item) => <WarningLetterCard key={item.id} item={item} />)
			) : (
				<FeedbackState
					title="Data tidak ditemukan."
					description="Coba ubah kata kunci pencarian atau pilih level peringatan yang lain."
				/>
			)}
		</Stack>
	);
}

export default EmployeeWarningLettersPage;
