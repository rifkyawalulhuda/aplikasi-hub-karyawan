import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';

import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import FeedbackState from '@/components/employeePortal/feedbackState';
import { useEmployeeAuth } from '@/contexts/employeeAuthContext';
import { employeeMeRequest } from '@/services/employeeApi';
import { formatLongDate, getEmployeePortalErrorMessage, handleEmployeeUnauthorized } from '@/utils/employeePortal';

function GuidanceRecordCard({ item }) {
	return (
		<Paper sx={{ p: 2.25, borderRadius: 4 }}>
			<Stack spacing={1.25}>
				<Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
					<Typography variant="subtitle1" sx={{ color: '#123B66', fontWeight: 700 }}>
						{item.categoryLabel}
					</Typography>
					<Chip label={`Pertemuan ${item.meetingNumber}`} color="primary" variant="outlined" size="small" />
				</Stack>
				<Typography variant="body2" color="text.secondary">
					{formatLongDate(item.meetingDate)} | {item.meetingTime} | {item.location}
				</Typography>
				<Typography variant="body2" sx={{ color: '#123B66', fontWeight: 600 }}>
					Permasalahan
				</Typography>
				<Typography variant="body2" color="text.secondary">
					{item.problemFaced}
				</Typography>
				{item.problemFacedSecondary ? (
					<>
						<Typography variant="body2" sx={{ color: '#123B66', fontWeight: 600 }}>
							Pengetahuan / Tanggung Jawab Tambahan
						</Typography>
						<Typography variant="body2" color="text.secondary">
							{item.problemFacedSecondary}
						</Typography>
					</>
				) : null}
				<Typography variant="body2" sx={{ color: '#123B66', fontWeight: 600 }}>
					Penyebab Masalah
				</Typography>
				<Typography variant="body2" color="text.secondary">
					{item.problemCause}
				</Typography>
				<Typography variant="body2" sx={{ color: '#123B66', fontWeight: 600 }}>
					Pemecahan Masalah
				</Typography>
				<Typography variant="body2" color="text.secondary">
					{item.problemSolving}
				</Typography>
			</Stack>
		</Paper>
	);
}

function EmployeeGuidanceRecordsPage() {
	const navigate = useNavigate();
	const { enqueueSnackbar } = useSnackbar();
	const { logout } = useEmployeeAuth();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [rows, setRows] = useState([]);

	const loadData = async () => {
		setLoading(true);
		setError('');

		try {
			const response = await employeeMeRequest('/guidance-records');
			setRows(response);
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

	if (loading) {
		return <FeedbackState loading />;
	}

	if (error) {
		return (
			<FeedbackState
				type="error"
				title="Riwayat bimbingan belum bisa dimuat."
				description={error}
				actionLabel="Coba Lagi"
				onAction={loadData}
			/>
		);
	}

	if (!rows.length) {
		return (
			<FeedbackState
				title="Belum ada riwayat bimbingan."
				description="Data bimbingan dan pengarahan milik Anda akan muncul di halaman ini."
			/>
		);
	}

	return (
		<Stack spacing={1.5}>
			{rows.map((item) => (
				<GuidanceRecordCard key={item.id} item={item} />
			))}
		</Stack>
	);
}

export default EmployeeGuidanceRecordsPage;
