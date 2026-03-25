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

import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import ClearRoundedIcon from '@mui/icons-material/ClearRounded';

import FeedbackState from '@/components/employeePortal/feedbackState';
import { useEmployeeAuth } from '@/contexts/employeeAuthContext';
import { employeeMeRequest } from '@/services/employeeApi';
import { formatLongDate, getEmployeePortalErrorMessage, handleEmployeeUnauthorized } from '@/utils/employeePortal';

const CATEGORY_FILTERS = [
	{ label: 'Semua', value: 'ALL' },
	{ label: 'Bimbingan', value: 'GUIDANCE' },
	{ label: 'Pengarahan', value: 'DIRECTION' },
];

function normalizeSearchValue(value = '') {
	return String(value).toLowerCase().replace(/\s+/g, ' ').trim();
}

function buildSearchText(item) {
	return [
		item.categoryLabel,
		item.meetingNumber ? `Pertemuan ${item.meetingNumber}` : '',
		formatLongDate(item.meetingDate),
		item.meetingTime,
		item.location,
		item.problemFaced,
		item.problemFacedSecondary,
		item.problemCause,
		item.problemSolving,
	].join(' ');
}

function GuidanceRecordCard({ item }) {
	return (
		<Paper
			elevation={0}
			sx={{
				borderRadius: 4,
				overflow: 'hidden',
				border: '1px solid rgba(18,59,102,0.08)',
				backgroundColor: '#FFFFFF',
				boxShadow: '0 10px 24px rgba(18,59,102,0.06)',
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
							color: '#5D738B',
						},
					}}
				>
					<Stack spacing={1} sx={{ width: '100%' }}>
						<Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
							<Box sx={{ minWidth: 0, flex: 1 }}>
								<Typography variant="subtitle1" sx={{ color: '#123B66', fontWeight: 800 }}>
									{item.categoryLabel}
								</Typography>
								<Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
									{formatLongDate(item.meetingDate)} | {item.meetingTime} | {item.location}
								</Typography>
							</Box>
							<Chip
								label={`Pertemuan ${item.meetingNumber}`}
								color="primary"
								variant="outlined"
								size="small"
								sx={{ flexShrink: 0 }}
							/>
						</Stack>
						<Typography
							variant="caption"
							sx={{ color: '#7B8FA3', letterSpacing: '0.04em', textTransform: 'uppercase' }}
						>
							Tap untuk lihat detail
						</Typography>
					</Stack>
				</AccordionSummary>
				<AccordionDetails sx={{ px: 2, pb: 2 }}>
					<Stack spacing={1.5}>
						<Box>
							<Typography variant="caption" sx={{ color: '#5D738B', letterSpacing: '0.08em' }}>
								Permasalahan
							</Typography>
							<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.6 }}>
								{item.problemFaced}
							</Typography>
						</Box>
						{item.problemFacedSecondary ? (
							<Box>
								<Typography variant="caption" sx={{ color: '#5D738B', letterSpacing: '0.08em' }}>
									Pengetahuan / Tanggung Jawab Tambahan
								</Typography>
								<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.6 }}>
									{item.problemFacedSecondary}
								</Typography>
							</Box>
						) : null}
						<Box>
							<Typography variant="caption" sx={{ color: '#5D738B', letterSpacing: '0.08em' }}>
								Penyebab Masalah
							</Typography>
							<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.6 }}>
								{item.problemCause}
							</Typography>
						</Box>
						<Box
							sx={{
								p: 1.5,
								borderRadius: 3,
								backgroundColor: 'rgba(18,59,102,0.04)',
							}}
						>
							<Typography variant="caption" sx={{ color: '#5D738B', letterSpacing: '0.08em' }}>
								Pemecahan Masalah
							</Typography>
							<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.6 }}>
								{item.problemSolving}
							</Typography>
						</Box>
					</Stack>
				</AccordionDetails>
			</Accordion>
		</Paper>
	);
}

function EmployeeGuidanceRecordsPage() {
	const navigate = useNavigate();
	const { enqueueSnackbar } = useSnackbar();
	const { logout } = useEmployeeAuth();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [rows, setRows] = useState([]);
	const [searchQuery, setSearchQuery] = useState('');
	const [categoryFilter, setCategoryFilter] = useState('ALL');

	const loadData = async () => {
		setLoading(true);
		setError('');

		try {
			const response = await employeeMeRequest('/guidance-records');
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
		const matchesCategory =
			categoryFilter === 'ALL' ||
			(categoryFilter === 'GUIDANCE' && item.category === 'GUIDANCE') ||
			(categoryFilter === 'DIRECTION' && item.category === 'DIRECTION');
		const matchesSearch =
			!normalizedSearchQuery || normalizeSearchValue(buildSearchText(item)).includes(normalizedSearchQuery);

		return matchesCategory && matchesSearch;
	});

	if (loading) {
		return <FeedbackState loading />;
	}

	if (error) {
		return (
			<FeedbackState
				type="error"
				title="Riwayat bimbingan belum bisa dimuat."
				description={error}
				actionLabel="Coba Lagi"
				onAction={loadData}
			/>
		);
	}

	if (!rows.length) {
		return (
			<FeedbackState
				title="Belum ada riwayat bimbingan."
				description="Data bimbingan dan pengarahan milik Anda akan muncul di halaman ini."
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
					border: '1px solid rgba(18,59,102,0.08)',
					background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(244,249,255,0.98) 100%)',
				}}
			>
				<Stack spacing={1.5}>
					<Box>
						<Typography variant="subtitle1" sx={{ color: '#123B66', fontWeight: 800 }}>
							Filter & Pencarian
						</Typography>
						<Typography variant="body2" color="text.secondary">
							Cari riwayat berdasarkan kata kunci atau jenis catatan.
						</Typography>
					</Box>
					<TextField
						fullWidth
						size="small"
						placeholder="Cari data, lokasi, masalah, atau solusi..."
						value={searchQuery}
						onChange={(event) => setSearchQuery(event.target.value)}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<SearchRoundedIcon sx={{ color: '#5D738B' }} />
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
								backgroundColor: '#FFFFFF',
							},
						}}
					/>
					<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
						{CATEGORY_FILTERS.map((item) => (
							<Chip
								key={item.value}
								label={item.label}
								clickable
								color={categoryFilter === item.value ? 'primary' : 'default'}
								variant={categoryFilter === item.value ? 'filled' : 'outlined'}
								onClick={() => setCategoryFilter(item.value)}
								sx={{
									fontWeight: 700,
									borderRadius: 999,
									px: 0.5,
								}}
							/>
						))}
					</Stack>
					<Divider />
					<Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
						<Typography variant="body2" color="text.secondary">
							Menampilkan <strong>{filteredRows.length}</strong> dari <strong>{rows.length}</strong> data
						</Typography>
						{searchQuery || categoryFilter !== 'ALL' ? (
							<Typography
								variant="caption"
								sx={{ color: '#7B8FA3', cursor: 'pointer' }}
								onClick={() => {
									setSearchQuery('');
									setCategoryFilter('ALL');
								}}
							>
								Reset filter
							</Typography>
						) : null}
					</Stack>
				</Stack>
			</Paper>

			{filteredRows.length ? (
				filteredRows.map((item) => <GuidanceRecordCard key={item.id} item={item} />)
			) : (
				<FeedbackState
					title="Data tidak ditemukan."
					description="Coba ubah kata kunci pencarian atau pilih kategori yang lain."
				/>
			)}
		</Stack>
	);
}

export default EmployeeGuidanceRecordsPage;
