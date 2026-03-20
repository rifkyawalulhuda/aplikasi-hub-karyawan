import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';

import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import BeenhereOutlinedIcon from '@mui/icons-material/BeenhereOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import GppMaybeOutlinedIcon from '@mui/icons-material/GppMaybeOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import WorkOutlineOutlinedIcon from '@mui/icons-material/WorkOutlineOutlined';

import PageHeader from '@/components/pageHeader';
import apiRequest from '@/services/api';

async function fetchEmployeeSummary(id) {
	return apiRequest(`/master/employees/${id}/summary`);
}

function getInitials(fullName = '') {
	return fullName
		.split(' ')
		.slice(0, 2)
		.map((w) => w[0] || '')
		.join('')
		.toUpperCase();
}

function formatDate(raw) {
	if (!raw) return '-';
	const d = new Date(raw);
	if (Number.isNaN(d.getTime())) return raw;
	return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function LicenseStatusChip({ status }) {
	if (status === 'EXPIRED') return <Chip size="small" label="Expired" color="error" />;
	if (status === 'SOON') return <Chip size="small" label="Akan Expired" color="warning" />;
	return <Chip size="small" label="Aktif" color="success" />;
}

function LeaveStatusChip({ status }) {
	const map = {
		PENDING: { label: 'Pending', color: 'default' },
		APPROVED: { label: 'Approved', color: 'success' },
		REJECTED: { label: 'Rejected', color: 'error' },
		CANCELLED: { label: 'Dibatalkan', color: 'default' },
	};
	const config = map[status] || { label: status, color: 'default' };
	return <Chip size="small" label={config.label} color={config.color} />;
}

function SectionCard({ title, icon: Icon, color = 'primary.main', children }) {
	return (
		<Card
			variant="outlined"
			sx={{
				borderRadius: 3,
				overflow: 'hidden',
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
			}}
		>
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
				<Icon sx={{ color, fontSize: 20 }} />
				<Typography variant="subtitle2" fontWeight={700} color={color}>
					{title}
				</Typography>
			</Box>
			<Box sx={{ flexGrow: 1 }}>{children}</Box>
		</Card>
	);
}

function StatBadge({ label, value, color = 'primary.main' }) {
	return (
		<Box
			sx={{
				textAlign: 'center',
				px: 2,
				py: 1.5,
				borderRadius: 2,
				bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'background.default' : 'grey.100'),
				minWidth: 80,
			}}
		>
			<Typography variant="h5" fontWeight={800} color={color} lineHeight={1}>
				{value}
			</Typography>
			<Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
				{label}
			</Typography>
		</Box>
	);
}

function EmptySection() {
	return (
		<Box px={2.5} py={3} textAlign="center">
			<Typography variant="body2" color="text.secondary">
				Tidak ada data
			</Typography>
		</Box>
	);
}

function EmployeeDetailPage() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { enqueueSnackbar } = useSnackbar();
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const init = async () => {
			setLoading(true);
			try {
				const result = await fetchEmployeeSummary(id);
				setData(result);
			} catch (error) {
				enqueueSnackbar(error.message, { variant: 'error' });
			} finally {
				setLoading(false);
			}
		};
		init();
	}, [id, enqueueSnackbar]);

	if (loading) {
		return (
			<Stack alignItems="center" justifyContent="center" minHeight="60vh">
				<CircularProgress />
			</Stack>
		);
	}

	if (!data) return null;

	const {
		profile,
		summary,
		recentGuidanceRecords,
		recentWarningLetters,
		licenseCertifications,
		leaveBalances,
		recentLeaveFlows,
	} = data;

	return (
		<>
			<PageHeader title="Detail Karyawan">
				<Breadcrumbs aria-label="breadcrumb" sx={{ textTransform: 'uppercase' }}>
					<Link underline="hover" href="#!">
						Data Karyawan
					</Link>
					<Link underline="hover" href="/data-karyawan/detail-karyawan">
						Detail Karyawan
					</Link>
					<Typography color="text.tertiary">{profile.fullName}</Typography>
				</Breadcrumbs>
			</PageHeader>

			<Stack spacing={3}>
				{/* ── Profile Card ── */}
				<Card
					sx={{
						borderRadius: 3,
						background: (theme) =>
							theme.palette.mode === 'dark'
								? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`
								: 'linear-gradient(135deg, #1565C0 0%, #1976D2 50%, #42A5F5 100%)',
						color: 'white',
						position: 'relative',
						overflow: 'hidden',
					}}
				>
					<CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
						<Button
							size="small"
							startIcon={<ArrowBackOutlinedIcon />}
							onClick={() => navigate('/data-karyawan/detail-karyawan')}
							sx={{
								color: 'rgba(255,255,255,0.85)',
								mb: 2,
								'&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
							}}
						>
							Kembali ke Daftar
						</Button>
						<Grid container spacing={3} alignItems="flex-start">
							<Grid item xs={12} md="auto">
								<Avatar
									sx={{
										width: 90,
										height: 90,
										fontSize: 32,
										fontWeight: 800,
										bgcolor: 'rgba(255,255,255,0.25)',
										color: 'white',
										border: '3px solid rgba(255,255,255,0.4)',
									}}
								>
									{getInitials(profile.fullName)}
								</Avatar>
							</Grid>
							<Grid item xs={12} md>
								<Typography variant="h4" fontWeight={800} mb={0.5} sx={{ color: 'white' }}>
									{profile.fullName}
								</Typography>
								<Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1.5 }}>
									NIK: {profile.employeeNo} &nbsp;·&nbsp; {profile.employmentType}
								</Typography>
								<Stack direction="row" flexWrap="wrap" gap={1}>
									{[
										{
											icon: <WorkOutlineOutlinedIcon fontSize="inherit" />,
											label: profile.departmentName,
										},
										{
											icon: <BadgeOutlinedIcon fontSize="inherit" />,
											label: `${profile.jobLevelName} — ${profile.jobRoleName}`,
										},
										{
											icon: <PersonOutlinedIcon fontSize="inherit" />,
											label: `Grade ${profile.grade}`,
										},
										{
											icon: <CalendarMonthOutlinedIcon fontSize="inherit" />,
											label: `Bergabung ${formatDate(profile.joinDate)}`,
										},
									].map((item) => (
										<Chip
											key={item.label}
											icon={item.icon}
											label={item.label}
											size="small"
											sx={{
												bgcolor: 'rgba(255,255,255,0.18)',
												color: 'white',
												'& .MuiChip-icon': { color: 'white' },
												fontWeight: 500,
											}}
										/>
									))}
								</Stack>
							</Grid>
							<Grid item xs={12} md="auto">
								<Stack direction="row" flexWrap="wrap" gap={1.5}>
									<StatBadge label="Bimbingan" value={summary.guidanceCount} />
									<StatBadge label="Surat Peringatan" value={summary.warningLetterCount} />
									<StatBadge label="Lisensi" value={summary.licenseCount} />
									<StatBadge label="Pengajuan Cuti" value={summary.leaveFlowCount} />
								</Stack>
							</Grid>
						</Grid>

						{/* Info Row */}
						<Divider sx={{ my: 2.5, borderColor: 'rgba(255,255,255,0.2)' }} />
						<Grid container spacing={2}>
							{[
								{ label: 'Work Location', value: profile.workLocationName },
								{ label: 'Masa Kerja', value: profile.lengthOfService },
								{ label: 'Usia', value: `${profile.age} tahun` },
								{ label: 'Gender', value: profile.gender === 'MALE' ? 'Laki-laki' : 'Perempuan' },
								{ label: 'Pendidikan', value: profile.educationLevel },
								{ label: 'Telepon', value: profile.phoneNumber },
								{ label: 'Email', value: profile.email || '-' },
								...(profile.groupShiftName
									? [{ label: 'Group Shift', value: profile.groupShiftName }]
									: []),
							].map((item) => (
								<Grid item xs={6} sm={4} md={3} key={item.label}>
									<Typography
										variant="caption"
										sx={{ color: 'rgba(255,255,255,0.6)', display: 'block', mb: 0.25 }}
									>
										{item.label}
									</Typography>
									<Typography
										variant="body2"
										fontWeight={600}
										sx={{ color: 'rgba(255,255,255,0.95)' }}
									>
										{item.value || '-'}
									</Typography>
								</Grid>
							))}
						</Grid>
					</CardContent>
				</Card>

				{/* ── Section Grid ── */}
				<Grid container spacing={2.5}>
					{/* Bimbingan & Pengarahan */}
					<Grid item xs={12} lg={6}>
						<SectionCard title="Bimbingan & Pengarahan" icon={ReceiptLongOutlinedIcon} color="info.main">
							<Box px={2.5} py={1.5}>
								<Stack direction="row" gap={1.5} mb={1.5}>
									<StatBadge label="Total" value={summary.guidanceCount} color="info.main" />
								</Stack>
							</Box>
							{recentGuidanceRecords.length === 0 ? (
								<EmptySection />
							) : (
								<TableContainer>
									<Table size="small">
										<TableHead>
											<TableRow sx={{ '& th': { fontWeight: 600, fontSize: 12 } }}>
												<TableCell>Kategori</TableCell>
												<TableCell>Pertemuan Ke</TableCell>
												<TableCell>Tanggal</TableCell>
												<TableCell>Tempat</TableCell>
											</TableRow>
										</TableHead>
										<TableBody>
											{recentGuidanceRecords.map((r) => (
												<TableRow key={r.id} hover>
													<TableCell>
														<Chip
															size="small"
															label={
																r.category === 'GUIDANCE' ? 'Bimbingan' : 'Pengarahan'
															}
															color={r.category === 'GUIDANCE' ? 'info' : 'secondary'}
															variant="outlined"
														/>
													</TableCell>
													<TableCell>{r.meetingNumber}</TableCell>
													<TableCell sx={{ fontSize: 12 }}>
														{formatDate(r.meetingDate)}
													</TableCell>
													<TableCell
														sx={{
															fontSize: 12,
															maxWidth: 120,
															overflow: 'hidden',
															textOverflow: 'ellipsis',
															whiteSpace: 'nowrap',
														}}
													>
														{r.location || '-'}
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</TableContainer>
							)}
							<Box px={2.5} py={1} textAlign="right">
								<Button
									size="small"
									variant="text"
									color="info"
									onClick={() =>
										navigate(
											`/data-karyawan/bimbingan-pengarahan?search=${encodeURIComponent(
												profile.fullName,
											)}`,
										)
									}
								>
									Lihat semua →
								</Button>
							</Box>
						</SectionCard>
					</Grid>

					{/* Surat Peringatan */}
					<Grid item xs={12} lg={6}>
						<SectionCard title="Surat Peringatan" icon={ErrorOutlineOutlinedIcon} color="error.main">
							<Box px={2.5} py={1.5}>
								<Stack direction="row" gap={1.5} mb={1.5}>
									<StatBadge label="Total" value={summary.warningLetterCount} color="error.main" />
									<StatBadge
										label="Aktif (6 bln)"
										value={summary.activeWarningLetterCount}
										color={summary.activeWarningLetterCount > 0 ? 'error.main' : 'success.main'}
									/>
								</Stack>
							</Box>
							{recentWarningLetters.length === 0 ? (
								<EmptySection />
							) : (
								<TableContainer>
									<Table size="small">
										<TableHead>
											<TableRow sx={{ '& th': { fontWeight: 600, fontSize: 12 } }}>
												<TableCell>Tipe</TableCell>
												<TableCell>SP Ke</TableCell>
												<TableCell>No. Surat</TableCell>
												<TableCell>Tanggal</TableCell>
											</TableRow>
										</TableHead>
										<TableBody>
											{recentWarningLetters.map((w) => (
												<TableRow key={w.id} hover>
													<TableCell>
														<Chip
															size="small"
															label={
																w.category === 'WARNING_LETTER'
																	? 'Peringatan'
																	: 'Teguran'
															}
															color={
																w.category === 'WARNING_LETTER' ? 'error' : 'warning'
															}
															variant="outlined"
														/>
													</TableCell>
													<TableCell>{w.warningLevel || '-'}</TableCell>
													<TableCell sx={{ fontSize: 12 }}>{w.letterNumber || '-'}</TableCell>
													<TableCell sx={{ fontSize: 12 }}>
														{formatDate(w.letterDate)}
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</TableContainer>
							)}
							<Box px={2.5} py={1} textAlign="right">
								<Button
									size="small"
									variant="text"
									color="error"
									onClick={() =>
										navigate(
											`/data-karyawan/data-surat-peringatan?search=${encodeURIComponent(
												profile.fullName,
											)}`,
										)
									}
								>
									Lihat semua →
								</Button>
							</Box>
						</SectionCard>
					</Grid>

					{/* Lisensi & Sertifikasi */}
					<Grid item xs={12} lg={6}>
						<SectionCard title="Lisensi & Sertifikasi" icon={VerifiedOutlinedIcon} color="success.main">
							<Box px={2.5} py={1.5}>
								<Stack direction="row" gap={1.5} mb={1.5}>
									<StatBadge label="Total" value={summary.licenseCount} color="success.main" />
									<StatBadge
										label="Expired"
										value={summary.licenseExpiredCount}
										color={summary.licenseExpiredCount > 0 ? 'error.main' : 'success.main'}
									/>
									<StatBadge
										label="Akan Exp."
										value={summary.licenseSoonCount}
										color={summary.licenseSoonCount > 0 ? 'warning.main' : 'success.main'}
									/>
								</Stack>
							</Box>
							{licenseCertifications.length === 0 ? (
								<EmptySection />
							) : (
								<TableContainer>
									<Table size="small">
										<TableHead>
											<TableRow sx={{ '& th': { fontWeight: 600, fontSize: 12 } }}>
												<TableCell>Dokumen</TableCell>
												<TableCell>No. Dokumen</TableCell>
												<TableCell>Masa Berlaku</TableCell>
												<TableCell>Status</TableCell>
											</TableRow>
										</TableHead>
										<TableBody>
											{licenseCertifications.map((l) => (
												<TableRow key={l.id} hover>
													<TableCell sx={{ maxWidth: 160, fontSize: 12 }}>
														<Typography variant="caption" fontWeight={600} display="block">
															{l.documentName || '-'}
														</Typography>
														<Typography variant="caption" color="text.secondary">
															{l.documentType || ''}
														</Typography>
													</TableCell>
													<TableCell sx={{ fontSize: 12 }}>
														{l.documentNumber || '-'}
													</TableCell>
													<TableCell sx={{ fontSize: 12 }}>
														{formatDate(l.expiryDate)}
													</TableCell>
													<TableCell>
														<LicenseStatusChip status={l.status} />
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</TableContainer>
							)}
							<Box px={2.5} py={1} textAlign="right">
								<Button
									size="small"
									variant="text"
									color="success"
									onClick={() =>
										navigate(
											`/data-karyawan/lisensi-sertifikasi?search=${encodeURIComponent(
												profile.fullName,
											)}`,
										)
									}
								>
									Lihat semua →
								</Button>
							</Box>
						</SectionCard>
					</Grid>

					{/* Saldo Cuti */}
					<Grid item xs={12} lg={6}>
						<SectionCard title="Saldo Cuti Karyawan" icon={BeenhereOutlinedIcon} color="secondary.main">
							{leaveBalances.length === 0 ? (
								<EmptySection />
							) : (
								<Box sx={{ p: 2.5 }}>
									<Grid container spacing={1.5}>
										{leaveBalances.map((lb) => (
											<Grid item xs={12} sm={6} key={lb.id}>
												<Box
													sx={{
														borderRadius: 2,
														border: '1px solid',
														borderColor: 'divider',
														p: 1.5,
														position: 'relative',
														overflow: 'hidden',
													}}
												>
													<Box
														sx={{
															position: 'absolute',
															top: 0,
															left: 0,
															width: `${Math.round(
																(lb.remainingLeave / (lb.leaveDays || 1)) * 100,
															)}%`,
															height: '100%',
															bgcolor: 'secondary.main',
															opacity: 0.06,
															transition: 'width 0.4s',
														}}
													/>
													<Typography
														variant="caption"
														color="text.secondary"
														fontWeight={600}
													>
														{lb.leaveType}
													</Typography>
													<Typography
														variant="caption"
														color="text.secondary"
														display="block"
														mb={0.5}
													>
														Tahun {lb.year}
													</Typography>
													<Stack
														direction="row"
														justifyContent="space-between"
														alignItems="baseline"
													>
														<Typography
															variant="h6"
															fontWeight={800}
															color="secondary.main"
														>
															{lb.remainingLeave}
														</Typography>
														<Typography variant="caption" color="text.secondary">
															/ {lb.leaveDays} hari
														</Typography>
													</Stack>
													<Typography variant="caption" color="text.secondary">
														Sisa cuti
													</Typography>
												</Box>
											</Grid>
										))}
									</Grid>
								</Box>
							)}
							<Box px={2.5} py={1} textAlign="right">
								<Button
									size="small"
									variant="text"
									color="secondary"
									onClick={() =>
										navigate(
											`/data-karyawan/cuti-karyawan?search=${encodeURIComponent(
												profile.fullName,
											)}`,
										)
									}
								>
									Lihat lengkap →
								</Button>
							</Box>
						</SectionCard>
					</Grid>

					{/* Flow Proses Cuti */}
					<Grid item xs={12}>
						<SectionCard title="Riwayat Pengajuan Cuti" icon={GppMaybeOutlinedIcon} color="primary.main">
							<Box px={2.5} py={1.5}>
								<StatBadge
									label="Total Pengajuan"
									value={summary.leaveFlowCount}
									color="primary.main"
								/>
							</Box>
							{recentLeaveFlows.length === 0 ? (
								<EmptySection />
							) : (
								<TableContainer>
									<Table size="small">
										<TableHead>
											<TableRow sx={{ '& th': { fontWeight: 600, fontSize: 12 } }}>
												<TableCell>No. Request</TableCell>
												<TableCell>Jenis Cuti</TableCell>
												<TableCell>Periode</TableCell>
												<TableCell>Hari</TableCell>
												<TableCell>Tgl Ajuan</TableCell>
												<TableCell>Status</TableCell>
											</TableRow>
										</TableHead>
										<TableBody>
											{recentLeaveFlows.map((lf) => (
												<TableRow key={lf.id} hover>
													<TableCell sx={{ fontSize: 12, fontWeight: 600 }}>
														{lf.requestNumber || '-'}
													</TableCell>
													<TableCell>{lf.leaveType}</TableCell>
													<TableCell sx={{ fontSize: 12 }}>
														{formatDate(lf.periodStart)} – {formatDate(lf.periodEnd)}
													</TableCell>
													<TableCell>{lf.leaveDays}</TableCell>
													<TableCell sx={{ fontSize: 12 }}>
														{formatDate(lf.submittedAt)}
													</TableCell>
													<TableCell>
														<LeaveStatusChip status={lf.status} />
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</TableContainer>
							)}
							<Box px={2.5} py={1} textAlign="right">
								<Button
									size="small"
									variant="text"
									color="primary"
									onClick={() =>
										navigate(
											`/data-karyawan/cuti-karyawan/flow?search=${encodeURIComponent(
												profile.fullName,
											)}`,
										)
									}
								>
									Lihat semua pengajuan →
								</Button>
							</Box>
						</SectionCard>
					</Grid>
				</Grid>
			</Stack>
		</>
	);
}

export default EmployeeDetailPage;
