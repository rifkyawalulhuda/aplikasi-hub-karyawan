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

function BoxTitle({ title, subtitle }) {
	return (
		<Stack spacing={0.5}>
			<Typography variant="subtitle1" sx={{ color: '#123B66', fontWeight: 700 }}>
				{title}
			</Typography>
			<Typography variant="body2" color="text.secondary">
				{subtitle}
			</Typography>
		</Stack>
	);
}

function WarningLetterCard({ item }) {
	return (
		<Paper sx={{ p: 2.25, borderRadius: 4 }}>
			<Stack spacing={1.25}>
				<Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
					<BoxTitle
						title={item.warningLevel ? `Surat Peringatan ${item.warningLevel}` : 'Surat Teguran'}
						subtitle={`${formatLongDate(item.letterDate)} | ${item.letterNumber}`}
					/>
					<Chip label={item.jobLevelName || 'Dokumen'} color="primary" variant="outlined" size="small" />
				</Stack>
				<Typography variant="body2" sx={{ color: '#123B66', fontWeight: 600 }}>
					Pelanggaran
				</Typography>
				<Typography variant="body2" color="text.secondary">
					{item.violation}
				</Typography>
				{item.articleLabel ? (
					<>
						<Typography variant="body2" sx={{ color: '#123B66', fontWeight: 600 }}>
							Pasal PKB
						</Typography>
						<Typography variant="body2" color="text.secondary">
							{item.articleLabel}
						</Typography>
					</>
				) : null}
				{item.articleContent ? (
					<Typography variant="body2" color="text.secondary">
						{item.articleContent}
					</Typography>
				) : null}
				<Typography variant="body2" sx={{ color: '#123B66', fontWeight: 600 }}>
					Superior
				</Typography>
				<Typography variant="body2" color="text.secondary">
					{item.superiorName} | {item.superiorJobLevelName}
				</Typography>
			</Stack>
		</Paper>
	);
}

function EmployeeWarningLettersPage() {
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
			const response = await employeeMeRequest('/warning-letters');
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
				title="Riwayat surat peringatan belum bisa dimuat."
				description={error}
				actionLabel="Coba Lagi"
				onAction={loadData}
			/>
		);
	}

	if (!rows.length) {
		return (
			<FeedbackState
				title="Belum ada surat peringatan."
				description="Jika ada dokumen disipliner yang terkait dengan Anda, datanya akan tampil di halaman ini."
			/>
		);
	}

	return (
		<Stack spacing={1.5}>
			{rows.map((item) => (
				<WarningLetterCard key={item.id} item={item} />
			))}
		</Stack>
	);
}

export default EmployeeWarningLettersPage;
