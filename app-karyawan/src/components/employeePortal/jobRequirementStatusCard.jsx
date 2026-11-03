import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useEmployeeAuth } from '@/contexts/employeeAuthContext';
import { employeeMeRequest } from '@/services/employeeApi';
import { handleEmployeeUnauthorized } from '@/utils/employeePortal';

const UNMET_PREVIEW_COUNT = 5;

const STATUS_COLORS = {
	MEMENUHI: 'success',
	BELUM_MEMENUHI: 'error',
	BELUM_DINILAI: 'warning',
	TIDAK_ADA_PROFIL: 'default',
};

function formatDate(raw) {
	if (!raw) {
		return '-';
	}

	const date = new Date(raw);

	if (Number.isNaN(date.getTime())) {
		return raw;
	}

	return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function EmployeeJobRequirementStatusCard() {
	const navigate = useNavigate();
	const { enqueueSnackbar } = useSnackbar();
	const { logout } = useEmployeeAuth();
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const loadData = async () => {
			setLoading(true);

			try {
				const response = await employeeMeRequest('/job-requirement');
				setData(response);
			} catch (requestError) {
				handleEmployeeUnauthorized({
					error: requestError,
					logout,
					navigate,
					enqueueSnackbar,
				});
			} finally {
				setLoading(false);
			}
		};

		loadData();
	}, [enqueueSnackbar, logout, navigate]);

	if (loading) {
		return (
			<Paper
				sx={{
					p: 2.5,
					borderRadius: 4,
					border: (theme) => `1px solid ${theme.palette.employeeSurface.borderSoft}`,
					backgroundColor: (theme) => theme.palette.employeeSurface.card,
					boxShadow: (theme) => theme.palette.employeeSurface.shadowSoft,
				}}
			>
				<Stack alignItems="center" justifyContent="center" py={3}>
					<CircularProgress size={26} />
				</Stack>
			</Paper>
		);
	}

	if (!data) {
		return null;
	}

	const unmetItems = data.unmetItems || [];

	return (
		<Paper
			sx={{
				p: 2.5,
				borderRadius: 4,
				border: (theme) => `1px solid ${theme.palette.employeeSurface.borderSoft}`,
				backgroundColor: (theme) => theme.palette.employeeSurface.card,
				boxShadow: (theme) => theme.palette.employeeSurface.shadowSoft,
			}}
		>
			<Stack spacing={1.5}>
				<Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
					<Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 700 }}>
						Job Requirement
					</Typography>
					<Chip
						size="small"
						label={data.statusLabel}
						color={STATUS_COLORS[data.status] || 'default'}
						variant="outlined"
					/>
				</Stack>
				<Divider />

				<Stack direction="row" alignItems="center" spacing={2}>
					<Box sx={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
						<CircularProgress
							variant="determinate"
							value={data.percentOverall}
							size={64}
							thickness={5}
							color={data.mandatoryMet ? 'success' : 'error'}
						/>
						<Box
							sx={{
								position: 'absolute',
								inset: 0,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							<Typography variant="caption" fontWeight={800}>
								{data.percentOverall}%
							</Typography>
						</Box>
					</Box>
					<Box sx={{ minWidth: 0 }}>
						<Typography variant="body2" fontWeight={700}>
							{data.gradeLabel}
						</Typography>
						<Typography variant="caption" color="text.secondary" display="block">
							{data.sourceFormNo || '-'} · Rev {data.sourceRev || '-'}
						</Typography>
						<Typography variant="caption" color="text.secondary" display="block">
							Efektif {formatDate(data.effectiveDate)}
						</Typography>
					</Box>
				</Stack>

				<Stack spacing={1.25}>
					{(data.categories || []).map((category) => {
						let color = 'warning';

						if (category.percent >= 100) {
							color = 'success';
						} else if (category.mandatory) {
							color = 'error';
						}

						return (
							<Box key={category.key}>
								<Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
									<Typography variant="body2" fontWeight={600} noWrap>
										{category.label}
									</Typography>
									<Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
										{category.met}/{category.total}
									</Typography>
								</Stack>
								<LinearProgress
									variant="determinate"
									value={category.percent}
									color={color}
									sx={{ mt: 0.5, height: 6, borderRadius: 999 }}
								/>
							</Box>
						);
					})}
				</Stack>

				<Divider />

				<Box>
					<Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.75 }}>
						Belum Terpenuhi ({unmetItems.length})
					</Typography>
					{unmetItems.length === 0 ? (
						<Typography variant="body2" color="text.secondary">
							Seluruh item requirement sudah terpenuhi.
						</Typography>
					) : (
						<Stack spacing={0.75}>
							{unmetItems.slice(0, UNMET_PREVIEW_COUNT).map((item) => (
								<Box key={`${item.categoryLabel}-${item.label}`}>
									<Typography variant="body2" sx={{ fontWeight: 600 }}>
										{item.label}
									</Typography>
									<Typography variant="caption" color="text.secondary" display="block">
										{item.categoryLabel} · {item.actual}
									</Typography>
								</Box>
							))}
							{unmetItems.length > UNMET_PREVIEW_COUNT ? (
								<Typography variant="caption" color="text.secondary">
									+{unmetItems.length - UNMET_PREVIEW_COUNT} item lainnya
								</Typography>
							) : null}
						</Stack>
					)}
				</Box>

				<Typography variant="caption" color="text.secondary">
					Penilaian dilakukan oleh HR. Hubungi HR jika ada data yang perlu diperbarui.
				</Typography>
			</Stack>
		</Paper>
	);
}

export default EmployeeJobRequirementStatusCard;
