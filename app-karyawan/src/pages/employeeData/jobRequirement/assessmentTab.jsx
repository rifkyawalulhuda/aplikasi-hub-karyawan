import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSnackbar } from 'notistack';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import LinearProgress from '@mui/material/LinearProgress';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';

import EnhancedTable from '@/components/dataTable';
import SkillAssessmentDialog from '@/components/jobRequirement/skillAssessmentDialog';
import { fetchAssessmentSheet, fetchJobRequirementProfiles } from '@/services/jobRequirement';

const READINESS_COLORS = {
	SIAP: 'success',
	DALAM_PENGEMBANGAN: 'warning',
	BELUM_LENGKAP: 'info',
	BELUM_DINILAI: 'default',
};

function getGradeLabel(grade = '') {
	const match = String(grade).match(/^RANK_(\d+)$/);
	return match ? `Rank ${match[1]}` : grade;
}

function readinessColor(value) {
	if (value >= 80) {
		return 'success';
	}

	return value >= 50 ? 'warning' : 'error';
}

function levelColor(level, target) {
	if (level == null) {
		return 'transparent';
	}

	if (level >= target) {
		return level >= 4 ? 'rgba(46, 125, 50, 0.18)' : 'rgba(46, 125, 50, 0.10)';
	}

	return level === 0 ? 'rgba(211, 47, 47, 0.16)' : 'rgba(237, 108, 2, 0.16)';
}

function AssessmentTab({ period, onOpenPeriodDialog }) {
	const { enqueueSnackbar } = useSnackbar();
	const [loading, setLoading] = useState(true);
	const [payload, setPayload] = useState({ rows: [], summary: null, period: null });
	const [profiles, setProfiles] = useState([]);
	const [gradeFilter, setGradeFilter] = useState('ALL');
	const [departmentFilter, setDepartmentFilter] = useState('ALL');
	const [search, setSearch] = useState('');
	const [dialogState, setDialogState] = useState({ open: false, row: null });

	const loadSheet = useCallback(async () => {
		setLoading(true);

		try {
			const [sheet, profilePayload] = await Promise.all([
				fetchAssessmentSheet(period?.id ? { periodId: period.id } : {}),
				fetchJobRequirementProfiles(),
			]);

			setPayload({
				rows: sheet.rows || [],
				summary: sheet.summary || null,
				period: sheet.period || null,
			});
			setProfiles(profilePayload || []);
		} catch (error) {
			enqueueSnackbar(error.message, { variant: 'error' });
			setPayload({ rows: [], summary: null, period: null });
		} finally {
			setLoading(false);
		}
	}, [period?.id, enqueueSnackbar]);

	useEffect(() => {
		loadSheet();
	}, [loadSheet]);

	const departments = useMemo(
		() => Array.from(new Set(payload.rows.map((row) => row.departmentName).filter(Boolean))).sort(),
		[payload.rows],
	);

	const filteredRows = useMemo(() => {
		const keyword = search.trim().toLowerCase();

		return payload.rows.filter((row) => {
			if (gradeFilter !== 'ALL' && row.grade !== gradeFilter) {
				return false;
			}

			if (departmentFilter !== 'ALL' && row.departmentName !== departmentFilter) {
				return false;
			}

			if (!keyword) {
				return true;
			}

			return `${row.fullName} ${row.employeeNo} ${row.departmentName}`.toLowerCase().includes(keyword);
		});
	}, [payload.rows, gradeFilter, departmentFilter, search]);

	const columns = useMemo(
		() => [
			{
				field: 'fullName',
				headerName: 'KARYAWAN',
				minWidth: 220,
				flex: 1,
				renderCell: (params) => (
					<Stack spacing={0.2}>
						<Typography variant="body2" fontWeight={600}>
							{params.row.fullName}
						</Typography>
						<Typography variant="caption" color="text.secondary">
							{params.row.employeeNo} - {params.row.departmentName}
						</Typography>
					</Stack>
				),
			},
			{
				field: 'gradeLabel',
				headerName: 'GRADE',
				minWidth: 90,
			},
			{
				field: 'readinessPercent',
				headerName: 'READINESS',
				minWidth: 170,
				renderCell: (params) => {
					const value = params.row.readinessPercent;

					if (value == null) {
						return (
							<Typography variant="caption" color="text.disabled">
								Belum ada nilai
							</Typography>
						);
					}

					const incomplete = params.row.isComplete === false;

					return (
						<Stack spacing={0.4} sx={{ width: '100%', py: 0.5 }}>
							<Stack direction="row" spacing={1} alignItems="center">
								<LinearProgress
									variant="determinate"
									value={value}
									color={incomplete ? 'inherit' : readinessColor(value)}
									sx={{ flex: 1, height: 6, borderRadius: 999 }}
								/>
								<Typography
									variant="caption"
									fontWeight={700}
									color={incomplete ? 'text.secondary' : 'text.primary'}
								>
									{value}%
								</Typography>
							</Stack>
							<Chip
								size="small"
								variant="outlined"
								color={incomplete ? 'info' : 'default'}
								label={`Asesmen ${params.row.assessedItems}/${params.row.totalItems}`}
								sx={{ height: 18, fontSize: 10, alignSelf: 'flex-start' }}
							/>
						</Stack>
					);
				},
			},
			{
				field: 'readinessStatus',
				headerName: 'STATUS',
				minWidth: 170,
				renderCell: (params) => (
					<Chip
						size="small"
						variant="outlined"
						color={READINESS_COLORS[params.row.readinessStatus] || 'default'}
						label={params.row.readinessStatusLabel}
					/>
				),
			},
			{
				field: 'items',
				headerName: 'LEVEL / TARGET PER SKILL',
				minWidth: 380,
				sortable: false,
				renderCell: (params) => (
					<Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ py: 0.5 }}>
						{(params.row.items || []).slice(0, 8).map((item) => (
							<Tooltip
								key={`${item.category}-${item.skillName}`}
								title={`${item.skillName} — level ${
									item.level == null ? 'belum dinilai' : item.level
								}, target ${item.targetLevel}`}
							>
								<Box
									sx={{
										px: 0.6,
										py: 0.2,
										borderRadius: 1,
										border: '1px solid',
										borderColor: 'divider',
										backgroundColor: levelColor(item.level, item.targetLevel),
										fontSize: 11,
										whiteSpace: 'nowrap',
									}}
								>
									{item.skillName.length > 14 ? `${item.skillName.slice(0, 14)}…` : item.skillName}{' '}
									<Box component="span" sx={{ fontWeight: 700 }}>
										{item.level == null ? '—' : item.level}
									</Box>
									<Box component="span" sx={{ opacity: 0.6 }}>
										{' / '}
									</Box>
									{item.targetLevel}
								</Box>
							</Tooltip>
						))}
						{(params.row.items || []).length > 8 ? (
							<Typography variant="caption" color="text.secondary">
								+{params.row.items.length - 8} skill lainnya
							</Typography>
						) : null}
					</Stack>
				),
			},
			{
				field: 'actions',
				headerName: 'AKSI',
				minWidth: 120,
				sortable: false,
				renderCell: (params) => (
					<Button
						size="small"
						variant="outlined"
						onClick={(event) => {
							event.stopPropagation();
							setDialogState({ open: true, row: params.row });
						}}
					>
						Nilai
					</Button>
				),
			},
		],
		[],
	);

	const dialogProfile = useMemo(() => {
		if (!dialogState.row) {
			return null;
		}

		return profiles.find((profile) => profile.grade === dialogState.row.grade) || null;
	}, [dialogState.row, profiles]);

	const dialogAssessments = useMemo(() => {
		if (!dialogState.row) {
			return [];
		}

		return (dialogState.row.items || [])
			.filter((item) => item.level != null)
			.map((item) => ({
				category: item.category,
				skillName: item.skillName,
				level: item.level,
			}));
	}, [dialogState.row]);

	const { summary } = payload;

	return (
		<Stack spacing={2}>
			{!period ? (
				<Alert
					severity="warning"
					action={
						<Button color="inherit" size="small" onClick={onOpenPeriodDialog}>
							Atur Periode
						</Button>
					}
				>
					Belum ada periode asesmen aktif. Aktifkan periode agar penilaian bisa disimpan.
				</Alert>
			) : (
				<Alert severity="info">
					Periode aktif: <strong>{period.name}</strong>. Skala penilaian 0-5 (0 tidak terpapar, 3 mandiri, 5
					rujukan/penyusun standar). Readiness dihitung dari <strong>seluruh skill wajib</strong>, jadi skill
					yang belum dinilai dihitung 0. Status Siap baru diberikan bila semua skill sudah dinilai.
				</Alert>
			)}

			{summary ? (
				<Grid container spacing={1.5}>
					{[
						{ label: 'Karyawan', value: summary.employeeCount },
						{ label: 'Sudah dinilai', value: summary.assessedEmployees },
						{ label: 'Asesmen lengkap', value: summary.completeEmployees ?? 0 },
						{ label: 'Siap', value: summary.readyEmployees },
						{
							label: 'Rata-rata readiness',
							value: summary.averageReadiness == null ? '-' : `${summary.averageReadiness}%`,
						},
					].map((item) => (
						<Grid item xs={6} md={2.4} key={item.label}>
							<Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
								<Typography variant="caption" color="text.secondary">
									{item.label}
								</Typography>
								<Typography variant="h6">{item.value}</Typography>
							</Box>
						</Grid>
					))}
				</Grid>
			) : null}

			<Grid container spacing={1.5}>
				<Grid item xs={12} md={3}>
					<TextField
						fullWidth
						size="small"
						label="Cari Karyawan"
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<SearchOutlinedIcon fontSize="small" />
								</InputAdornment>
							),
						}}
					/>
				</Grid>
				<Grid item xs={12} md={3}>
					<TextField
						fullWidth
						size="small"
						select
						label="Grade"
						value={gradeFilter}
						onChange={(event) => setGradeFilter(event.target.value)}
					>
						<MenuItem value="ALL">Semua Grade</MenuItem>
						{profiles.map((profile) => (
							<MenuItem key={profile.grade} value={profile.grade}>
								{getGradeLabel(profile.grade)}
							</MenuItem>
						))}
					</TextField>
				</Grid>
				<Grid item xs={12} md={3}>
					<TextField
						fullWidth
						size="small"
						select
						label="Departemen"
						value={departmentFilter}
						onChange={(event) => setDepartmentFilter(event.target.value)}
					>
						<MenuItem value="ALL">Semua Departemen</MenuItem>
						{departments.map((department) => (
							<MenuItem key={department} value={department}>
								{department}
							</MenuItem>
						))}
					</TextField>
				</Grid>
				<Grid item xs={12} md={3}>
					<Stack direction="row" justifyContent="flex-end" alignItems="center" height="100%">
						<Typography variant="body2" color="text.secondary">
							{filteredRows.length} karyawan
						</Typography>
					</Stack>
				</Grid>
			</Grid>

			{loading ? (
				<Stack alignItems="center" justifyContent="center" py={10}>
					<CircularProgress />
				</Stack>
			) : (
				<EnhancedTable
					rows={filteredRows}
					columns={columns}
					getRowId={(row) => row.employeeId}
					columnResizeKey="job-requirement-assessment-table"
					initialPageSize={15}
					pageSizeOptions={[15, 30, 50, 100]}
					getContextMenuActions={(row) => [
						{
							label: 'Isi Asesmen',
							onClick: () => setDialogState({ open: true, row }),
						},
					]}
				/>
			)}

			<SkillAssessmentDialog
				open={dialogState.open}
				onClose={() => setDialogState({ open: false, row: null })}
				employeeId={dialogState.row?.employeeId}
				employeeName={dialogState.row?.fullName}
				periodId={payload.period?.id || period?.id}
				profile={dialogProfile}
				assessments={dialogAssessments}
				onSaved={loadSheet}
			/>
		</Stack>
	);
}

export default AssessmentTab;
