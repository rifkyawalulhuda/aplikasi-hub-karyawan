import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';

import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import LinearProgress from '@mui/material/LinearProgress';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';

import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import CakeOutlinedIcon from '@mui/icons-material/CakeOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import RadioButtonUncheckedOutlinedIcon from '@mui/icons-material/RadioButtonUncheckedOutlined';
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import WorkOutlineOutlinedIcon from '@mui/icons-material/WorkOutlineOutlined';

import SkillAssessmentDialog from '@/components/jobRequirement/skillAssessmentDialog';
import PageHeader from '@/components/pageHeader';
import apiRequest from '@/services/api';
import { formatEmployeeTrainingPeriod } from './utils';

async function fetchEmployeeSummary(id) {
	return apiRequest(`/master/employees/${id}/summary`);
}

function getInitials(fullName = '') {
	return fullName
		.split(' ')
		.slice(0, 2)
		.map((word) => word[0] || '')
		.join('')
		.toUpperCase();
}

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

function formatGrade(grade = '') {
	const match = String(grade).match(/^RANK_(\d+)$/);
	return match ? `Rank ${match[1]}` : grade;
}

function getDisciplineTypeLabel(category, warningLevel) {
	if (category === 'REPRIMAND') {
		return 'Teguran';
	}

	if (category === 'SUSPENSION') {
		return 'Skorsing';
	}

	return warningLevel ? `SP ${warningLevel}` : 'Peringatan';
}

function getDisciplineTypeColor(category) {
	if (category === 'REPRIMAND') {
		return 'warning';
	}

	if (category === 'SUSPENSION') {
		return 'secondary';
	}

	return 'error';
}

const JOB_REQUIREMENT_STATUS_META = {
	MEMENUHI: { main: 'success.main', icon: CheckCircleOutlinedIcon },
	BELUM_MEMENUHI: { main: 'error.main', icon: CancelOutlinedIcon },
	BELUM_DINILAI: { main: 'warning.main', icon: ScheduleOutlinedIcon },
	TIDAK_ADA_PROFIL: { main: 'text.disabled', icon: RadioButtonUncheckedOutlinedIcon },
};

const ITEM_RESULT_META = {
	TERPENUHI: { label: 'Terpenuhi', color: 'success' },
	BELUM_TERPENUHI: { label: 'Belum', color: 'error' },
	BELUM_DINILAI: { label: 'Belum dinilai', color: 'warning' },
	MANUAL: { label: 'Manual', color: 'default' },
};

function getCategoryChipColor(category) {
	if (category.percent >= 100) {
		return 'success';
	}

	if (category.mandatory) {
		return 'error';
	}

	return 'warning';
}

function LicenseStatusChip({ status }) {
	if (status === 'EXPIRED') {
		return <Chip size="small" label="Expired" color="error" />;
	}

	if (status === 'SOON') {
		return <Chip size="small" label="Akan Expired" color="warning" />;
	}

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

function EmptySection({ message = 'Tidak ada data' }) {
	return (
		<Box px={2.5} py={4} textAlign="center">
			<Typography variant="body2" color="text.secondary">
				{message}
			</Typography>
		</Box>
	);
}

function Panel({ title, subtitle, action, children }) {
	return (
		<Card variant="outlined" sx={{ borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
			<Stack
				direction="row"
				alignItems="flex-start"
				justifyContent="space-between"
				spacing={1.5}
				sx={{ px: 2.5, pt: 2, pb: action ? 1.5 : 2 }}
			>
				<Box sx={{ minWidth: 0 }}>
					<Typography variant="subtitle1" fontWeight={800}>
						{title}
					</Typography>
					{subtitle ? (
						<Typography variant="caption" color="text.secondary">
							{subtitle}
						</Typography>
					) : null}
				</Box>
				{action}
			</Stack>
			<Divider />
			<Box sx={{ flexGrow: 1 }}>{children}</Box>
		</Card>
	);
}

function IdentityBand({ profile, jobRequirement, onBack }) {
	const meta = JOB_REQUIREMENT_STATUS_META[jobRequirement?.status] || JOB_REQUIREMENT_STATUS_META.TIDAK_ADA_PROFIL;
	const StatusIcon = meta.icon;
	const facts = [
		{ icon: WorkOutlineOutlinedIcon, label: profile.departmentName },
		{ icon: BadgeOutlinedIcon, label: `${profile.jobLevelName} — ${profile.jobRoleName}` },
		{ icon: PersonOutlinedIcon, label: formatGrade(profile.grade) },
		{ icon: CakeOutlinedIcon, label: profile.age ? `Usia ${profile.age} tahun` : '' },
		{ icon: CalendarMonthOutlinedIcon, label: `Bergabung ${formatDate(profile.joinDate)}` },
		{ icon: ScheduleOutlinedIcon, label: profile.lengthOfService },
	].filter((fact) => fact.label);

	return (
		<Paper
			variant="outlined"
			sx={{
				borderRadius: 3,
				overflow: 'hidden',
				position: 'relative',
				pl: { xs: 2.5, md: 3 },
				pr: { xs: 2.5, md: 3 },
				py: 2.5,
				borderColor: 'divider',
				'&::before': {
					content: '""',
					position: 'absolute',
					top: 0,
					bottom: 0,
					left: 0,
					width: 4,
					bgcolor: 'primary.main',
				},
			}}
		>
			<Button
				size="small"
				color="inherit"
				startIcon={<ArrowBackOutlinedIcon />}
				onClick={onBack}
				sx={{ mb: 1.5, color: 'text.secondary' }}
			>
				Kembali ke Daftar
			</Button>
			<Grid container spacing={2.5} alignItems="center">
				<Grid item xs={12} md>
					<Stack direction="row" spacing={2} alignItems="center">
						<Avatar
							sx={{
								width: 68,
								height: 68,
								fontSize: 24,
								fontWeight: 800,
								bgcolor: 'primary.main',
								color: 'primary.contrastText',
							}}
						>
							{getInitials(profile.fullName)}
						</Avatar>
						<Box sx={{ minWidth: 0 }}>
							<Typography variant="h5" fontWeight={800} noWrap>
								{profile.fullName}
							</Typography>
							<Typography
								variant="body2"
								color="text.secondary"
								sx={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '0.02em' }}
							>
								NIK {profile.employeeNo} · {profile.employmentType}
							</Typography>
							<Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ mt: 1, rowGap: 0.75 }}>
								{facts.map((fact) => {
									const FactIcon = fact.icon;

									return (
										<Chip
											key={fact.label}
											size="small"
											icon={<FactIcon fontSize="small" />}
											label={fact.label}
											variant="outlined"
										/>
									);
								})}
							</Stack>
						</Box>
					</Stack>
				</Grid>
				<Grid item xs={12} md="auto">
					<Box
						sx={{
							border: '2px solid',
							borderColor: meta.main,
							borderRadius: 2,
							px: 2.5,
							py: 1.5,
							minWidth: 190,
							textAlign: 'center',
							bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'background.default' : 'action.hover'),
						}}
					>
						<Typography variant="overline" color="text.secondary" sx={{ letterSpacing: '0.18em' }}>
							Job Requirement
						</Typography>
						<Stack direction="row" alignItems="center" justifyContent="center" spacing={0.75}>
							<StatusIcon fontSize="small" sx={{ color: meta.main }} />
							<Typography variant="subtitle1" fontWeight={900} sx={{ color: meta.main }}>
								{jobRequirement?.statusLabel || 'Tanpa Profil'}
							</Typography>
						</Stack>
						<Typography
							variant="caption"
							color="text.secondary"
							sx={{ fontVariantNumeric: 'tabular-nums' }}
						>
							{jobRequirement?.percentOverall ?? 0}% ·{' '}
							{jobRequirement?.gradeLabel || formatGrade(profile.grade)}
						</Typography>
					</Box>
				</Grid>
			</Grid>
		</Paper>
	);
}

function AttentionStrip({ items, onJump }) {
	if (items.length === 0) {
		return (
			<Paper variant="outlined" sx={{ borderRadius: 3, px: 2, py: 1.25, borderColor: 'success.main' }}>
				<Stack direction="row" spacing={1} alignItems="center">
					<CheckCircleOutlinedIcon fontSize="small" color="success" />
					<Typography variant="body2" color="text.secondary">
						Tidak ada item yang butuh perhatian saat ini.
					</Typography>
				</Stack>
			</Paper>
		);
	}

	return (
		<Paper
			variant="outlined"
			sx={{
				borderRadius: 3,
				px: 2,
				py: 1.25,
				borderColor: 'warning.main',
				display: 'flex',
				flexWrap: 'wrap',
				gap: 1,
				alignItems: 'center',
			}}
		>
			<WarningAmberOutlinedIcon fontSize="small" color="warning" />
			<Typography variant="body2" fontWeight={700} sx={{ mr: 0.5 }}>
				Butuh perhatian
			</Typography>
			{items.map((item) => (
				<Chip
					key={item.key}
					size="small"
					label={item.label}
					color={item.color}
					variant="outlined"
					clickable
					onClick={() => onJump(item.tab)}
				/>
			))}
		</Paper>
	);
}

function ReadinessLedger({ jobRequirement, onAssess }) {
	const categories = jobRequirement?.categories || [];

	return (
		<Panel
			title="Readiness Ledger"
			subtitle="Syarat jabatan per kategori"
			action={
				<Button
					size="small"
					variant="outlined"
					startIcon={<RestartAltOutlinedIcon />}
					onClick={onAssess}
					disabled={!jobRequirement?.profile}
				>
					Asesmen
				</Button>
			}
		>
			<Stack spacing={1.25} sx={{ p: 2.5 }}>
				{categories.length === 0 ? (
					<EmptySection message="Profil job requirement untuk grade ini belum tersedia." />
				) : (
					categories.map((category) => {
						let icon = <RadioButtonUncheckedOutlinedIcon fontSize="small" color="disabled" />;
						let color = 'text.secondary';
						let progressColor = 'warning';

						if (category.percent >= 100) {
							icon = <CheckCircleOutlinedIcon fontSize="small" color="success" />;
							color = 'text.primary';
							progressColor = 'success';
						} else if (category.mandatory) {
							icon = <CancelOutlinedIcon fontSize="small" color="error" />;
							color = 'text.primary';
							progressColor = 'error';
						} else if (category.notAssessed > 0) {
							icon = <ScheduleOutlinedIcon fontSize="small" color="warning" />;
							color = 'text.primary';
						}

						return (
							<Box key={category.key}>
								<Stack direction="row" spacing={1} alignItems="center">
									{icon}
									<Typography variant="body2" fontWeight={600} sx={{ color, flexGrow: 1 }} noWrap>
										{category.label}
									</Typography>
									<Typography
										variant="caption"
										color="text.secondary"
										sx={{ fontVariantNumeric: 'tabular-nums' }}
									>
										{category.met}/{category.total}
									</Typography>
								</Stack>
								<LinearProgress
									variant="determinate"
									value={category.percent}
									sx={{ mt: 0.5, height: 4, borderRadius: 999 }}
									color={progressColor}
								/>
							</Box>
						);
					})
				)}
			</Stack>
		</Panel>
	);
}

function ActivityTimeline({ items }) {
	return (
		<Panel title="Aktivitas Terbaru" subtitle="Bimbingan, disiplin, pelatihan, dan cuti">
			{items.length === 0 ? (
				<EmptySection message="Belum ada aktivitas tercatat." />
			) : (
				<Stack sx={{ px: 2.5, py: 1.5 }} divider={<Divider flexItem />}>
					{items.map((item) => (
						<Stack key={item.id} direction="row" spacing={1.5} alignItems="flex-start" sx={{ py: 1 }}>
							<Box
								sx={{
									width: 8,
									height: 8,
									borderRadius: '50%',
									bgcolor: `${item.color}.main`,
									mt: 0.75,
									flexShrink: 0,
								}}
							/>
							<Box sx={{ minWidth: 0, flexGrow: 1 }}>
								<Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
									<Typography variant="body2" fontWeight={600} noWrap>
										{item.title}
									</Typography>
									<Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
										{formatDate(item.date)}
									</Typography>
								</Stack>
								<Typography variant="caption" color="text.secondary" display="block" noWrap>
									{item.type} · {item.subtitle || '-'}
								</Typography>
							</Box>
						</Stack>
					))}
				</Stack>
			)}
		</Panel>
	);
}

function LeaveBalancePanel({ balances }) {
	return (
		<Panel title="Saldo Cuti" subtitle="Tahun berjalan">
			{balances.length === 0 ? (
				<EmptySection message="Belum ada saldo cuti." />
			) : (
				<Grid container spacing={1.5} sx={{ p: 2.5 }}>
					{balances.slice(0, 4).map((balance) => (
						<Grid item xs={12} sm={6} key={balance.id}>
							<Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
								<Stack direction="row" justifyContent="space-between" alignItems="baseline">
									<Typography variant="caption" color="text.secondary" fontWeight={600} noWrap>
										{balance.leaveType} · {balance.year}
									</Typography>
									<Typography variant="h6" fontWeight={800} color="secondary.main">
										{balance.remainingLeave}
									</Typography>
								</Stack>
								<LinearProgress
									variant="determinate"
									value={Math.min(
										100,
										Math.round((balance.remainingLeave / (balance.leaveDays || 1)) * 100),
									)}
									color="secondary"
									sx={{ mt: 0.75, height: 5, borderRadius: 999 }}
								/>
								<Typography variant="caption" color="text.secondary">
									dari {balance.leaveDays} hari
								</Typography>
							</Box>
						</Grid>
					))}
				</Grid>
			)}
		</Panel>
	);
}

function JobRequirementBreakdown({ jobRequirement }) {
	const categories = jobRequirement?.categories || [];

	if (categories.length === 0) {
		return <EmptySection message="Profil job requirement belum tersedia." />;
	}

	return (
		<Stack sx={{ p: 2 }}>
			{categories.map((category) => (
				<Accordion
					key={category.key}
					disableGutters
					elevation={0}
					sx={{
						border: '1px solid',
						borderColor: 'divider',
						borderRadius: 2,
						mb: 1,
						'&:before': { display: 'none' },
					}}
				>
					<AccordionSummary expandIcon={<ExpandMoreRoundedIcon fontSize="small" />}>
						<Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%', pr: 1 }}>
							<Typography variant="body2" fontWeight={700} sx={{ flexGrow: 1 }}>
								{category.label}
							</Typography>
							{category.mandatory ? (
								<Chip size="small" label="Wajib" variant="outlined" sx={{ height: 20 }} />
							) : null}
							<Chip
								size="small"
								label={`${category.met}/${category.total}`}
								color={getCategoryChipColor(category)}
								variant="outlined"
								sx={{ height: 20 }}
							/>
						</Stack>
					</AccordionSummary>
					<AccordionDetails sx={{ pt: 0 }}>
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell sx={{ fontSize: 12 }}>Item</TableCell>
									<TableCell sx={{ fontSize: 12 }}>Dibutuhkan</TableCell>
									<TableCell sx={{ fontSize: 12 }}>Saat ini</TableCell>
									<TableCell sx={{ fontSize: 12 }} align="right">
										Hasil
									</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{category.items.map((item) => {
									const resultMeta = ITEM_RESULT_META[item.result] || ITEM_RESULT_META.MANUAL;

									return (
										<TableRow key={item.key}>
											<TableCell sx={{ fontSize: 12 }}>{item.label}</TableCell>
											<TableCell sx={{ fontSize: 12 }}>{item.required}</TableCell>
											<TableCell sx={{ fontSize: 12 }}>{item.actual}</TableCell>
											<TableCell sx={{ fontSize: 12 }} align="right">
												<Chip
													size="small"
													label={resultMeta.label}
													color={resultMeta.color}
													variant="outlined"
													sx={{ height: 20 }}
												/>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</AccordionDetails>
				</Accordion>
			))}
		</Stack>
	);
}

function EmployeeDetailPage() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { enqueueSnackbar } = useSnackbar();
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [tab, setTab] = useState('RINGKASAN');
	const [assessOpen, setAssessOpen] = useState(false);

	const loadData = async () => {
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

	useEffect(() => {
		loadData();
	}, [id, enqueueSnackbar]);

	const timelineItems = useMemo(() => {
		if (!data) {
			return [];
		}

		const items = [];

		(data.recentGuidanceRecords || []).forEach((record) => {
			items.push({
				id: `guidance-${record.id}`,
				type: 'Bimbingan',
				color: 'info',
				date: record.meetingDate,
				title: record.category === 'GUIDANCE' ? 'Bimbingan & Pengarahan' : 'Pengarahan',
				subtitle: `Pertemuan ke-${record.meetingNumber} · ${record.location || '-'}`,
			});
		});

		(data.recentWarningLetters || []).forEach((record) => {
			items.push({
				id: `warning-${record.id}`,
				type: 'Disiplin',
				color: getDisciplineTypeColor(record.category),
				date: record.letterDate,
				title: getDisciplineTypeLabel(record.category, record.warningLevel),
				subtitle: record.letterNumber || record.violation || '',
			});
		});

		(data.recentTrainingRecords || []).forEach((record) => {
			items.push({
				id: `training-${record.id}`,
				type: 'Pelatihan',
				color: 'warning',
				date: record.startDate,
				title: record.material || 'Pelatihan',
				subtitle: record.trainerInstitution || '',
			});
		});

		(data.recentLeaveFlows || []).forEach((record) => {
			items.push({
				id: `leave-${record.id}`,
				type: 'Cuti',
				color: 'primary',
				date: record.submittedAt,
				title: `${record.leaveType} · ${record.leaveDays} hari`,
				subtitle: `${formatDate(record.periodStart)} – ${formatDate(record.periodEnd)}`,
			});
		});

		return items
			.filter((item) => item.date)
			.sort((left, right) => String(right.date).localeCompare(String(left.date)))
			.slice(0, 7);
	}, [data]);

	const attentionItems = useMemo(() => {
		if (!data) {
			return [];
		}

		const items = [];
		const { jobRequirement } = data;
		const mandatoryUnmet = (jobRequirement?.unmetItems || []).filter((item) => item.mandatory).length;

		if (mandatoryUnmet > 0) {
			items.push({
				key: 'jr-mandatory',
				label: `${mandatoryUnmet} syarat dasar JR belum terpenuhi`,
				color: 'error',
				tab: 'KOMPETENSI',
			});
		} else if (jobRequirement?.status === 'BELUM_DINILAI') {
			items.push({
				key: 'jr-assessment',
				label: 'Asesmen skill belum lengkap',
				color: 'warning',
				tab: 'KOMPETENSI',
			});
		}

		if ((data.summary.activeWarningLetterCount || 0) > 0) {
			items.push({
				key: 'sp-active',
				label: `${data.summary.activeWarningLetterCount} surat peringatan aktif`,
				color: 'error',
				tab: 'PEMBINAAN',
			});
		}

		if ((data.summary.licenseExpiredCount || 0) > 0) {
			items.push({
				key: 'license-expired',
				label: `${data.summary.licenseExpiredCount} lisensi expired`,
				color: 'error',
				tab: 'KOMPETENSI',
			});
		}

		if ((data.summary.licenseSoonCount || 0) > 0) {
			items.push({
				key: 'license-soon',
				label: `${data.summary.licenseSoonCount} lisensi akan expired`,
				color: 'warning',
				tab: 'KOMPETENSI',
			});
		}

		return items;
	}, [data]);

	if (loading) {
		return (
			<>
				<PageHeader title="Detail Karyawan" />
				<Stack spacing={2.5}>
					<Skeleton variant="rounded" height={150} />
					<Skeleton variant="rounded" height={56} />
					<Grid container spacing={2.5}>
						<Grid item xs={12} lg={5}>
							<Skeleton variant="rounded" height={320} />
						</Grid>
						<Grid item xs={12} lg={7}>
							<Skeleton variant="rounded" height={320} />
						</Grid>
					</Grid>
				</Stack>
			</>
		);
	}

	if (!data) {
		return null;
	}

	const { profile, summary, jobRequirement } = data;
	const tabBadge = {
		KOMPETENSI: (jobRequirement?.unmetItems || []).length,
		PEMBINAAN: summary.guidanceCount + summary.warningLetterCount,
		KEHADIRAN: summary.leaveFlowCount,
	};

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

			<Stack spacing={2.5}>
				<IdentityBand
					profile={profile}
					jobRequirement={jobRequirement}
					onBack={() => navigate('/data-karyawan/detail-karyawan')}
				/>

				<AttentionStrip items={attentionItems} onJump={setTab} />

				<Box>
					<Tabs
						value={tab}
						onChange={(_event, value) => setTab(value)}
						variant="scrollable"
						allowScrollButtonsMobile
						sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
					>
						<Tab value="RINGKASAN" label="Ringkasan" />
						<Tab
							value="KOMPETENSI"
							label={
								<Stack direction="row" spacing={0.75} alignItems="center">
									<span>Kompetensi</span>
									<Chip size="small" label={tabBadge.KOMPETENSI} sx={{ height: 18 }} />
								</Stack>
							}
						/>
						<Tab
							value="PEMBINAAN"
							label={
								<Stack direction="row" spacing={0.75} alignItems="center">
									<span>Pembinaan</span>
									<Chip size="small" label={tabBadge.PEMBINAAN} sx={{ height: 18 }} />
								</Stack>
							}
						/>
						<Tab
							value="KEHADIRAN"
							label={
								<Stack direction="row" spacing={0.75} alignItems="center">
									<span>Kehadiran</span>
									<Chip size="small" label={tabBadge.KEHADIRAN} sx={{ height: 18 }} />
								</Stack>
							}
						/>
					</Tabs>

					{tab === 'RINGKASAN' ? (
						<Grid container spacing={2.5}>
							<Grid item xs={12} lg={5}>
								<ReadinessLedger jobRequirement={jobRequirement} onAssess={() => setAssessOpen(true)} />
							</Grid>
							<Grid item xs={12} lg={7}>
								<Stack spacing={2.5}>
									<ActivityTimeline items={timelineItems} />
									<LeaveBalancePanel balances={data.leaveBalances || []} />
								</Stack>
							</Grid>
						</Grid>
					) : null}

					{tab === 'KOMPETENSI' ? (
						<Stack spacing={2.5}>
							<Panel
								title="Job Requirement"
								subtitle="Rincian syarat dan hasil evaluasi"
								action={
									<Button
										size="small"
										variant="contained"
										startIcon={<SchoolOutlinedIcon />}
										onClick={() => setAssessOpen(true)}
										disabled={!jobRequirement?.profile}
									>
										Input Asesmen
									</Button>
								}
							>
								<JobRequirementBreakdown jobRequirement={jobRequirement} />
							</Panel>

							<Panel title="Lisensi & Sertifikasi" subtitle="Dokumen legalitas karyawan">
								{(data.licenseCertifications || []).length === 0 ? (
									<EmptySection message="Belum ada lisensi." />
								) : (
									<TableContainer>
										<Table size="small">
											<TableHead>
												<TableRow>
													<TableCell>Dokumen</TableCell>
													<TableCell>No. Dokumen</TableCell>
													<TableCell>Masa Berlaku</TableCell>
													<TableCell align="right">Status</TableCell>
												</TableRow>
											</TableHead>
											<TableBody>
												{data.licenseCertifications.map((license) => (
													<TableRow key={license.id} hover>
														<TableCell>
															<Typography variant="body2" fontWeight={600}>
																{license.documentName || '-'}
															</Typography>
															<Typography variant="caption" color="text.secondary">
																{license.documentType || ''}
															</Typography>
														</TableCell>
														<TableCell sx={{ fontSize: 12 }}>
															{license.documentNumber || '-'}
														</TableCell>
														<TableCell sx={{ fontSize: 12 }}>
															{formatDate(license.expiryDate)}
														</TableCell>
														<TableCell align="right">
															<LicenseStatusChip status={license.status} />
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</TableContainer>
								)}
							</Panel>

							<Panel title="Pelatihan Karyawan" subtitle="Riwayat pelatihan terakhir">
								{(data.recentTrainingRecords || []).length === 0 ? (
									<EmptySection message="Belum ada pelatihan." />
								) : (
									<TableContainer>
										<Table size="small">
											<TableHead>
												<TableRow>
													<TableCell>Materi</TableCell>
													<TableCell>Master Training</TableCell>
													<TableCell>Trainer</TableCell>
													<TableCell>Periode</TableCell>
													<TableCell align="right">Hari</TableCell>
												</TableRow>
											</TableHead>
											<TableBody>
												{data.recentTrainingRecords.map((record) => (
													<TableRow key={record.id} hover>
														<TableCell>
															<Typography variant="body2" fontWeight={600}>
																{record.material || '-'}
															</Typography>
															<Typography variant="caption" color="text.secondary">
																{record.participantCount} peserta
															</Typography>
														</TableCell>
														<TableCell sx={{ fontSize: 12 }}>
															{record.masterTrainingName || '-'}
														</TableCell>
														<TableCell sx={{ fontSize: 12 }}>
															{record.trainerInstitution || '-'}
														</TableCell>
														<TableCell sx={{ fontSize: 12 }}>
															{formatEmployeeTrainingPeriod(
																record.startDate,
																record.endDate,
															)}
														</TableCell>
														<TableCell align="right">{record.dayCount}</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</TableContainer>
								)}
							</Panel>
						</Stack>
					) : null}

					{tab === 'PEMBINAAN' ? (
						<Stack spacing={2.5}>
							<Panel
								title="Bimbingan & Pengarahan"
								subtitle="Catatan pembinaan atasan"
								action={
									<Button
										size="small"
										endIcon={<OpenInNewOutlinedIcon />}
										onClick={() =>
											navigate(
												`/data-karyawan/bimbingan-pengarahan?search=${encodeURIComponent(
													profile.fullName,
												)}`,
											)
										}
									>
										Lihat semua
									</Button>
								}
							>
								{(data.recentGuidanceRecords || []).length === 0 ? (
									<EmptySection message="Belum ada bimbingan." />
								) : (
									<TableContainer>
										<Table size="small">
											<TableHead>
												<TableRow>
													<TableCell>Kategori</TableCell>
													<TableCell>Pertemuan</TableCell>
													<TableCell>Tanggal</TableCell>
													<TableCell>Tempat</TableCell>
												</TableRow>
											</TableHead>
											<TableBody>
												{data.recentGuidanceRecords.map((record) => (
													<TableRow key={record.id} hover>
														<TableCell>
															<Chip
																size="small"
																label={
																	record.category === 'GUIDANCE'
																		? 'Bimbingan'
																		: 'Pengarahan'
																}
																color={
																	record.category === 'GUIDANCE'
																		? 'info'
																		: 'secondary'
																}
																variant="outlined"
															/>
														</TableCell>
														<TableCell>{record.meetingNumber}</TableCell>
														<TableCell sx={{ fontSize: 12 }}>
															{formatDate(record.meetingDate)}
														</TableCell>
														<TableCell sx={{ fontSize: 12 }}>
															{record.location || '-'}
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</TableContainer>
								)}
							</Panel>

							<Panel
								title="Surat Peringatan"
								subtitle={`${summary.activeWarningLetterCount} aktif dari ${summary.warningLetterCount} total`}
								action={
									<Button
										size="small"
										endIcon={<OpenInNewOutlinedIcon />}
										onClick={() =>
											navigate(
												`/data-karyawan/data-surat-peringatan?search=${encodeURIComponent(
													profile.fullName,
												)}`,
											)
										}
									>
										Lihat semua
									</Button>
								}
							>
								{(data.recentWarningLetters || []).length === 0 ? (
									<EmptySection message="Belum ada surat peringatan." />
								) : (
									<TableContainer>
										<Table size="small">
											<TableHead>
												<TableRow>
													<TableCell>Tipe</TableCell>
													<TableCell>No. Surat</TableCell>
													<TableCell>Tanggal</TableCell>
													<TableCell>Pelanggaran</TableCell>
												</TableRow>
											</TableHead>
											<TableBody>
												{data.recentWarningLetters.map((record) => (
													<TableRow key={record.id} hover>
														<TableCell>
															<Chip
																size="small"
																label={getDisciplineTypeLabel(
																	record.category,
																	record.warningLevel,
																)}
																color={getDisciplineTypeColor(record.category)}
																variant="outlined"
															/>
														</TableCell>
														<TableCell sx={{ fontSize: 12 }}>
															{record.letterNumber || '-'}
														</TableCell>
														<TableCell sx={{ fontSize: 12 }}>
															{formatDate(record.letterDate)}
														</TableCell>
														<TableCell
															sx={{
																fontSize: 12,
																maxWidth: 280,
																overflow: 'hidden',
																textOverflow: 'ellipsis',
																whiteSpace: 'nowrap',
															}}
														>
															{record.violation || '-'}
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</TableContainer>
								)}
							</Panel>
						</Stack>
					) : null}

					{tab === 'KEHADIRAN' ? (
						<Stack spacing={2.5}>
							<LeaveBalancePanel balances={data.leaveBalances || []} />
							<Panel
								title="Riwayat Pengajuan Cuti"
								subtitle={`${summary.leaveFlowCount} pengajuan`}
								action={
									<Button
										size="small"
										endIcon={<OpenInNewOutlinedIcon />}
										onClick={() =>
											navigate(
												`/data-karyawan/cuti-karyawan/flow?search=${encodeURIComponent(
													profile.fullName,
												)}`,
											)
										}
									>
										Lihat semua
									</Button>
								}
							>
								{(data.recentLeaveFlows || []).length === 0 ? (
									<EmptySection message="Belum ada pengajuan cuti." />
								) : (
									<TableContainer>
										<Table size="small">
											<TableHead>
												<TableRow>
													<TableCell>No. Request</TableCell>
													<TableCell>Jenis</TableCell>
													<TableCell>Periode</TableCell>
													<TableCell>Hari</TableCell>
													<TableCell>Tgl Ajuan</TableCell>
													<TableCell align="right">Status</TableCell>
												</TableRow>
											</TableHead>
											<TableBody>
												{data.recentLeaveFlows.map((record) => (
													<TableRow key={record.id} hover>
														<TableCell sx={{ fontSize: 12, fontWeight: 600 }}>
															{record.requestNumber || '-'}
														</TableCell>
														<TableCell>{record.leaveType}</TableCell>
														<TableCell sx={{ fontSize: 12 }}>
															{formatDate(record.periodStart)} –{' '}
															{formatDate(record.periodEnd)}
														</TableCell>
														<TableCell>{record.leaveDays}</TableCell>
														<TableCell sx={{ fontSize: 12 }}>
															{formatDate(record.submittedAt)}
														</TableCell>
														<TableCell align="right">
															<LeaveStatusChip status={record.status} />
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</TableContainer>
								)}
							</Panel>
						</Stack>
					) : null}
				</Box>
			</Stack>

			<SkillAssessmentDialog
				open={assessOpen}
				onClose={() => setAssessOpen(false)}
				employeeId={id}
				profile={jobRequirement?.profile}
				assessments={jobRequirement?.assessments || []}
				onSaved={loadData}
			/>
		</>
	);
}

export default EmployeeDetailPage;
