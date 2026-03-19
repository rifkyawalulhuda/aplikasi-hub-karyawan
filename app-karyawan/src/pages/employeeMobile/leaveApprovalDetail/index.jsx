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
import LeaveRequestTimeline from '@/components/employeePortal/leaveRequestTimeline';
import LeaveStatusChip from '@/components/employeePortal/leaveStatusChip';
import { useEmployeeAuth } from '@/contexts/employeeAuthContext';
import { employeeMeRequest } from '@/services/employeeApi';
import { formatLongDate, getEmployeePortalErrorMessage, handleEmployeeUnauthorized } from '@/utils/employeePortal';

function EmployeeLeaveApprovalDetailPage() {
	const { approvalId } = useParams();
	const navigate = useNavigate();
	const { enqueueSnackbar } = useSnackbar();
	const { logout } = useEmployeeAuth();
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState('');
	const [payload, setPayload] = useState(null);
	const [approveOpen, setApproveOpen] = useState(false);
	const [rejectOpen, setRejectOpen] = useState(false);

	const loadData = async () => {
		setLoading(true);
		setError('');

		try {
			const response = await employeeMeRequest(`/leave-approvals/${approvalId}`);
			setPayload(response);
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
	}, [approvalId]);

	const handleApprove = async (values) => {
		setSubmitting(true);

		try {
			const response = await employeeMeRequest(`/leave-approvals/${approvalId}/approve`, {
				method: 'POST',
				body: JSON.stringify(values),
			});
			setPayload(response);
			setApproveOpen(false);
			enqueueSnackbar('Approval cuti berhasil diproses.', { variant: 'success' });
		} catch (requestError) {
			enqueueSnackbar(requestError.message, { variant: 'error' });
		} finally {
			setSubmitting(false);
		}
	};

	const handleReject = async (values) => {
		setSubmitting(true);

		try {
			const response = await employeeMeRequest(`/leave-approvals/${approvalId}/reject`, {
				method: 'POST',
				body: JSON.stringify(values),
			});
			setPayload(response);
			setRejectOpen(false);
			enqueueSnackbar('Reject cuti berhasil dikirim.', { variant: 'success' });
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
				title="Detail approval belum bisa dimuat."
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
						<Button variant="text" onClick={() => navigate('/karyawan/cuti')}>
							Kembali
						</Button>
						<Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
							<Typography variant="h6" sx={{ color: '#123B66', fontWeight: 700 }}>
								Approval Cuti
							</Typography>
							<LeaveStatusChip
								status={payload?.approval?.status}
								label={payload?.approval?.statusLabel}
							/>
						</Stack>
						<Typography variant="body2" color="text.secondary">
							Request: {payload?.request?.requestNumber}
						</Typography>
						<Typography variant="body2" color="text.secondary">
							Karyawan: {payload?.request?.employeeName} ({payload?.request?.employeeNo})
						</Typography>
						<Typography variant="body2" color="text.secondary">
							{payload?.request?.leaveType}
							{' | '}
							{payload?.request?.leaveDays} hari
						</Typography>
						<Typography variant="body2" color="text.secondary">
							{formatLongDate(payload?.request?.periodStart)} -{' '}
							{formatLongDate(payload?.request?.periodEnd)}
						</Typography>
						<Typography variant="body2" color="text.secondary">
							Catatan: {payload?.request?.notes || '-'}
						</Typography>
						<Typography variant="body2" color="text.secondary">
							Tahap Anda: {payload?.approval?.stageLabel}
						</Typography>
						<Divider />
						{payload?.approval?.isActionable ? (
							<Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
								<Button variant="contained" onClick={() => setApproveOpen(true)}>
									Approve
								</Button>
								<Button variant="outlined" color="error" onClick={() => setRejectOpen(true)}>
									Reject
								</Button>
							</Stack>
						) : (
							<Typography variant="body2" color="text.secondary">
								Approval ini sudah tidak aktif untuk diproses.
							</Typography>
						)}
					</Stack>
				</Paper>

				<Paper sx={{ p: 2.5, borderRadius: 4 }}>
					<Stack spacing={1.5}>
						<Typography variant="h6" sx={{ color: '#123B66', fontWeight: 700 }}>
							Timeline Approval
						</Typography>
						<LeaveRequestTimeline
							revisions={payload?.request?.revisions || []}
							approvals={payload?.request?.approvals || []}
						/>
					</Stack>
				</Paper>
			</Stack>

			<LeaveDecisionDialog
				open={approveOpen}
				loading={submitting}
				title="Approve request cuti ini?"
				onClose={() => setApproveOpen(false)}
				onSubmit={handleApprove}
			/>
			<LeaveDecisionDialog
				open={rejectOpen}
				loading={submitting}
				title="Reject request cuti ini"
				requireNote
				onClose={() => setRejectOpen(false)}
				onSubmit={handleReject}
			/>
		</>
	);
}

export default EmployeeLeaveApprovalDetailPage;
