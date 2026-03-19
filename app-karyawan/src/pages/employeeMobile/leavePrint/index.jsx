import { useEffect, useMemo, useRef, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CircularProgress from '@mui/material/CircularProgress';
import GlobalStyles from '@mui/material/GlobalStyles';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';

import LeaveApplicationPrintDocument from '@/components/leavePrint/leaveApplicationPrintDocument';
import { buildLeavePrintPayload } from '@/components/leavePrint/utils';
import { useEmployeeAuth } from '@/contexts/employeeAuthContext';
import { employeeMeRequest } from '@/services/employeeApi';
import { getEmployeePortalErrorMessage, handleEmployeeUnauthorized } from '@/utils/employeePortal';

function EmployeeLeavePrintPage() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { enqueueSnackbar } = useSnackbar();
	const { logout } = useEmployeeAuth();
	const [loading, setLoading] = useState(true);
	const [record, setRecord] = useState(null);
	const [error, setError] = useState('');
	const hasAutoPrinted = useRef(false);

	useEffect(() => {
		const init = async () => {
			setLoading(true);
			setError('');

			try {
				const response = await employeeMeRequest(`/leave-requests/${id}`);
				setRecord(response);
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

		init();
	}, [enqueueSnackbar, id, logout, navigate]);

	useEffect(() => {
		if (!record || record.status !== 'APPROVED' || hasAutoPrinted.current) {
			return;
		}

		hasAutoPrinted.current = true;
		window.setTimeout(() => window.print(), 300);
	}, [record]);

	const printPayload = useMemo(
		() => (record?.status === 'APPROVED' ? buildLeavePrintPayload(record) : null),
		[record],
	);

	let content = (
		<Stack spacing={1.5} alignItems="center" py={10}>
			<Typography color="text.secondary" textAlign="center">
				Request cuti ini belum approved sehingga belum dapat dicetak.
			</Typography>
		</Stack>
	);

	if (loading) {
		content = (
			<Stack alignItems="center" justifyContent="center" py={10}>
				<CircularProgress />
			</Stack>
		);
	} else if (error) {
		content = (
			<Stack spacing={1.5} alignItems="center" py={10}>
				<Typography color="error.main" textAlign="center">
					{error}
				</Typography>
			</Stack>
		);
	} else if (printPayload) {
		content = <LeaveApplicationPrintDocument data={printPayload} />;
	}

	return (
		<>
			<GlobalStyles
				styles={{
					'@page': {
						size: 'A4',
						margin: 0,
					},
					'@media print': {
						html: {
							margin: 0,
							padding: 0,
						},
						body: {
							margin: 0,
							padding: 0,
							background: '#fff',
						},
						'.no-print, .app-shell-header, .app-shell-footer, .app-shell-fab': {
							display: 'none !important',
						},
						'.leave-print-employee-root': {
							margin: '0 !important',
							padding: '0 !important',
							display: 'block !important',
						},
						'.leave-print-employee-card': {
							boxShadow: 'none !important',
							background: 'transparent !important',
							padding: '0 !important',
							border: '0 !important',
							margin: '0 !important',
						},
					},
				}}
			/>

			<Stack className="leave-print-employee-root" spacing={2.5} sx={{ p: { xs: 2, sm: 3 } }}>
				<Box className="no-print">
					<Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
						<Button
							component={RouterLink}
							to={`/karyawan/cuti/${id}`}
							variant="outlined"
							startIcon={<ArrowBackOutlinedIcon />}
						>
							Kembali
						</Button>
						<Button
							variant="contained"
							startIcon={<PrintOutlinedIcon />}
							onClick={() => window.print()}
							disabled={!printPayload}
						>
							Print A4
						</Button>
					</Stack>
				</Box>

				<Card className="leave-print-employee-card" sx={{ p: 0, bgcolor: 'transparent', boxShadow: 'none' }}>
					{content}
				</Card>
			</Stack>
		</>
	);
}

export default EmployeeLeavePrintPage;
