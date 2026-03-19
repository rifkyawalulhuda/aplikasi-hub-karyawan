import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';

import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import FeedbackState from '@/components/employeePortal/feedbackState';
import LeaveDecisionDialog from '@/components/employeePortal/leaveDecisionDialog';
import LeaveRequestFormDialog from '@/components/employeePortal/leaveRequestFormDialog';
import LeaveRequestTimeline from '@/components/employeePortal/leaveRequestTimeline';
import LeaveStatusChip from '@/components/employeePortal/leaveStatusChip';
import { useEmployeeAuth } from '@/contexts/employeeAuthContext';
import apiRequest from '@/services/api';
import { employeeMeRequest } from '@/services/employeeApi';
import { formatLongDate, getEmployeePortalErrorMessage, handleEmployeeUnauthorized } from '@/utils/employeePortal';

function EmployeeLeaveRequestDetailPage() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { enqueueSnackbar } = useSnackbar();
	const { logout } = useEmployeeAuth();
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState('');
	const [record, setRecord] = useState(null);
	const [leaveTypes, setLeaveTypes] = useState([]);
	const [resubmitOpen, setResubmitOpen] = useState(false);
	const [cancelOpen, setCancelOpen] = useState(false);

	const loadData = async () => {
		setLoading(true);
		setError('');

		try {
			const [detailResponse, leaveTypeResponse] = await Promise.all([
				employeeMeRequest(`/leave-requests/${id}`),
				apiRequest('/master/master-cuti-karyawan'),
			]);

			setRecord(detailResponse);
			setLeaveTypes(leaveTypeResponse);
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
	}, [id]);

	const handleResubmit = async (values) => {
		setSubmitting(true);

		try {
			const response = await employeeMeRequest(`/leave-requests/${id}/resubmit`, {
				method: 'POST',
				body: JSON.stringify(values),
			});

			setRecord(response);
			setResubmitOpen(false);
			enqueueSnackbar('Pengajuan cuti berhasil di-resubmit.', { variant: 'success' });
		} catch (requestError) {
			enqueueSnackbar(requestError.message, { variant: 'error' });
		} finally {
			setSubmitting(false);
		}
	};

	const handleCancel = async () => {
		setSubmitting(true);

		try {
			const response = await employeeMeRequest(`/leave-requests/${id}/cancel`, {
				method: 'POST',
			});

			setRecord(response);
			setCancelOpen(false);
			enqueueSnackbar('Request cuti berhasil dibatalkan.', { variant: 'success' });
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
				title="Detail cuti belum bisa dimuat."
				description={error}
				actionLabel="Coba Lagi"
				onAction={loadData}
			/>
		);
	}

	return (
		<>
			<Stack spacing={2}>
				<Paper sx={{ p: 2.5, borderRadius: 4 }}>
					<Stack spacing={1.5}>
						<Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
							<BoxButtonBack onBack={() => navigate('/karyawan/cuti')} />
							<LeaveStatusChip status={record?.status} label={record?.statusLabel} />
						</Stack>
						<Typography variant="h6" sx={{ color: '#123B66', fontWeight: 700 }}>
							{record?.requestNumber}
						</Typography>
						<Typography variant="body2" color="text.secondary">
							{record?.leaveType} | {record?.leaveDays} hari
						</Typography>
						<Typography variant="body2" color="text.secondary">
							{formatLongDate(record?.periodStart)} - {formatLongDate(record?.periodEnd)}
						</Typography>
						<Typography variant="body2" color="text.secondary">
							Saldo sebelum: {record?.balanceBefore} | Saldo setelah: {record?.remainingLeave}
						</Typography>
						<Typography variant="body2" color="text.secondary">
							Catatan: {record?.notes || '-'}
						</Typography>
						{record?.rejectionNote ? (
							<Typography variant="body2" color="error.main">
								Alasan reject terakhir: {record.rejectionNote}
							</Typography>
						) : null}
						<Divider />
						<Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
							{record?.canResubmit ? (
								<Button variant="contained" onClick={() => setResubmitOpen(true)}>
									Resubmit
								</Button>
							) : null}
							{record?.canCancel ? (
								<Button variant="outlined" color="error" onClick={() => setCancelOpen(true)}>
									Cancel
								</Button>
							) : null}
						</Stack>
					</Stack>
				</Paper>

				<Paper sx={{ p: 2.5, borderRadius: 4 }}>
					<Stack spacing={1.5}>
						<Typography variant="h6" sx={{ color: '#123B66', fontWeight: 700 }}>
							Flow Approval
						</Typography>
						<LeaveRequestTimeline revisions={record?.revisions || []} approvals={record?.approvals || []} />
					</Stack>
				</Paper>
			</Stack>

			<LeaveRequestFormDialog
				open={resubmitOpen}
				loading={submitting}
				leaveTypeOptions={leaveTypes}
				initialValue={record}
				title="Resubmit Pengajuan Cuti"
				onClose={() => setResubmitOpen(false)}
				onSubmit={handleResubmit}
			/>
			<LeaveDecisionDialog
				open={cancelOpen}
				loading={submitting}
				title="Batalkan request cuti ini?"
				onClose={() => setCancelOpen(false)}
				onSubmit={handleCancel}
			/>
		</>
	);
}

function BoxButtonBack({ onBack }) {
	return (
		<Button variant="text" onClick={onBack}>
			Kembali
		</Button>
	);
}

export default EmployeeLeaveRequestDetailPage;
