import { useEffect, useMemo, useRef, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';

import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CircularProgress from '@mui/material/CircularProgress';
import GlobalStyles from '@mui/material/GlobalStyles';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';

import PageHeader from '@/components/pageHeader';
import LeaveApplicationPrintDocument from '@/components/leavePrint/leaveApplicationPrintDocument';
import { buildLeavePrintPayload } from '@/components/leavePrint/utils';
import apiRequest from '@/services/api';

function LeavePrintAdminPage() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { enqueueSnackbar } = useSnackbar();
	const [loading, setLoading] = useState(true);
	const [record, setRecord] = useState(null);
	const [error, setError] = useState('');
	const hasAutoPrinted = useRef(false);

	useEffect(() => {
		const init = async () => {
			setLoading(true);
			setError('');

			try {
				const response = await apiRequest(`/data-karyawan/employee-leaves/flow/${id}`);
				setRecord(response);
			} catch (requestError) {
				setError(requestError.message);
				enqueueSnackbar(requestError.message, { variant: 'error' });
			} finally {
				setLoading(false);
			}
		};

		init();
	}, [enqueueSnackbar, id]);

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
			<Typography color="text.secondary">
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
				<Typography color="error.main">{error}</Typography>
				<Button variant="outlined" onClick={() => navigate('/data-karyawan/cuti-karyawan/flow')}>
					Kembali ke Flow Cuti
				</Button>
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
						'.app-shell-main': {
							maxWidth: '100% !important',
							padding: '0 !important',
							margin: '0 !important',
						},
						'.leave-print-admin-root': {
							margin: '0 !important',
							padding: '0 !important',
							display: 'block !important',
						},
						'.leave-print-admin-card': {
							boxShadow: 'none !important',
							background: 'transparent !important',
							padding: '0 !important',
							border: '0 !important',
							margin: '0 !important',
						},
					},
				}}
			/>

			<Stack className="leave-print-admin-root" spacing={3}>
				<Box className="no-print">
					<PageHeader title="Print Form Cuti" sx={{ mb: 0 }}>
						<Stack direction="row" spacing={1} flexWrap="wrap">
							<Button
								component={RouterLink}
								to="/data-karyawan/cuti-karyawan/flow"
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
					</PageHeader>
				</Box>

				<Breadcrumbs aria-label="breadcrumb" sx={{ textTransform: 'uppercase' }} className="no-print">
					<Link underline="hover" component={RouterLink} to="/data-karyawan/cuti-karyawan/flow">
						Data Karyawan
					</Link>
					<Link underline="hover" component={RouterLink} to="/data-karyawan/cuti-karyawan/flow">
						Cuti Karyawan
					</Link>
					<Typography color="text.tertiary">Print Form Cuti</Typography>
				</Breadcrumbs>

				<Card className="leave-print-admin-card" sx={{ p: 3, bgcolor: 'transparent', boxShadow: 'none' }}>
					{content}
				</Card>
			</Stack>
		</>
	);
}

export default LeavePrintAdminPage;
