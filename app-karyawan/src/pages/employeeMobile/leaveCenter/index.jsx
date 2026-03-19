import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';

import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined';

import FeedbackState from '@/components/employeePortal/feedbackState';
import LeaveRequestFormDialog from '@/components/employeePortal/leaveRequestFormDialog';
import LeaveStatusChip from '@/components/employeePortal/leaveStatusChip';
import { useEmployeeAuth } from '@/contexts/employeeAuthContext';
import { employeeMeRequest } from '@/services/employeeApi';
import { formatLongDate, getEmployeePortalErrorMessage, handleEmployeeUnauthorized } from '@/utils/employeePortal';

function InfoCard({ title, value, helper }) {
	return (
		<Paper sx={{ p: 2, borderRadius: 4 }}>
			<Stack spacing={0.5}>
				<Typography variant="caption" sx={{ color: '#5D738B', letterSpacing: '0.08em' }}>
					{title}
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

function LeaveRequestCard({ item, onOpen }) {
	return (
		<Paper sx={{ p: 2.25, borderRadius: 4 }}>
			<Stack spacing={1.25}>
				<Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
					<Box>
						<Typography variant="subtitle1" sx={{ color: '#123B66', fontWeight: 700 }}>
							{item.leaveType}
						</Typography>
						<Typography variant="body2" color="text.secondary">
							{item.requestNumber}
						</Typography>
					</Box>
					<LeaveStatusChip status={item.status} label={item.statusLabel} />
				</Stack>
				<Typography variant="body2" color="text.secondary">
					{formatLongDate(item.periodStart)} - {formatLongDate(item.periodEnd)} | {item.leaveDays} hari
				</Typography>
				<Typography variant="body2" color="text.secondary">
					Stage aktif: {item.activeStageLabel || '-'}
				</Typography>
				<Typography variant="body2" color="text.secondary">
					Approver aktif: {item.activeApproverNames || '-'}
				</Typography>
				<Button variant="text" endIcon={<ArrowForwardOutlinedIcon />} onClick={() => onOpen(item.id)}>
					Lihat Detail
				</Button>
			</Stack>
		</Paper>
	);
}

function LeaveApprovalCard({ item, onOpen }) {
	return (
		<Paper sx={{ p: 2.25, borderRadius: 4 }}>
			<Stack spacing={1.25}>
				<Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
					<Box>
						<Typography variant="subtitle1" sx={{ color: '#123B66', fontWeight: 700 }}>
							{item.request.employeeName}
						</Typography>
						<Typography variant="body2" color="text.secondary">
							{item.request.requestNumber}
						</Typography>
					</Box>
					<LeaveStatusChip status={item.status} label={item.statusLabel} />
				</Stack>
				<Typography variant="body2" color="text.secondary">
					{item.stageLabel} | {item.request.leaveType}
				</Typography>
				<Typography variant="body2" color="text.secondary">
					{formatLongDate(item.request.periodStart)} - {formatLongDate(item.request.periodEnd)} |{' '}
					{item.request.leaveDays} hari
				</Typography>
				<Button variant="text" endIcon={<ArrowForwardOutlinedIcon />} onClick={() => onOpen(item.id)}>
					Buka Approval
				</Button>
			</Stack>
		</Paper>
	);
}

function EmployeeLeaveCenterPage() {
	const navigate = useNavigate();
	const { enqueueSnackbar } = useSnackbar();
	const { logout } = useEmployeeAuth();
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState('');
	const [tab, setTab] = useState('requests');
	const [dialogOpen, setDialogOpen] = useState(false);
	const [formOptions, setFormOptions] = useState({
		submissionDate: '',
		year: new Date().getFullYear(),
		leaveTypeOptions: [],
		replacementOptions: [],
	});
	const [requestData, setRequestData] = useState({ year: new Date().getFullYear(), balance: null, rows: [] });
	const [approvalRows, setApprovalRows] = useState([]);

	const loadData = async () => {
		setLoading(true);
		setError('');

		try {
			const [requestsResponse, approvalsResponse, formOptionsResponse] = await Promise.all([
				employeeMeRequest('/leave-requests'),
				employeeMeRequest('/leave-approvals'),
				employeeMeRequest('/leave-form-options'),
			]);

			setRequestData(requestsResponse);
			setApprovalRows(approvalsResponse);
			setFormOptions(formOptionsResponse);
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

	const handleSubmit = async (values) => {
		setSubmitting(true);

		try {
			await employeeMeRequest('/leave-requests', {
				method: 'POST',
				body: JSON.stringify(values),
			});
			setDialogOpen(false);
			enqueueSnackbar('Pengajuan cuti berhasil dikirim.', { variant: 'success' });
			await loadData();
		} catch (requestError) {
			enqueueSnackbar(requestError.message, { variant: 'error' });
		} finally {
			setSubmitting(false);
		}
	};

	if (loading) {
		return <FeedbackState loading />;
	}

	if (error) {
		return (
			<FeedbackState
				type="error"
				title="Data cuti belum bisa dimuat."
				description={error}
				actionLabel="Coba Lagi"
				onAction={loadData}
			/>
		);
	}

	return (
		<>
			<Stack spacing={2}>
				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
						gap: 1.5,
					}}
				>
					<InfoCard
						title="Jenis Cuti Aktif"
						value={formOptions.leaveTypeOptions.length}
						helper={`Tahun ${formOptions.year || requestData.year}`}
					/>
					<InfoCard
						title="Saldo Berdasarkan Jenis"
						value="Pilih Jenis"
						helper="Saldo final ditentukan oleh jenis cuti yang dipilih di form."
					/>
				</Box>

				<Paper sx={{ p: 2.25, borderRadius: 4 }}>
					<Stack spacing={1.5}>
						<Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
							<Box>
								<Typography variant="h6" sx={{ color: '#123B66', fontWeight: 700 }}>
									Cuti Karyawan
								</Typography>
								<Typography variant="body2" color="text.secondary">
									Ajukan cuti, pantau status, dan proses approval dari satu tempat.
								</Typography>
							</Box>
							<Button
								variant="contained"
								startIcon={<AddOutlinedIcon />}
								onClick={() => setDialogOpen(true)}
								disabled={formOptions.leaveTypeOptions.length === 0}
							>
								Ajukan
							</Button>
						</Stack>
						<Divider />
						<Tabs value={tab} onChange={(event, value) => setTab(value)} variant="fullWidth">
							<Tab value="requests" label="Cuti Saya" />
							<Tab value="approvals" label="Approval Saya" />
						</Tabs>
					</Stack>
				</Paper>

				{tab === 'requests' ? (
					<Stack spacing={1.5}>
						{requestData.rows.length ? (
							requestData.rows.map((item) => (
								<LeaveRequestCard
									key={item.id}
									item={item}
									onOpen={(id) => navigate(`/karyawan/cuti/${id}`)}
								/>
							))
						) : (
							<FeedbackState
								title="Belum ada pengajuan cuti."
								description="Gunakan tombol Ajukan untuk membuat request cuti baru."
							/>
						)}
					</Stack>
				) : (
					<Stack spacing={1.5}>
						{approvalRows.length ? (
							approvalRows.map((item) => (
								<LeaveApprovalCard
									key={item.id}
									item={item}
									onOpen={(id) => navigate(`/karyawan/cuti/approval/${id}`)}
								/>
							))
						) : (
							<FeedbackState
								title="Tidak ada approval cuti."
								description="Task approval cuti yang ditujukan ke Anda akan muncul di sini."
							/>
						)}
					</Stack>
				)}
			</Stack>

			<LeaveRequestFormDialog
				open={dialogOpen}
				loading={submitting}
				leaveTypeOptions={formOptions.leaveTypeOptions}
				replacementOptions={formOptions.replacementOptions}
				submissionDate={formOptions.submissionDate}
				title="Ajukan Cuti"
				onClose={() => setDialogOpen(false)}
				onSubmit={handleSubmit}
			/>
		</>
	);
}

export default EmployeeLeaveCenterPage;
