import { useCallback, useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import RuleOutlinedIcon from '@mui/icons-material/RuleOutlined';

import { fetchEmployeeJobRequirement, getJobRequirementStatusColor } from '@/services/jobRequirement';

import SkillAssessmentDialog from './skillAssessmentDialog';

const UNMET_PREVIEW_COUNT = 8;

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

function CategoryRow({ category }) {
	let color = 'warning';

	if (category.percent >= 100) {
		color = 'success';
	} else if (category.mandatory) {
		color = 'error';
	}

	return (
		<Box>
			<Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
				<Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}>
					<Typography variant="body2" fontWeight={600} noWrap>
						{category.label}
					</Typography>
					{category.mandatory ? (
						<Chip size="small" label="Wajib" color="default" variant="outlined" sx={{ height: 20 }} />
					) : null}
				</Stack>
				<Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
					{category.met}/{category.total} ({category.percent}%)
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
}

function EmployeeJobRequirementCard({ employeeId }) {
	const { enqueueSnackbar } = useSnackbar();
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [showAllUnmet, setShowAllUnmet] = useState(false);

	const loadData = useCallback(async () => {
		if (!employeeId) {
			return;
		}

		setLoading(true);

		try {
			const result = await fetchEmployeeJobRequirement(employeeId);
			setData(result);
		} catch (error) {
			enqueueSnackbar(error.message, { variant: 'error' });
		} finally {
			setLoading(false);
		}
	}, [employeeId, enqueueSnackbar]);

	useEffect(() => {
		loadData();
	}, [loadData]);

	const evaluation = data?.evaluation;
	const profile = data?.profile;
	const status = evaluation?.status || 'TIDAK_ADA_PROFIL';
	const unmetItems = evaluation?.unmetItems || [];
	const visibleUnmet = showAllUnmet ? unmetItems : unmetItems.slice(0, UNMET_PREVIEW_COUNT);

	return (
		<Card variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', height: '100%' }}>
			<Box
				sx={{
					px: 2.5,
					py: 1.5,
					display: 'flex',
					alignItems: 'center',
					gap: 1.5,
					borderBottom: '1px solid',
					borderColor: 'divider',
					bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'background.paper' : 'grey.50'),
				}}
			>
				<RuleOutlinedIcon sx={{ color: 'primary.main', fontSize: 20 }} />
				<Typography variant="subtitle2" fontWeight={700} color="primary.main" sx={{ flexGrow: 1 }}>
					Job Requirement
				</Typography>
				<Chip
					size="small"
					label={evaluation?.statusLabel || 'Memuat...'}
					color={getJobRequirementStatusColor(status)}
				/>
				<Tooltip title="Muat ulang">
					<Button
						size="small"
						variant="text"
						onClick={loadData}
						sx={{ minWidth: 0, p: 0.5 }}
						aria-label="Muat ulang job requirement"
					>
						<RefreshOutlinedIcon fontSize="small" />
					</Button>
				</Tooltip>
			</Box>

			{loading && (
				<Stack alignItems="center" justifyContent="center" py={6}>
					<CircularProgress size={28} />
				</Stack>
			)}

			{!loading && !evaluation && (
				<Box px={2.5} py={3} textAlign="center">
					<Typography variant="body2" color="text.secondary">
						Data job requirement tidak tersedia.
					</Typography>
				</Box>
			)}

			{!loading && evaluation && (
				<Stack spacing={2} sx={{ p: 2.5 }}>
					<Stack direction="row" spacing={2} alignItems="center">
						<Box sx={{ position: 'relative', display: 'inline-flex' }}>
							<CircularProgress
								variant="determinate"
								value={evaluation.percentOverall}
								size={64}
								thickness={5}
								color={evaluation.mandatoryMet ? 'success' : 'error'}
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
									{evaluation.percentOverall}%
								</Typography>
							</Box>
						</Box>
						<Box sx={{ minWidth: 0 }}>
							<Typography variant="body2" fontWeight={700}>
								{evaluation.gradeLabel}
							</Typography>
							<Typography variant="caption" color="text.secondary" display="block">
								{profile?.sourceFormNo || '-'} · Rev {profile?.sourceRev || '-'}
							</Typography>
							<Typography variant="caption" color="text.secondary" display="block">
								Efektif {formatDate(profile?.effectiveDate)}
							</Typography>
							<Typography variant="caption" color="text.secondary" display="block">
								{evaluation.unmetItems.filter((item) => item.mandatory).length > 0
									? 'Syarat dasar belum terpenuhi'
									: 'Syarat dasar terpenuhi'}
							</Typography>
						</Box>
					</Stack>

					<Stack spacing={1.25}>
						{evaluation.categories.map((category) => (
							<CategoryRow key={category.key} category={category} />
						))}
					</Stack>

					<Box>
						<Stack direction="row" alignItems="center" spacing={1} mb={1}>
							<EmojiEventsOutlinedIcon fontSize="small" sx={{ color: 'warning.main' }} />
							<Typography variant="subtitle2" fontWeight={700}>
								Belum Terpenuhi ({unmetItems.length})
							</Typography>
						</Stack>
						{unmetItems.length === 0 ? (
							<Typography variant="body2" color="text.secondary">
								Seluruh item requirement sudah terpenuhi.
							</Typography>
						) : (
							<Stack spacing={1}>
								{visibleUnmet.map((item) => (
									<Box
										key={`${item.categoryKey}-${item.key}`}
										sx={{
											px: 1.5,
											py: 1,
											borderRadius: 2,
											border: '1px solid',
											borderColor: 'divider',
											bgcolor: (theme) =>
												theme.palette.mode === 'dark' ? 'background.default' : 'grey.50',
										}}
									>
										<Stack
											direction="row"
											spacing={1}
											alignItems="center"
											justifyContent="space-between"
										>
											<Typography variant="body2" fontWeight={600} sx={{ minWidth: 0 }} noWrap>
												{item.label}
											</Typography>
											<Chip
												size="small"
												label={item.categoryLabel}
												variant="outlined"
												sx={{ height: 20, flexShrink: 0 }}
											/>
										</Stack>
										<Typography variant="caption" color="text.secondary" display="block">
											Dibutuhkan: {item.required} · Saat ini: {item.actual}
										</Typography>
									</Box>
								))}
								{unmetItems.length > UNMET_PREVIEW_COUNT ? (
									<Button size="small" onClick={() => setShowAllUnmet((current) => !current)}>
										{showAllUnmet ? 'Sembunyikan' : `Lihat semua (${unmetItems.length})`}
									</Button>
								) : null}
							</Stack>
						)}
					</Box>

					<Button
						variant="contained"
						size="small"
						onClick={() => setDialogOpen(true)}
						disabled={!profile}
						sx={{ alignSelf: 'flex-start' }}
					>
						Input Asesmen Skill
					</Button>
				</Stack>
			)}

			<SkillAssessmentDialog
				open={dialogOpen}
				onClose={() => setDialogOpen(false)}
				employeeId={employeeId}
				profile={profile}
				assessments={data?.assessments || []}
				onSaved={loadData}
			/>
		</Card>
	);
}

export default EmployeeJobRequirementCard;
