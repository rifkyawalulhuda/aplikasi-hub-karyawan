import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';

import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';

import FeedbackState from '@/components/employeePortal/feedbackState';
import LeaveDecisionDialog from '@/components/employeePortal/leaveDecisionDialog';
import LeaveRequestFormDialog from '@/components/employeePortal/leaveRequestFormDialog';
import LeaveRequestTimeline from '@/components/employeePortal/leaveRequestTimeline';
import { useEmployeeAuth } from '@/contexts/employeeAuthContext';
import { employeeMeRequest } from '@/services/employeeApi';
import { getEmployeePortalErrorMessage, handleEmployeeUnauthorized } from '@/utils/employeePortal';

function EmployeeLeaveRequestDetailPage() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { enqueueSnackbar } = useSnackbar();
	const { logout } = useEmployeeAuth();
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState('');
	const [record, setRecord] = useState(null);
	const [formOptions, setFormOptions] = useState({
		submissionDate: '',
		year: new Date().getFullYear(),
		leaveTypeOptions: [],
		replacementOptions: [],
	});
	const [resubmitOpen, setResubmitOpen] = useState(false);
	const [cancelOpen, setCancelOpen] = useState(false);

	const loadData = async () => {
		setLoading(true);
		setError('');

		try {
			const [detailResponse, formOptionsResponse] = await Promise.all([
				employeeMeRequest(`/leave-requests/${id}`),
				employeeMeRequest('/leave-form-options'),
			]);

			setRecord(detailResponse);
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

	const handleOpenPrint = () => {
		window.open(`/karyawan/cuti/${id}/print`, '_blank', 'noopener,noreferrer');
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
			<Stack spacing={2.5}>
				<Stack spacing={1.5}>
					<Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
						<BoxButtonBack onBack={() => navigate('/karyawan/cuti')} />
					</Stack>
				</Stack>

				<Paper sx={{ p: 2.5, borderRadius: 4 }}>
					<Stack spacing={2}>
						<Typography variant="h5" sx={{ color: '#123B66', fontWeight: 800 }}>
							{record?.requestNumber}
						</Typography>

						<Stack direction="row" justifyContent="space-between" alignItems="center">
							<Typography variant="h6" sx={{ color: '#123B66', fontWeight: 700 }}>
								Flow Approval
							</Typography>
							{record?.status === 'APPROVED' ? (
								<Button
									variant="contained"
									color="primary"
									size="small"
									startIcon={<PrintOutlinedIcon />}
									onClick={handleOpenPrint}
									sx={{ borderRadius: 2 }}
								>
									Print A4
								</Button>
							) : null}
						</Stack>

						<LeaveRequestTimeline revisions={record?.revisions || []} approvals={record?.approvals || []} />

						{record?.canResubmit || record?.canCancel ? (
							<>
								<Divider />
								<Stack direction="row" spacing={1.5}>
									{record?.canResubmit ? (
										<Button
											fullWidth
											variant="contained"
											onClick={() => setResubmitOpen(true)}
											sx={{ py: 1.25, borderRadius: 3 }}
										>
											Resubmit
										</Button>
									) : null}
									{record?.canCancel ? (
										<Button
											fullWidth
											variant="outlined"
											color="error"
											onClick={() => setCancelOpen(true)}
											sx={{ py: 1.25, borderRadius: 3 }}
										>
											Cancel
										</Button>
									) : null}
								</Stack>
							</>
						) : null}
					</Stack>
				</Paper>
			</Stack>

			<LeaveRequestFormDialog
				open={resubmitOpen}
				loading={submitting}
				leaveTypeOptions={formOptions.leaveTypeOptions}
				replacementOptions={formOptions.replacementOptions}
				submissionDate={formOptions.submissionDate}
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
