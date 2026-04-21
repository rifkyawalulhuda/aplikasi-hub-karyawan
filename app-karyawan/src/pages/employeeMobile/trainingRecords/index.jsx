import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';

import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import ClearRoundedIcon from '@mui/icons-material/ClearRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';

import FeedbackState from '@/components/employeePortal/feedbackState';
import { useEmployeeAuth } from '@/contexts/employeeAuthContext';
import { employeeMeRequest } from '@/services/employeeApi';
import { formatLongDate, getEmployeePortalErrorMessage, handleEmployeeUnauthorized } from '@/utils/employeePortal';

const TYPE_FILTERS = [
	{ label: 'Semua', value: 'ALL' },
	{ label: 'Internal', value: 'INTERNAL' },
	{ label: 'External', value: 'EXTERNAL' },
];

function normalizeSearchValue(value = '') {
	return String(value).toLowerCase().replace(/\s+/g, ' ').trim();
}

function buildSearchText(item) {
	return [
		item.trainingTypeLabel,
		item.material,
		item.trainerInstitution,
		item.trainerName,
		item.participantSummary,
		item.participantNames?.join(' '),
		item.address,
		item.notes,
		item.selfParticipantName,
		formatLongDate(item.startDate),
		formatLongDate(item.endDate),
	].join(' ');
}

function TrainingRecordCard({ item }) {
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
						<Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.25}>
							<Box sx={{ minWidth: 0, flex: 1 }}>
								<Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 800 }}>
									{item.material}
								</Typography>
								<Typography variant="body2" color="text.secondary" sx={{ mt: 0.35, lineHeight: 1.5 }}>
									{formatLongDate(item.startDate)} - {formatLongDate(item.endDate)} | {item.dayCount}{' '}
									hari
								</Typography>
							</Box>
							<Stack spacing={0.75} alignItems="flex-end" sx={{ flexShrink: 0 }}>
								<Chip
									label={item.trainingTypeLabel}
									color={item.trainingType === 'INTERNAL' ? 'primary' : 'success'}
									variant="outlined"
									size="small"
								/>
								<Chip
									label={`${item.participantCount} peserta`}
									size="small"
									variant="outlined"
									sx={{
										fontWeight: 700,
										bgcolor: (theme) =>
											alpha(
												theme.palette.text.primary,
												theme.palette.mode === 'dark' ? 0.08 : 0.03,
											),
									}}
								/>
							</Stack>
						</Stack>
						<Typography
							variant="caption"
							sx={{ color: 'text.secondary', letterSpacing: '0.04em', textTransform: 'uppercase' }}
						>
							Tap untuk lihat detail
						</Typography>
					</Stack>
				</AccordionSummary>
				<AccordionDetails sx={{ px: 2, pb: 2.25 }}>
					<Stack spacing={1.5}>
						<Box>
							<Typography variant="caption" sx={{ color: 'text.secondary', letterSpacing: '0.08em' }}>
								Peserta
							</Typography>
							<Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 0.75 }}>
								{item.participants.length ? (
									item.participants.map((participant) => (
										<Chip
											key={participant.id}
											label={participant.displayLabel || '-'}
											size="small"
											color={participant.isSelf ? 'primary' : 'default'}
											variant={participant.isSelf ? 'filled' : 'outlined'}
											sx={{
												fontWeight: participant.isSelf ? 500 : 500,
												height: 30,
												borderRadius: 200,
												px: 1.75,
												'& .MuiChip-label': {
													px: 0.1,
												},
											}}
										/>
									))
								) : (
									<Typography variant="body2" color="text.secondary">
										-
									</Typography>
								)}
							</Stack>
						</Box>

						<Divider />

						<Box>
							<Typography variant="caption" sx={{ color: 'text.secondary', letterSpacing: '0.08em' }}>
								Trainer
							</Typography>
							<Stack
								spacing={1}
								sx={{
									mt: 0.75,
									p: 1.5,
									borderRadius: 3,
									bgcolor: (theme) => theme.palette.employeeSurface.muted,
								}}
							>
								<Stack direction="row" spacing={1.25} alignItems="flex-start">
									<ApartmentRoundedIcon sx={{ color: 'text.secondary', fontSize: 20, mt: 0.1 }} />
									<Box sx={{ minWidth: 0 }}>
										<Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
											{item.trainerInstitution}
										</Typography>
										<Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 700 }}>
											{item.trainerName}
										</Typography>
									</Box>
								</Stack>
								<Stack direction="row" spacing={1.25} alignItems="flex-start">
									<GroupsOutlinedIcon sx={{ color: 'text.secondary', fontSize: 20, mt: 0.1 }} />
									<Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
										{item.participantSummary}
									</Typography>
								</Stack>
							</Stack>
						</Box>

						<Box>
							<Typography variant="caption" sx={{ color: 'text.secondary', letterSpacing: '0.08em' }}>
								Periode
							</Typography>
							<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.6 }}>
								<CalendarMonthOutlinedIcon sx={{ fontSize: 15, mr: 0.75, mb: '-2px' }} />
								{formatLongDate(item.startDate)} - {formatLongDate(item.endDate)} ({item.dayCount} hari)
							</Typography>
						</Box>

						<Box>
							<Typography variant="caption" sx={{ color: 'text.secondary', letterSpacing: '0.08em' }}>
								Alamat Pelatihan
							</Typography>
							<Typography
								variant="body2"
								color="text.secondary"
								sx={{ mt: 0.5, lineHeight: 1.6, whiteSpace: 'pre-line' }}
							>
								{item.address || '-'}
							</Typography>
						</Box>

						<Box>
							<Typography variant="caption" sx={{ color: 'text.secondary', letterSpacing: '0.08em' }}>
								Keterangan
							</Typography>
							<Typography
								variant="body2"
								color="text.secondary"
								sx={{ mt: 0.5, lineHeight: 1.6, whiteSpace: 'pre-line' }}
							>
								{item.notes || '-'}
							</Typography>
						</Box>
					</Stack>
				</AccordionDetails>
			</Accordion>
		</Paper>
	);
}

function EmployeeTrainingRecordsPage() {
	const navigate = useNavigate();
	const { enqueueSnackbar } = useSnackbar();
	const { logout } = useEmployeeAuth();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [rows, setRows] = useState([]);
	const [searchQuery, setSearchQuery] = useState('');
	const [typeFilter, setTypeFilter] = useState('ALL');

	const loadData = async () => {
		setLoading(true);
		setError('');

		try {
			const response = await employeeMeRequest('/training-records');
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
	const filteredRows = useMemo(
		() =>
			rows.filter((item) => {
				const matchesType = typeFilter === 'ALL' || item.trainingType === typeFilter;
				const matchesSearch =
					!normalizedSearchQuery ||
					normalizeSearchValue(buildSearchText(item)).includes(normalizedSearchQuery);

				return matchesType && matchesSearch;
			}),
		[rows, normalizedSearchQuery, typeFilter],
	);

	if (loading) {
		return <FeedbackState loading />;
	}

	if (error) {
		return (
			<FeedbackState
				type="error"
				title="Riwayat pelatihan belum bisa dimuat."
				description={error}
				actionLabel="Coba Lagi"
				onAction={loadData}
			/>
		);
	}

	if (!rows.length) {
		return (
			<FeedbackState
				title="Belum ada riwayat pelatihan."
				description="Data pelatihan yang melibatkan akun login Anda akan tampil di halaman ini."
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
							Cari riwayat berdasarkan materi, trainer, peserta, atau periode.
						</Typography>
					</Box>
					<TextField
						fullWidth
						size="small"
						placeholder="Cari materi, trainer, atau peserta..."
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
					<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
						{TYPE_FILTERS.map((item) => (
							<Chip
								key={item.value}
								label={item.label}
								clickable
								color={typeFilter === item.value ? 'primary' : 'default'}
								variant={typeFilter === item.value ? 'filled' : 'outlined'}
								onClick={() => setTypeFilter(item.value)}
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
						{searchQuery || typeFilter !== 'ALL' ? (
							<Typography
								variant="caption"
								sx={{ color: 'text.secondary', cursor: 'pointer' }}
								onClick={() => {
									setSearchQuery('');
									setTypeFilter('ALL');
								}}
							>
								Reset filter
							</Typography>
						) : null}
					</Stack>
				</Stack>
			</Paper>

			{filteredRows.length ? (
				filteredRows.map((item) => <TrainingRecordCard key={item.id} item={item} />)
			) : (
				<FeedbackState
					title="Data tidak ditemukan."
					description="Coba ubah kata kunci pencarian atau pilih jenis pelatihan yang lain."
				/>
			)}
		</Stack>
	);
}

export default EmployeeTrainingRecordsPage;
