import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';

import EnhancedTable, { createRowNumberColumn } from '@/components/dataTable';
import PageHeader from '@/components/pageHeader';
import {
	fetchJobRequirementEmployees,
	fetchJobRequirementProfiles,
	fetchJobRequirementTrainingNeeds,
	getJobRequirementStatusColor,
} from '@/services/jobRequirement';

const STATUS_OPTIONS = [
	{ value: 'ALL', label: 'Semua Status' },
	{ value: 'MEMENUHI', label: 'Memenuhi' },
	{ value: 'BELUM_MEMENUHI', label: 'Belum Memenuhi' },
	{ value: 'BELUM_DINILAI', label: 'Belum Dinilai' },
	{ value: 'TIDAK_ADA_PROFIL', label: 'Tanpa Profil' },
];

function getGradeLabel(grade = '') {
	const match = String(grade).match(/^RANK_(\d+)$/);
	return match ? `Rank ${match[1]}` : grade;
}

function downloadCsv(fileName, headers, rows) {
	const escapeCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
	const lines = [headers.map(escapeCell).join(';'), ...rows.map((row) => row.map(escapeCell).join(';'))];
	const blob = new Blob([`\uFEFF${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8;' });
	const url = window.URL.createObjectURL(blob);
	const link = document.createElement('a');

	link.href = url;
	link.download = fileName;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	window.URL.revokeObjectURL(url);
}

function JobRequirementRecapPage() {
	const navigate = useNavigate();
	const { enqueueSnackbar } = useSnackbar();
	const [activeTab, setActiveTab] = useState('GAP');
	const [loading, setLoading] = useState(true);
	const [rows, setRows] = useState([]);
	const [profiles, setProfiles] = useState([]);
	const [trainingNeeds, setTrainingNeeds] = useState([]);
	const [trainingLoading, setTrainingLoading] = useState(false);
	const [gradeFilter, setGradeFilter] = useState('ALL');
	const [statusFilter, setStatusFilter] = useState('ALL');
	const [departmentFilter, setDepartmentFilter] = useState('ALL');
	const [search, setSearch] = useState('');

	useEffect(() => {
		const init = async () => {
			setLoading(true);

			try {
				const [employeePayload, profilePayload] = await Promise.all([
					fetchJobRequirementEmployees(),
					fetchJobRequirementProfiles(),
				]);

				setRows(employeePayload.rows || []);
				setProfiles(profilePayload || []);
			} catch (error) {
				enqueueSnackbar(error.message, { variant: 'error' });
			} finally {
				setLoading(false);
			}
		};

		init();
	}, [enqueueSnackbar]);

	useEffect(() => {
		if (activeTab !== 'TRAINING' || trainingNeeds.length > 0) {
			return;
		}

		const loadTrainingNeeds = async () => {
			setTrainingLoading(true);

			try {
				const payload = await fetchJobRequirementTrainingNeeds();
				setTrainingNeeds(payload.rows || []);
			} catch (error) {
				enqueueSnackbar(error.message, { variant: 'error' });
			} finally {
				setTrainingLoading(false);
			}
		};

		loadTrainingNeeds();
	}, [activeTab, trainingNeeds.length, enqueueSnackbar]);

	const departments = useMemo(
		() => Array.from(new Set(rows.map((row) => row.departmentName).filter(Boolean))).sort(),
		[rows],
	);

	const filteredRows = useMemo(() => {
		const keyword = search.trim().toLowerCase();

		return rows.filter((row) => {
			if (gradeFilter !== 'ALL' && row.grade !== gradeFilter) {
				return false;
			}

			if (statusFilter !== 'ALL' && row.status !== statusFilter) {
				return false;
			}

			if (departmentFilter !== 'ALL' && row.departmentName !== departmentFilter) {
				return false;
			}

			if (!keyword) {
				return true;
			}

			return `${row.fullName} ${row.employeeNo} ${row.jobLevelName} ${row.departmentName}`
				.toLowerCase()
				.includes(keyword);
		});
	}, [rows, gradeFilter, statusFilter, departmentFilter, search]);

	const gapColumns = useMemo(
		() => [
			createRowNumberColumn(),
			{ field: 'fullName', headerName: 'NAMA', minWidth: 200, flex: 1 },
			{ field: 'employeeNo', headerName: 'NIK', minWidth: 130 },
			{ field: 'departmentName', headerName: 'DEPARTEMEN', minWidth: 150 },
			{ field: 'jobLevelName', headerName: 'JOB LEVEL', minWidth: 170 },
			{
				field: 'grade',
				headerName: 'GRADE',
				minWidth: 110,
				valueFormatter: (params) => getGradeLabel(params.value),
			},
			{
				field: 'status',
				headerName: 'STATUS',
				minWidth: 160,
				renderCell: (params) => (
					<Chip
						size="small"
						label={params.row.statusLabel}
						color={getJobRequirementStatusColor(params.value)}
						variant="outlined"
					/>
				),
			},
			{
				field: 'percentOverall',
				headerName: '% ITEM',
				minWidth: 100,
				type: 'number',
				valueFormatter: (params) => `${params.value ?? 0}%`,
			},
			{
				field: 'unmetMandatoryCount',
				headerName: 'WAJIB KURANG',
				minWidth: 130,
				type: 'number',
			},
			{
				field: 'unmetTotalCount',
				headerName: 'TOTAL KURANG',
				minWidth: 130,
				type: 'number',
			},
		],
		[],
	);

	const trainingColumns = useMemo(
		() => [
			createRowNumberColumn(),
			{ field: 'trainingName', headerName: 'TRAINING', minWidth: 280, flex: 1 },
			{ field: 'employeeCount', headerName: 'JUMLAH KARYAWAN', minWidth: 150, type: 'number' },
			{
				field: 'employees',
				headerName: 'KARYAWAN',
				minWidth: 320,
				flex: 1.5,
				sortable: false,
				renderCell: (params) => {
					const names = (params.value || []).map((employee) => employee.fullName).join(', ');

					return (
						<Tooltip title={names}>
							<Typography variant="body2" noWrap sx={{ maxWidth: '100%' }}>
								{names || '-'}
							</Typography>
						</Tooltip>
					);
				},
			},
		],
		[],
	);

	const handleExportGap = () => {
		downloadCsv(
			`rekap-job-requirement-${new Date().toISOString().slice(0, 10)}.csv`,
			['Nama', 'NIK', 'Departemen', 'Job Level', 'Grade', 'Status', '% Item', 'Wajib Kurang', 'Total Kurang'],
			filteredRows.map((row) => [
				row.fullName,
				row.employeeNo,
				row.departmentName,
				row.jobLevelName,
				getGradeLabel(row.grade),
				row.statusLabel,
				`${row.percentOverall ?? 0}%`,
				row.unmetMandatoryCount,
				row.unmetTotalCount,
			]),
		);
	};

	const handleExportTraining = () => {
		downloadCsv(
			`kebutuhan-training-${new Date().toISOString().slice(0, 10)}.csv`,
			['Training', 'Jumlah Karyawan', 'Daftar Karyawan'],
			trainingNeeds.map((row) => [
				row.trainingName,
				row.employeeCount,
				(row.employees || []).map((employee) => employee.fullName).join(', '),
			]),
		);
	};

	return (
		<>
			<PageHeader title="Rekap Job Requirement">
				<Typography variant="body2" color="text.secondary">
					Perbandingan syarat jabatan (SII-QSHE-002-03) terhadap data karyawan.
				</Typography>
			</PageHeader>

			<Card sx={{ minHeight: '60vh', p: 3 }}>
				<Stack spacing={2.5}>
					<Tabs value={activeTab} onChange={(_event, value) => setActiveTab(value)}>
						<Tab value="GAP" label="Rekap Gap" />
						<Tab value="TRAINING" label="Kebutuhan Training" />
					</Tabs>

					{activeTab === 'GAP' ? (
						<>
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
									<TextField
										fullWidth
										size="small"
										select
										label="Status"
										value={statusFilter}
										onChange={(event) => setStatusFilter(event.target.value)}
									>
										{STATUS_OPTIONS.map((option) => (
											<MenuItem key={option.value} value={option.value}>
												{option.label}
											</MenuItem>
										))}
									</TextField>
								</Grid>
							</Grid>

							<Stack direction="row" justifyContent="space-between" alignItems="center">
								<Typography variant="body2" color="text.secondary">
									{filteredRows.length} karyawan
								</Typography>
								<Button
									variant="outlined"
									size="small"
									startIcon={<DownloadOutlinedIcon />}
									onClick={handleExportGap}
									disabled={filteredRows.length === 0}
								>
									Export CSV
								</Button>
							</Stack>

							{loading ? (
								<Stack alignItems="center" justifyContent="center" py={10}>
									<CircularProgress />
								</Stack>
							) : (
								<EnhancedTable
									rows={filteredRows}
									columns={gapColumns}
									getRowId={(row) => row.employeeId}
									columnResizeKey="job-requirement-gap-table"
									getContextMenuActions={(row) => [
										{
											label: 'Buka Detail Karyawan',
											onClick: () => navigate(`/data-karyawan/detail-karyawan/${row.employeeId}`),
										},
									]}
								/>
							)}
						</>
					) : (
						<>
							<Stack direction="row" justifyContent="space-between" alignItems="center">
								<Typography variant="body2" color="text.secondary">
									{trainingNeeds.length} item training dibutuhkan
								</Typography>
								<Button
									variant="outlined"
									size="small"
									startIcon={<DownloadOutlinedIcon />}
									onClick={handleExportTraining}
									disabled={trainingNeeds.length === 0}
								>
									Export CSV
								</Button>
							</Stack>

							{trainingLoading ? (
								<Stack alignItems="center" justifyContent="center" py={10}>
									<CircularProgress />
								</Stack>
							) : (
								<Box>
									<EnhancedTable
										rows={trainingNeeds}
										columns={trainingColumns}
										getRowId={(row) => row.trainingName}
										columnResizeKey="job-requirement-training-table"
									/>
								</Box>
							)}
						</>
					)}
				</Stack>
			</Card>
		</>
	);
}

export default JobRequirementRecapPage;
