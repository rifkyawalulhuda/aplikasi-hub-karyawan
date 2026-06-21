import { useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';
import Chart from 'react-apexcharts';

import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

import ExpandMoreOutlined from '@mui/icons-material/ExpandMoreOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';

import PageHeader from '@/components/pageHeader';
import apiRequest from '@/services/api';
import { useSite } from '@/contexts/siteContext';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const LEAVE_STATUS_MAP = {
	SUBMITTED: { label: 'Diajukan', color: 'info' },
	IN_APPROVAL: { label: 'Dalam Approval', color: 'warning' },
	APPROVED: { label: 'Disetujui', color: 'success' },
	REJECTED: { label: 'Ditolak', color: 'error' },
	CANCELLED: { label: 'Dibatalkan', color: 'default' },
};

const sectionAccordionSx = {
	border: 1,
	borderColor: 'divider',
	borderRadius: 2,
	mb: 2,
	'&:before': { display: 'none' },
	'&.Mui-expanded': { mb: 2 },
};

function SummaryCard({ icon: Icon, title, value, color = 'primary.main' }) {
	return (
		<Card sx={{ height: '100%' }}>
			<CardContent>
				<Stack direction="row" alignItems="center" spacing={2}>
					<Box
						sx={{
							width: 48,
							height: 48,
							borderRadius: 2,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							bgcolor: `${color}15`,
						}}
					>
						<Icon sx={{ color, fontSize: 28 }} />
					</Box>
					<Stack spacing={0.25}>
						<Typography variant="body2" color="text.secondary">
							{title}
						</Typography>
						<Typography variant="h4" fontWeight={700}>
							{value}
						</Typography>
					</Stack>
				</Stack>
			</CardContent>
		</Card>
	);
}

function DashboardPage() {
	const theme = useTheme();
	const { enqueueSnackbar } = useSnackbar();
	const { currentSiteId } = useSite();
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchDashboard = async () => {
			setLoading(true);
			try {
				const params = currentSiteId ? `?siteId=${currentSiteId}` : '';
				const result = await apiRequest(`/dashboard${params}`);
				setData(result);
			} catch (error) {
				enqueueSnackbar(error.message || 'Gagal memuat data dashboard.', { variant: 'error' });
			} finally {
				setLoading(false);
			}
		};

		fetchDashboard();
	}, [enqueueSnackbar, currentSiteId]);

	if (loading) {
		return (
			<>
				<PageHeader title="Dashboard" />
				<Stack alignItems="center" justifyContent="center" py={20}>
					<CircularProgress />
				</Stack>
			</>
		);
	}

	if (!data) {
		return (
			<>
				<PageHeader title="Dashboard" />
				<Typography color="text.secondary" textAlign="center" py={10}>
					Gagal memuat data dashboard.
				</Typography>
			</>
		);
	}

	const { summary, charts, tables, b3Waste } = data;
	const isDark = theme.palette.mode === 'dark';
	const chartTextColor = isDark ? '#ccc' : '#555';

	// Bar chart — by department
	const departmentChartOptions = {
		chart: { type: 'bar', toolbar: { show: false } },
		plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
		xaxis: { categories: charts.byDepartment.map((d) => d.name), labels: { style: { colors: chartTextColor } } },
		yaxis: { labels: { style: { colors: chartTextColor } } },
		colors: [theme.palette.primary.main],
		dataLabels: { enabled: true },
		tooltip: { theme: isDark ? 'dark' : 'light' },
	};
	const departmentChartSeries = [{ name: 'Karyawan', data: charts.byDepartment.map((d) => d.count) }];

	// Donut chart — by job level
	const jobLevelChartOptions = {
		chart: { type: 'donut' },
		labels: charts.byJobLevel.map((d) => d.name),
		legend: { position: 'bottom', labels: { colors: chartTextColor } },
		tooltip: { theme: isDark ? 'dark' : 'light' },
	};
	const jobLevelChartSeries = charts.byJobLevel.map((d) => d.count);

	// Donut chart — by employment type
	const employmentTypeChartOptions = {
		chart: { type: 'donut' },
		labels: charts.byEmploymentType.map((d) => d.name),
		colors: [theme.palette.primary.main, theme.palette.warning.main],
		legend: { position: 'bottom', labels: { colors: chartTextColor } },
		tooltip: { theme: isDark ? 'dark' : 'light' },
	};
	const employmentTypeChartSeries = charts.byEmploymentType.map((d) => d.count);

	// Area chart — monthly leave trend
	const leaveTrendChartOptions = {
		chart: { type: 'area', toolbar: { show: false }, sparkline: { enabled: false } },
		xaxis: { categories: MONTH_LABELS, labels: { style: { colors: chartTextColor } } },
		yaxis: { labels: { style: { colors: chartTextColor } } },
		stroke: { curve: 'smooth', width: 2 },
		fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.1 } },
		colors: [theme.palette.info.main],
		dataLabels: { enabled: false },
		tooltip: { theme: isDark ? 'dark' : 'light' },
	};
	const leaveTrendChartSeries = [{ name: 'Pengajuan Cuti', data: charts.monthlyLeaveTrend.map((d) => d.count) }];

	// Bar chart — by site
	const siteChartOptions = {
		chart: { type: 'bar', toolbar: { show: false } },
		plotOptions: { bar: { borderRadius: 4, columnWidth: '50%' } },
		xaxis: { categories: charts.bySite.map((d) => d.name), labels: { style: { colors: chartTextColor } } },
		yaxis: { labels: { style: { colors: chartTextColor } } },
		colors: [theme.palette.success.main],
		dataLabels: { enabled: true },
		tooltip: { theme: isDark ? 'dark' : 'light' },
	};
	const siteChartSeries = [{ name: 'Karyawan', data: charts.bySite.map((d) => d.count) }];

	// Area chart — B3 waste trend (6 months)
	const b3TrendChartOptions = {
		chart: { type: 'area', toolbar: { show: false } },
		xaxis: {
			categories: b3Waste?.trendBulanan?.map((d) => d.bulan) || [],
			labels: { style: { colors: chartTextColor } },
		},
		yaxis: { labels: { style: { colors: chartTextColor } } },
		stroke: { curve: 'smooth', width: 2 },
		fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.1 } },
		colors: ['#1976d2', '#2e7d32'],
		dataLabels: { enabled: false },
		tooltip: { theme: isDark ? 'dark' : 'light' },
	};
	const b3TrendChartSeries = [
		{ name: 'Masuk', data: b3Waste?.trendBulanan?.map((d) => d.masuk) || [] },
		{ name: 'Keluar', data: b3Waste?.trendBulanan?.map((d) => d.keluar) || [] },
	];

	return (
		<>
			<PageHeader title="Dashboard" />
			<Stack spacing={3}>
				{/* Section 1: Ringkasan — always visible, not collapsible */}
				<Grid container spacing={2.5}>
					<Grid item xs={12} sm={6} md={3}>
						<SummaryCard
							icon={PeopleOutlinedIcon}
							title="Total Karyawan"
							value={summary.totalEmployees}
							color={theme.palette.primary.main}
						/>
					</Grid>
					<Grid item xs={12} sm={6} md={3}>
						<SummaryCard
							icon={BusinessOutlinedIcon}
							title="Jumlah Site"
							value={summary.siteCount}
							color={theme.palette.success.main}
						/>
					</Grid>
					<Grid item xs={12} sm={6} md={3}>
						<SummaryCard
							icon={EventNoteOutlinedIcon}
							title="Cuti Aktif"
							value={summary.activeLeaveRequests}
							color={theme.palette.info.main}
						/>
					</Grid>
					<Grid item xs={12} sm={6} md={3}>
						<SummaryCard
							icon={WarningAmberOutlinedIcon}
							title="Lisensi Akan Expired"
							value={summary.expiringLicenses}
							color={theme.palette.warning.main}
						/>
					</Grid>
					{b3Waste && (
						<Grid item xs={12} sm={6} md={3}>
							<SummaryCard
								icon={ScienceOutlinedIcon}
								title="Limbah B3 di TPS"
								value={`${Number(b3Waste.sisaDiTps).toLocaleString('id-ID')} kg`}
								color={b3Waste.overdueCount > 0 ? theme.palette.error.main : theme.palette.info.main}
							/>
						</Grid>
					)}
				</Grid>

				{/* Section 2: Karyawan — collapsible, default expanded */}
				<Accordion defaultExpanded elevation={0} sx={sectionAccordionSx}>
					<AccordionSummary expandIcon={<ExpandMoreOutlined />}>
						<Typography variant="h6" fontWeight={700}>
							Karyawan
						</Typography>
					</AccordionSummary>
					<AccordionDetails sx={{ px: 2, pb: 2 }}>
						<Grid container spacing={2.5}>
							<Grid item xs={12} md={7}>
								<Card sx={{ p: 2.5 }}>
									<Typography variant="h6" fontWeight={700} gutterBottom>
										Distribusi Karyawan per Department
									</Typography>
									<Chart
										options={departmentChartOptions}
										series={departmentChartSeries}
										type="bar"
										height={Math.max(charts.byDepartment.length * 42, 200)}
									/>
								</Card>
							</Grid>
							<Grid item xs={12} md={5}>
								<Card sx={{ p: 2.5 }}>
									<Typography variant="h6" fontWeight={700} gutterBottom>
										Distribusi per Job Level
									</Typography>
									<Chart
										options={jobLevelChartOptions}
										series={jobLevelChartSeries}
										type="donut"
										height={320}
									/>
								</Card>
							</Grid>
							<Grid item xs={12} md={4}>
								<Card sx={{ p: 2.5 }}>
									<Typography variant="h6" fontWeight={700} gutterBottom>
										Tipe Karyawan
									</Typography>
									<Chart
										options={employmentTypeChartOptions}
										series={employmentTypeChartSeries}
										type="donut"
										height={280}
									/>
								</Card>
							</Grid>
							<Grid item xs={12} md={8}>
								<Card sx={{ p: 2.5 }}>
									<Typography variant="h6" fontWeight={700} gutterBottom>
										Karyawan per Site
									</Typography>
									<Chart
										options={siteChartOptions}
										series={siteChartSeries}
										type="bar"
										height={280}
									/>
								</Card>
							</Grid>
						</Grid>
					</AccordionDetails>
				</Accordion>

				{/* Section 3: Cuti & Lisensi — collapsible, default expanded */}
				<Accordion defaultExpanded elevation={0} sx={sectionAccordionSx}>
					<AccordionSummary expandIcon={<ExpandMoreOutlined />}>
						<Typography variant="h6" fontWeight={700}>
							Cuti & Lisensi
						</Typography>
					</AccordionSummary>
					<AccordionDetails sx={{ px: 2, pb: 2 }}>
						<Grid container spacing={2.5}>
							<Grid item xs={12}>
								<Card sx={{ p: 2.5 }}>
									<Typography variant="h6" fontWeight={700} gutterBottom>
										Tren Pengajuan Cuti {new Date().getFullYear()}
									</Typography>
									<Chart
										options={leaveTrendChartOptions}
										series={leaveTrendChartSeries}
										type="area"
										height={280}
									/>
								</Card>
							</Grid>
							<Grid item xs={12} md={6}>
								<Card sx={{ p: 2.5 }}>
									<Typography variant="h6" fontWeight={700} gutterBottom>
										Lisensi & Sertifikasi Akan Expired
									</Typography>
									{tables.expiringLicenses.length === 0 ? (
										<Typography variant="body2" color="text.secondary" py={3} textAlign="center">
											Tidak ada lisensi yang akan expired.
										</Typography>
									) : (
										<TableContainer>
											<Table size="small">
												<TableHead>
													<TableRow>
														<TableCell sx={{ fontWeight: 600 }}>Karyawan</TableCell>
														<TableCell sx={{ fontWeight: 600 }}>Dokumen</TableCell>
														<TableCell sx={{ fontWeight: 600 }}>Berlaku Sampai</TableCell>
														<TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
													</TableRow>
												</TableHead>
												<TableBody>
													{tables.expiringLicenses.map((item) => (
														<TableRow key={item.id}>
															<TableCell>
																{item.employeeName}
																<br />
																<Typography variant="caption" color="text.secondary">
																	{item.employeeNo}
																</Typography>
															</TableCell>
															<TableCell>{item.documentName}</TableCell>
															<TableCell>{item.validUntil}</TableCell>
															<TableCell>
																<Chip
																	label={item.status}
																	size="small"
																	color={
																		item.status === 'Expired' ? 'error' : 'warning'
																	}
																/>
															</TableCell>
														</TableRow>
													))}
												</TableBody>
											</Table>
										</TableContainer>
									)}
								</Card>
							</Grid>
							<Grid item xs={12} md={6}>
								<Card sx={{ p: 2.5 }}>
									<Typography variant="h6" fontWeight={700} gutterBottom>
										Pengajuan Cuti Terbaru
									</Typography>
									{tables.recentLeaves.length === 0 ? (
										<Typography variant="body2" color="text.secondary" py={3} textAlign="center">
											Belum ada pengajuan cuti.
										</Typography>
									) : (
										<TableContainer>
											<Table size="small">
												<TableHead>
													<TableRow>
														<TableCell sx={{ fontWeight: 600 }}>Karyawan</TableCell>
														<TableCell sx={{ fontWeight: 600 }}>Jenis Cuti</TableCell>
														<TableCell sx={{ fontWeight: 600 }}>Tanggal</TableCell>
														<TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
													</TableRow>
												</TableHead>
												<TableBody>
													{tables.recentLeaves.map((item) => (
														<TableRow key={item.id}>
															<TableCell>
																{item.employeeName}
																<br />
																<Typography variant="caption" color="text.secondary">
																	{item.employeeNo}
																</Typography>
															</TableCell>
															<TableCell>{item.leaveType}</TableCell>
															<TableCell>{item.createdAt}</TableCell>
															<TableCell>
																<Chip
																	label={
																		LEAVE_STATUS_MAP[item.status]?.label ||
																		item.status
																	}
																	size="small"
																	color={
																		LEAVE_STATUS_MAP[item.status]?.color ||
																		'default'
																	}
																/>
															</TableCell>
														</TableRow>
													))}
												</TableBody>
											</Table>
										</TableContainer>
									)}
								</Card>
							</Grid>
						</Grid>
					</AccordionDetails>
				</Accordion>

				{/* Section 4: Limbah B3 — collapsible, default expanded */}
				{b3Waste && (
					<Accordion defaultExpanded elevation={0} sx={sectionAccordionSx}>
						<AccordionSummary expandIcon={<ExpandMoreOutlined />}>
							<Typography variant="h6" fontWeight={700}>
								Limbah B3
							</Typography>
						</AccordionSummary>
						<AccordionDetails sx={{ px: 2, pb: 2 }}>
							<Grid container spacing={2.5}>
								<Grid item xs={12} md={6}>
									<Card sx={{ p: 2.5 }}>
										<Typography variant="h6" fontWeight={700} gutterBottom>
											Tren Limbah B3 (6 Bulan)
										</Typography>
										<Chart
											options={b3TrendChartOptions}
											series={b3TrendChartSeries}
											type="area"
											height={300}
										/>
									</Card>
								</Grid>
								<Grid item xs={12} md={6}>
									<Card sx={{ p: 2.5 }}>
										<Typography variant="h6" fontWeight={700} gutterBottom>
											Ringkasan Limbah B3
										</Typography>
										<Stack spacing={2} sx={{ mt: 1 }}>
											<Stack direction="row" justifyContent="space-between">
												<Typography variant="body2" color="text.secondary">
													Total Masuk
												</Typography>
												<Typography variant="body1" fontWeight={600}>
													{Number(b3Waste.totalMasuk).toLocaleString('id-ID')} kg
												</Typography>
											</Stack>
											<Stack direction="row" justifyContent="space-between">
												<Typography variant="body2" color="text.secondary">
													Total Keluar
												</Typography>
												<Typography variant="body1" fontWeight={600}>
													{Number(b3Waste.totalKeluar).toLocaleString('id-ID')} kg
												</Typography>
											</Stack>
											<Stack direction="row" justifyContent="space-between">
												<Typography variant="body2" color="text.secondary">
													Sisa di TPS
												</Typography>
												<Typography variant="body1" fontWeight={700} color="primary">
													{Number(b3Waste.sisaDiTps).toLocaleString('id-ID')} kg
												</Typography>
											</Stack>
											<Stack direction="row" justifyContent="space-between">
												<Typography variant="body2" color="text.secondary">
													Overdue (Melebihi Batas)
												</Typography>
												<Chip
													label={b3Waste.overdueCount}
													size="small"
													color={b3Waste.overdueCount > 0 ? 'error' : 'default'}
												/>
											</Stack>
											<Stack direction="row" justifyContent="space-between">
												<Typography variant="body2" color="text.secondary">
													Warning (1–14 Hari)
												</Typography>
												<Chip
													label={b3Waste.warningCount}
													size="small"
													color={b3Waste.warningCount > 0 ? 'warning' : 'default'}
												/>
											</Stack>
										</Stack>
									</Card>
								</Grid>
							</Grid>
						</AccordionDetails>
					</Accordion>
				)}
			</Stack>
		</>
	);
}

export default DashboardPage;
