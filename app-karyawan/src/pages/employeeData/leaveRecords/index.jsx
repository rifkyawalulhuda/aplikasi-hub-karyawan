import { useEffect, useMemo, useState } from 'react';
import { useSnackbar } from 'notistack';

import Breadcrumbs from '@mui/material/Breadcrumbs';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Link from '@mui/material/Link';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

import CardHeader from '@/components/cardHeader';
import LeaveStatusChip from '@/components/employeePortal/leaveStatusChip';
import LeaveRequestDetailDialog from '@/components/leaveAdmin/leaveRequestDetailDialog';
import DeleteConfirmDialog from '@/components/masterData/deleteConfirmDialog';
import PageHeader from '@/components/pageHeader';
import apiRequest from '@/services/api';

import formatLeaveDate from './utils';

const STATUS_OPTIONS = ['ALL', 'IN_APPROVAL', 'APPROVED', 'REJECTED', 'CANCELLED'];

const EMPTY_SEED_FORM = {
	id: null,
	employeeId: '',
	year: new Date().getFullYear(),
	openingBalance: 12,
	currentBalance: 12,
};

function sortSeeds(rows = []) {
	return rows
		.slice()
		.sort((left, right) => right.year - left.year || left.employeeName.localeCompare(right.employeeName));
}

function SummaryCard({ label, value, helper }) {
	return (
		<Paper variant="outlined" sx={{ p: 2.25, borderRadius: 3 }}>
			<Stack spacing={0.5}>
				<Typography variant="caption" sx={{ color: '#5D738B', letterSpacing: '0.08em' }}>
					{label}
				</Typography>
				<Typography variant="h5" sx={{ color: '#123B66', fontWeight: 700 }}>
					{value}
				</Typography>
				<Typography variant="body2" color="text.secondary">
					{helper}
				</Typography>
			</Stack>
		</Paper>
	);
}

function BalanceSeedDialog({
	open,
	rows,
	employeeOptions,
	loading,
	formValue,
	onClose,
	onChange,
	onSubmit,
	onEdit,
	onDelete,
	onCreate,
}) {
	return (
		<Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
			<DialogTitle>Saldo Tahunan Cuti</DialogTitle>
			<DialogContent dividers>
				<Stack spacing={2.5}>
					<Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1.5}>
						<BoxSection
							title="Seed Saldo Tahunan"
							description="Saldo awal request cuti tahun berjalan dan saldo berjalan final setelah approval."
						/>
						<Button
							variant="contained"
							startIcon={<AddOutlinedIcon />}
							onClick={onCreate}
							sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' } }}
						>
							Tambah Seed
						</Button>
					</Stack>

					<Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
						<Stack spacing={1.5}>
							<Typography variant="subtitle1" sx={{ color: '#123B66', fontWeight: 700 }}>
								Form Seed Saldo
							</Typography>
							<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
								<TextField
									fullWidth
									select
									size="small"
									label="Karyawan"
									value={formValue.employeeId}
									onChange={(event) => onChange('employeeId', event.target.value)}
								>
									{employeeOptions.map((item) => (
										<MenuItem key={item.id} value={item.id}>
											{item.fullName} ({item.employeeNo})
										</MenuItem>
									))}
								</TextField>
								<TextField
									fullWidth
									size="small"
									type="number"
									label="Tahun"
									value={formValue.year}
									onChange={(event) => onChange('year', event.target.value)}
								/>
								<TextField
									fullWidth
									size="small"
									type="number"
									label="Saldo Awal"
									value={formValue.openingBalance}
									onChange={(event) => onChange('openingBalance', event.target.value)}
								/>
								<TextField
									fullWidth
									size="small"
									type="number"
									label="Saldo Berjalan"
									value={formValue.currentBalance}
									onChange={(event) => onChange('currentBalance', event.target.value)}
								/>
							</Stack>
							<Stack direction="row" justifyContent="flex-end" spacing={1}>
								<Button onClick={onCreate}>Reset</Button>
								<Button variant="contained" disabled={loading} onClick={onSubmit}>
									{formValue.id ? 'Simpan Perubahan' : 'Tambah Seed'}
								</Button>
							</Stack>
						</Stack>
					</Paper>

					<TableContainer component={Paper} variant="outlined">
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell>Karyawan</TableCell>
									<TableCell>NIK</TableCell>
									<TableCell>Tahun</TableCell>
									<TableCell>Saldo Awal</TableCell>
									<TableCell>Saldo Berjalan</TableCell>
									<TableCell align="right">Aksi</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{rows.length ? (
									rows.map((item) => (
										<TableRow key={item.id} hover>
											<TableCell>{item.employeeName}</TableCell>
											<TableCell>{item.employeeNo}</TableCell>
											<TableCell>{item.year}</TableCell>
											<TableCell>{item.openingBalance}</TableCell>
											<TableCell>{item.currentBalance}</TableCell>
											<TableCell align="right">
												<IconButton color="primary" size="small" onClick={() => onEdit(item)}>
													<EditOutlinedIcon fontSize="small" />
												</IconButton>
												<IconButton color="error" size="small" onClick={() => onDelete(item)}>
													<DeleteOutlineOutlinedIcon fontSize="small" />
												</IconButton>
											</TableCell>
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell colSpan={6} align="center">
											Belum ada seed saldo cuti tahunan.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</TableContainer>
				</Stack>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>Tutup</Button>
			</DialogActions>
		</Dialog>
	);
}

function BoxSection({ title, description }) {
	return (
		<Stack spacing={0.5}>
			<Typography variant="h6" sx={{ color: '#123B66', fontWeight: 700 }}>
				{title}
			</Typography>
			<Typography variant="body2" color="text.secondary">
				{description}
			</Typography>
		</Stack>
	);
}

function EmployeeLeavesPage() {
	const { enqueueSnackbar } = useSnackbar();
	const [rows, setRows] = useState([]);
	const [balanceSeeds, setBalanceSeeds] = useState([]);
	const [employeeOptions, setEmployeeOptions] = useState([]);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [detailOpen, setDetailOpen] = useState(false);
	const [detailLoading, setDetailLoading] = useState(false);
	const [selectedDetail, setSelectedDetail] = useState(null);
	const [seedDialogOpen, setSeedDialogOpen] = useState(false);
	const [selectedSeed, setSelectedSeed] = useState(null);
	const [seedForm, setSeedForm] = useState(EMPTY_SEED_FORM);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [searchKeyword, setSearchKeyword] = useState('');
	const [statusFilter, setStatusFilter] = useState('ALL');
	const [yearFilter, setYearFilter] = useState('ALL');

	const loadData = async () => {
		setLoading(true);

		try {
			const [leaveRows, seedRows, employees] = await Promise.all([
				apiRequest('/data-karyawan/employee-leaves'),
				apiRequest('/data-karyawan/employee-leave-balance-seeds'),
				apiRequest('/master/employees'),
			]);

			setRows(leaveRows);
			setBalanceSeeds(sortSeeds(seedRows));
			setEmployeeOptions(employees);
		} catch (error) {
			enqueueSnackbar(error.message, { variant: 'error' });
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadData();
	}, [enqueueSnackbar]);

	const filteredRows = useMemo(() => {
		const normalizedKeyword = searchKeyword.trim().toLowerCase();

		return rows.filter((row) => {
			if (statusFilter !== 'ALL' && row.status !== statusFilter) {
				return false;
			}

			if (yearFilter !== 'ALL' && String(row.leaveYear) !== String(yearFilter)) {
				return false;
			}

			if (!normalizedKeyword) {
				return true;
			}

			const searchableValues = [
				row.requestNumber,
				row.employeeName,
				row.employeeNo,
				row.leaveType,
				row.activeStageLabel,
				row.activeApproverNames,
				row.notes,
				row.rejectionNote,
			];

			return searchableValues.some((value) =>
				String(value || '')
					.toLowerCase()
					.includes(normalizedKeyword),
			);
		});
	}, [rows, searchKeyword, statusFilter, yearFilter]);

	const yearOptions = useMemo(() => {
		const years = Array.from(new Set(rows.map((item) => item.leaveYear).filter(Boolean))).sort((a, b) => b - a);
		return ['ALL', ...years];
	}, [rows]);

	const summary = useMemo(
		() => ({
			total: rows.length,
			inApproval: rows.filter((item) => item.status === 'IN_APPROVAL').length,
			approved: rows.filter((item) => item.status === 'APPROVED').length,
			rejected: rows.filter((item) => item.status === 'REJECTED').length,
		}),
		[rows],
	);

	const handleOpenDetail = async (id) => {
		setDetailOpen(true);
		setDetailLoading(true);

		try {
			const response = await apiRequest(`/data-karyawan/employee-leaves/${id}`);
			setSelectedDetail(response);
		} catch (error) {
			enqueueSnackbar(error.message, { variant: 'error' });
			setDetailOpen(false);
		} finally {
			setDetailLoading(false);
		}
	};

	const handleSeedFormChange = (field, value) => {
		setSeedForm((current) => ({
			...current,
			[field]: value,
		}));
	};

	const handleOpenCreateSeed = () => {
		setSelectedSeed(null);
		setSeedForm(EMPTY_SEED_FORM);
	};

	const handleOpenEditSeed = (item) => {
		setSelectedSeed(item);
		setSeedForm({
			id: item.id,
			employeeId: item.employeeId,
			year: item.year,
			openingBalance: item.openingBalance,
			currentBalance: item.currentBalance,
		});
	};

	const handleSubmitSeed = async () => {
		const payload = {
			employeeId: Number(seedForm.employeeId),
			year: Number(seedForm.year),
			openingBalance: Number(seedForm.openingBalance),
			currentBalance: Number(seedForm.currentBalance),
		};

		if (
			!payload.employeeId ||
			!payload.year ||
			Number.isNaN(payload.openingBalance) ||
			Number.isNaN(payload.currentBalance)
		) {
			enqueueSnackbar('Lengkapi form seed saldo terlebih dahulu.', { variant: 'error' });
			return;
		}

		setSubmitting(true);

		try {
			const response = await apiRequest(
				seedForm.id
					? `/data-karyawan/employee-leave-balance-seeds/${seedForm.id}`
					: '/data-karyawan/employee-leave-balance-seeds',
				{
					method: seedForm.id ? 'PUT' : 'POST',
					body: JSON.stringify(payload),
				},
			);

			setBalanceSeeds((current) =>
				sortSeeds(
					seedForm.id
						? current.map((item) => (item.id === response.id ? response : item))
						: [response, ...current],
				),
			);
			handleOpenCreateSeed();
			enqueueSnackbar(`Seed saldo cuti berhasil ${seedForm.id ? 'diperbarui' : 'ditambahkan'}.`, {
				variant: 'success',
			});
		} catch (error) {
			enqueueSnackbar(error.message, { variant: 'error' });
		} finally {
			setSubmitting(false);
		}
	};

	const handleDeleteSeed = async () => {
		if (!selectedSeed) {
			return;
		}

		setSubmitting(true);

		try {
			await apiRequest(`/data-karyawan/employee-leave-balance-seeds/${selectedSeed.id}`, {
				method: 'DELETE',
			});
			setBalanceSeeds((current) => current.filter((item) => item.id !== selectedSeed.id));
			setDeleteOpen(false);
			setSelectedSeed(null);
			enqueueSnackbar('Seed saldo cuti berhasil dihapus.', { variant: 'success' });
		} catch (error) {
			enqueueSnackbar(error.message, { variant: 'error' });
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<>
			<PageHeader title="Data Cuti Karyawan">
				<Breadcrumbs aria-label="breadcrumb" sx={{ textTransform: 'uppercase' }}>
					<Link underline="hover" href="#!">
						Data Karyawan
					</Link>
					<Typography color="text.tertiary">Data Cuti Karyawan</Typography>
				</Breadcrumbs>
			</PageHeader>

			<Stack spacing={2.5}>
				<Stack
					sx={{
						display: 'grid',
						gridTemplateColumns: {
							xs: 'repeat(1, minmax(0, 1fr))',
							md: 'repeat(4, minmax(0, 1fr))',
						},
						gap: 2,
					}}
				>
					<SummaryCard label="Total Request" value={summary.total} helper="Semua pengajuan cuti" />
					<SummaryCard label="Dalam Approval" value={summary.inApproval} helper="Masih menunggu keputusan" />
					<SummaryCard label="Approved" value={summary.approved} helper="Sudah selesai di-approve" />
					<SummaryCard label="Rejected" value={summary.rejected} helper="Perlu resubmit atau cancel" />
				</Stack>

				<Card sx={{ minHeight: '60vh', p: 3 }}>
					<CardHeader
						title="Data Cuti Karyawan"
						subtitle="Monitor seluruh pengajuan cuti, status, saldo, dan riwayat revisi."
						size="small"
						sx={{
							flexDirection: 'column',
							alignItems: 'stretch',
							gap: 2,
							mb: 2.5,
						}}
					>
						<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
							<TextField
								fullWidth
								size="small"
								label="Cari Request"
								value={searchKeyword}
								onChange={(event) => setSearchKeyword(event.target.value)}
								placeholder="Nomor request, nama, NIK, jenis cuti..."
								InputProps={{
									startAdornment: (
										<InputAdornment position="start">
											<SearchOutlinedIcon fontSize="small" />
										</InputAdornment>
									),
								}}
							/>
							<TextField
								select
								size="small"
								label="Status"
								value={statusFilter}
								onChange={(event) => setStatusFilter(event.target.value)}
								sx={{ minWidth: 180 }}
							>
								{STATUS_OPTIONS.map((item) => (
									<MenuItem key={item} value={item}>
										{item === 'ALL' ? 'Semua Status' : item}
									</MenuItem>
								))}
							</TextField>
							<TextField
								select
								size="small"
								label="Tahun"
								value={yearFilter}
								onChange={(event) => setYearFilter(event.target.value)}
								sx={{ minWidth: 150 }}
							>
								{yearOptions.map((item) => (
									<MenuItem key={item} value={item}>
										{item === 'ALL' ? 'Semua Tahun' : item}
									</MenuItem>
								))}
							</TextField>
							<Button
								variant="outlined"
								startIcon={<RefreshOutlinedIcon />}
								onClick={loadData}
								sx={{ whiteSpace: 'nowrap' }}
							>
								Refresh
							</Button>
							<Button
								variant="contained"
								startIcon={<AddOutlinedIcon />}
								onClick={() => setSeedDialogOpen(true)}
								sx={{ whiteSpace: 'nowrap' }}
							>
								Kelola Saldo Tahunan
							</Button>
						</Stack>
					</CardHeader>

					{loading ? (
						<Stack alignItems="center" justifyContent="center" py={10}>
							<CircularProgress />
						</Stack>
					) : (
						<TableContainer component={Paper} variant="outlined">
							<Table size="small">
								<TableHead>
									<TableRow>
										<TableCell>Request</TableCell>
										<TableCell>Karyawan</TableCell>
										<TableCell>Jenis Cuti</TableCell>
										<TableCell>Periode</TableCell>
										<TableCell>Saldo</TableCell>
										<TableCell>Stage Aktif</TableCell>
										<TableCell>Status</TableCell>
										<TableCell align="right">Aksi</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{filteredRows.length ? (
										filteredRows.map((row) => (
											<TableRow key={row.id} hover>
												<TableCell>
													<Stack spacing={0.25}>
														<Typography variant="body2" sx={{ fontWeight: 700 }}>
															{row.requestNumber}
														</Typography>
														<Typography variant="caption" color="text.secondary">
															Revisi {row.revisionNo} | Tahun {row.leaveYear}
														</Typography>
													</Stack>
												</TableCell>
												<TableCell>
													<Stack spacing={0.25}>
														<Typography variant="body2">{row.employeeName}</Typography>
														<Typography variant="caption" color="text.secondary">
															{row.employeeNo}
														</Typography>
													</Stack>
												</TableCell>
												<TableCell>
													<Stack spacing={0.25}>
														<Typography variant="body2">{row.leaveType}</Typography>
														<Typography variant="caption" color="text.secondary">
															{row.leaveDays} hari
														</Typography>
													</Stack>
												</TableCell>
												<TableCell>
													{formatLeaveDate(row.periodStart)} -{' '}
													{formatLeaveDate(row.periodEnd)}
												</TableCell>
												<TableCell>
													{row.balanceBefore} {'->'} {row.remainingLeave}
												</TableCell>
												<TableCell>
													<Stack spacing={0.25}>
														<Typography variant="body2">
															{row.activeStageLabel || '-'}
														</Typography>
														<Typography variant="caption" color="text.secondary">
															{row.activeApproverNames || '-'}
														</Typography>
													</Stack>
												</TableCell>
												<TableCell>
													<LeaveStatusChip status={row.status} label={row.statusLabel} />
												</TableCell>
												<TableCell align="right">
													<IconButton
														color="primary"
														onClick={() => handleOpenDetail(row.id)}
													>
														<VisibilityOutlinedIcon fontSize="small" />
													</IconButton>
												</TableCell>
											</TableRow>
										))
									) : (
										<TableRow>
											<TableCell colSpan={8} align="center">
												Belum ada data cuti karyawan yang cocok dengan filter.
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>
						</TableContainer>
					)}
				</Card>
			</Stack>

			<LeaveRequestDetailDialog
				open={detailOpen}
				loading={detailLoading}
				data={selectedDetail}
				onClose={() => {
					setDetailOpen(false);
					setSelectedDetail(null);
				}}
			/>

			<BalanceSeedDialog
				open={seedDialogOpen}
				rows={balanceSeeds}
				employeeOptions={employeeOptions}
				loading={submitting}
				formValue={seedForm}
				onClose={() => {
					setSeedDialogOpen(false);
					handleOpenCreateSeed();
				}}
				onChange={handleSeedFormChange}
				onSubmit={handleSubmitSeed}
				onEdit={handleOpenEditSeed}
				onDelete={(item) => {
					setSelectedSeed(item);
					setDeleteOpen(true);
				}}
				onCreate={handleOpenCreateSeed}
			/>

			<DeleteConfirmDialog
				open={deleteOpen}
				loading={submitting}
				title="Seed Saldo Tahunan"
				itemName={selectedSeed?.employeeName}
				onClose={() => {
					setDeleteOpen(false);
					setSelectedSeed(null);
				}}
				onConfirm={handleDeleteSeed}
			/>
		</>
	);
}

export default EmployeeLeavesPage;
