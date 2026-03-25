import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';

import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';

import FeedbackState from '@/components/employeePortal/feedbackState';
import { useEmployeeAuth } from '@/contexts/employeeAuthContext';
import { employeeMeRequest } from '@/services/employeeApi';
import { formatLongDate, getEmployeePortalErrorMessage, handleEmployeeUnauthorized } from '@/utils/employeePortal';

function WarningLetterCard({ item }) {
	return (
		<Paper
			elevation={0}
			sx={{
				borderRadius: 4,
				overflow: 'hidden',
				border: '1px solid rgba(18,59,102,0.08)',
				backgroundColor: '#FFFFFF',
				boxShadow: '0 10px 24px rgba(18,59,102,0.06)',
			}}
		>
			<Accordion
				disableGutters
				elevation={0}
				square
				sx={{
					'&:before': { display: 'none' },
					backgroundColor: 'transparent',
				}}
			>
				<AccordionSummary
					expandIcon={<ExpandMoreRoundedIcon />}
					sx={{
						px: 2,
						py: 1.5,
						'& .MuiAccordionSummary-content': {
							my: 0,
						},
						'& .MuiAccordionSummary-expandIconWrapper': {
							color: '#5D738B',
						},
					}}
				>
					<Stack spacing={1} sx={{ width: '100%' }}>
						<Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
							<Box sx={{ minWidth: 0, flex: 1 }}>
								<Typography variant="subtitle1" sx={{ color: '#123B66', fontWeight: 800 }}>
									{item.warningLevel ? `Surat Peringatan ${item.warningLevel}` : 'Surat Teguran'}
								</Typography>
								<Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
									{formatLongDate(item.letterDate)} | {item.letterNumber}
								</Typography>
							</Box>
							<Chip
								label={item.jobLevelName || 'Dokumen'}
								color="primary"
								variant="outlined"
								size="small"
								sx={{ flexShrink: 0 }}
							/>
						</Stack>
						<Typography
							variant="caption"
							sx={{ color: '#7B8FA3', letterSpacing: '0.04em', textTransform: 'uppercase' }}
						>
							Tap untuk lihat detail
						</Typography>
					</Stack>
				</AccordionSummary>
				<AccordionDetails sx={{ px: 2, pb: 2 }}>
					<Stack spacing={1.5}>
						<Box>
							<Typography variant="caption" sx={{ color: '#5D738B', letterSpacing: '0.08em' }}>
								Pelanggaran
							</Typography>
							<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.6 }}>
								{item.violation}
							</Typography>
						</Box>
						{item.articleLabel || item.articleContent ? (
							<Box>
								<Typography variant="caption" sx={{ color: '#5D738B', letterSpacing: '0.08em' }}>
									Pasal PKB
								</Typography>
								<Stack spacing={0.75} sx={{ mt: 0.5 }}>
									{item.articleLabel ? (
										<Typography variant="body2" sx={{ color: '#123B66', fontWeight: 700 }}>
											{item.articleLabel}
										</Typography>
									) : null}
									{item.articleContent ? (
										<Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
											{item.articleContent}
										</Typography>
									) : null}
								</Stack>
							</Box>
						) : null}
						<Box
							sx={{
								p: 1.5,
								borderRadius: 3,
								backgroundColor: 'rgba(18,59,102,0.04)',
							}}
						>
							<Typography variant="caption" sx={{ color: '#5D738B', letterSpacing: '0.08em' }}>
								Superior
							</Typography>
							<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
								{item.superiorName} | {item.superiorJobLevelName}
							</Typography>
						</Box>
					</Stack>
				</AccordionDetails>
			</Accordion>
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
