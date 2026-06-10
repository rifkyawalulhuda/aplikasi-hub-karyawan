import { useEffect, useMemo, useState } from 'react';
import { useSnackbar } from 'notistack';

import Breadcrumbs from '@mui/material/Breadcrumbs';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import Link from '@mui/material/Link';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

import CardHeader from '@/components/cardHeader';
import EnhancedTable from '@/components/dataTable';
import LeaveStatusChip from '@/components/employeePortal/leaveStatusChip';
import LeaveRequestDetailDialog from '@/components/leaveAdmin/leaveRequestDetailDialog';
import useUrlSearchKeyword from '@/hooks/useUrlSearchKeyword';
import PageHeader from '@/components/pageHeader';
import apiRequest from '@/services/api';

import formatLeaveDate from '../leaveRecords/utils';

const STATUS_OPTIONS = ['ALL', 'IN_APPROVAL', 'APPROVED', 'REJECTED', 'CANCELLED'];

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

function EmployeeLeaveFlowPage({ hideHeader = false }) {
	const { enqueueSnackbar } = useSnackbar();
	const [rows, setRows] = useState([]);
	const [loading, setLoading] = useState(true);
	const [detailOpen, setDetailOpen] = useState(false);
	const [detailLoading, setDetailLoading] = useState(false);
	const [selectedDetail, setSelectedDetail] = useState(null);
	const [searchKeyword, setSearchKeyword] = useUrlSearchKeyword();
	const [statusFilter, setStatusFilter] = useState('ALL');
	const [stageFilter, setStageFilter] = useState('ALL');

	const loadData = async () => {
		setLoading(true);

		try {
			const response = await apiRequest('/data-karyawan/employee-leaves/flow');
			setRows(response);
		} catch (error) {
			enqueueSnackbar(error.message, { variant: 'error' });
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadData();
	}, [enqueueSnackbar]);

	const stageOptions = useMemo(() => {
		const stages = Array.from(new Set(rows.map((item) => item.activeStageLabel).filter(Boolean))).sort();
		return ['ALL', ...stages];
	}, [rows]);

	const filteredRows = useMemo(() => {
		const normalizedKeyword = searchKeyword.trim().toLowerCase();

		return rows.filter((row) => {
			if (statusFilter !== 'ALL' && row.status !== statusFilter) {
				return false;
			}

			if (stageFilter !== 'ALL' && row.activeStageLabel !== stageFilter) {
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
				row.rejectionNote,
			];

			return searchableValues.some((value) =>
				String(value || '')
					.toLowerCase()
					.includes(normalizedKeyword),
			);
		});
	}, [rows, searchKeyword, statusFilter, stageFilter]);

	const summary = useMemo(
		() => ({
			activeRoutes: rows.filter((item) => item.status === 'IN_APPROVAL').length,
			finalApproved: rows.filter((item) => item.status === 'APPROVED').length,
			needAction: rows.filter((item) => item.activeStageLabel).length,
			rejected: rows.filter((item) => item.status === 'REJECTED').length,
		}),
		[rows],
	);
	const columns = useMemo(
		() => [
			{
				field: 'requestNumber',
				headerName: 'REQUEST',
				minWidth: 220,
				flex: 1,
				renderCell: (params) => (
					<Stack spacing={0.25}>
						<Typography variant="body2" sx={{ fontWeight: 700 }}>
							{params.row.requestNumber}
						</Typography>
						<Typography variant="caption" color="text.secondary">
							{params.row.leaveType}
							{' | '}
							Revisi {params.row.revisionNo}
						</Typography>
					</Stack>
				),
			},
			{
				field: 'employeeName',
				headerName: 'KARYAWAN',
				minWidth: 220,
				flex: 1,
				renderCell: (params) => (
					<Stack spacing={0.25}>
						<Typography variant="body2">{params.row.employeeName}</Typography>
						<Typography variant="caption" color="text.secondary">
							{params.row.employeeNo}
						</Typography>
					</Stack>
				),
			},
			{
				field: 'periodStart',
				headerName: 'PERIODE',
				minWidth: 190,
				sortable: false,
				renderCell: (params) =>
					`${formatLeaveDate(params.row.periodStart)} - ${formatLeaveDate(params.row.periodEnd)}`,
			},
			{
				field: 'activeStageLabel',
				headerName: 'STAGE AKTIF',
				minWidth: 180,
				renderCell: (params) => params.value || '-',
			},
			{
				field: 'activeApproverNames',
				headerName: 'APPROVER AKTIF',
				minWidth: 220,
				flex: 1,
				renderCell: (params) => params.value || '-',
			},
			{
				field: 'statusLabel',
				headerName: 'STATUS',
				minWidth: 150,
				renderCell: (params) => <LeaveStatusChip status={params.row.status} label={params.row.statusLabel} />,
			},
		],
		[],
	);

	const handleOpenDetail = async (id) => {
		setDetailOpen(true);
		setDetailLoading(true);

		try {
			const response = await apiRequest(`/data-karyawan/employee-leaves/flow/${id}`);
			setSelectedDetail(response);
		} catch (error) {
			enqueueSnackbar(error.message, { variant: 'error' });
			setDetailOpen(false);
		} finally {
			setDetailLoading(false);
		}
	};

	const handleOpenPrint = (id) => {
		window.open(`/print/data-karyawan/cuti-karyawan/${id}`, '_blank', 'noopener,noreferrer');
	};

	return (
		<>
			{!hideHeader && (
				<PageHeader title="Flow Proses Cuti">
					<Breadcrumbs aria-label="breadcrumb" sx={{ textTransform: 'uppercase' }}>
						<Link underline="hover" href="#!">
							Data Karyawan
						</Link>
						<Link underline="hover" href="#!">
							Cuti Karyawan
						</Link>
						<Typography color="text.tertiary">Flow Proses Cuti</Typography>
					</Breadcrumbs>
				</PageHeader>
			)}

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
					<SummaryCard label="Flow Aktif" value={summary.activeRoutes} helper="Masih berjalan" />
					<SummaryCard label="Perlu Dipantau" value={summary.needAction} helper="Masih ada stage aktif" />
					<SummaryCard label="Final Approved" value={summary.finalApproved} helper="Route selesai" />
					<SummaryCard label="Rejected" value={summary.rejected} helper="Kembali ke karyawan" />
				</Stack>

				<Card sx={{ minHeight: '60vh', p: 3 }}>
					<CardHeader
						title="Flow Proses Cuti"
						subtitle="Pantau posisi approval, approver aktif, dan antrian proses per request cuti."
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
								label="Cari Flow"
								value={searchKeyword}
								onChange={(event) => setSearchKeyword(event.target.value)}
								placeholder="Request, nama, NIK, approver aktif..."
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
								label="Stage Aktif"
								value={stageFilter}
								onChange={(event) => setStageFilter(event.target.value)}
								sx={{ minWidth: 220 }}
							>
								{stageOptions.map((item) => (
									<MenuItem key={item} value={item}>
										{item === 'ALL' ? 'Semua Stage' : item}
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
						</Stack>
					</CardHeader>

					{loading ? (
						<Stack alignItems="center" justifyContent="center" py={10}>
							<CircularProgress />
						</Stack>
					) : (
						<EnhancedTable
							rows={filteredRows}
							columns={columns}
							columnResizeKey="leave-flow-table"
							height={520}
							getContextMenuActions={(row) => [
								{
									key: 'detail',
									label: 'Detail',
									icon: <VisibilityOutlinedIcon fontSize="small" color="info" />,
									onClick: (item) => handleOpenDetail(item.id),
								},
								...(row.status === 'APPROVED'
									? [
											{
												key: 'print',
												label: 'Print A4',
												icon: <PrintOutlinedIcon fontSize="small" color="primary" />,
												onClick: (item) => handleOpenPrint(item.id),
											},
									  ]
									: []),
							]}
						/>
					)}
				</Card>
			</Stack>

			<LeaveRequestDetailDialog
				open={detailOpen}
				loading={detailLoading}
				data={selectedDetail}
				title="Flow Request Cuti"
				onClose={() => {
					setDetailOpen(false);
					setSelectedDetail(null);
				}}
			/>
		</>
	);
}

export default EmployeeLeaveFlowPage;
