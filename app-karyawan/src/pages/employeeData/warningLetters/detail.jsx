import { useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';

import Breadcrumbs from '@mui/material/Breadcrumbs';
import Box from '@mui/material/Box';
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
import apiRequest from '@/services/api';

import WarningLetterPrintDocument from './warningLetterPrintDocument';

async function fetchWarningLetter(id) {
	return apiRequest(`/data-karyawan/warning-letters/${id}`);
}

function WarningLetterDetailPage() {
	const { enqueueSnackbar } = useSnackbar();
	const { id } = useParams();
	const [record, setRecord] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const init = async () => {
			setLoading(true);

			try {
				const data = await fetchWarningLetter(id);
				setRecord(data);
			} catch (error) {
				enqueueSnackbar(error.message, { variant: 'error' });
			} finally {
				setLoading(false);
			}
		};

		init();
	}, [enqueueSnackbar, id]);

	const handlePrint = () => {
		window.print();
	};

	let content = <Typography color="text.secondary">Data surat peringatan tidak ditemukan.</Typography>;

	if (loading) {
		content = (
			<Stack alignItems="center" justifyContent="center" py={10}>
				<CircularProgress />
			</Stack>
		);
	} else if (record) {
		content = <WarningLetterPrintDocument record={record} />;
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
						'.warning-letter-detail-root': {
							margin: '0 !important',
							padding: '0 !important',
							display: 'block !important',
							gap: '0 !important',
						},
						'.warning-letter-detail-root > *': {
							margin: '0 !important',
						},
						'.warning-letter-detail-card': {
							boxShadow: 'none !important',
							background: 'transparent !important',
							padding: '0 !important',
							border: '0 !important',
							margin: '0 !important',
						},
					},
				}}
			/>
			<Stack className="warning-letter-detail-root" spacing={3}>
				<Box className="no-print">
					<PageHeader title="Detail Surat Peringatan" sx={{ mb: 0 }}>
						<Stack direction="row" spacing={1} flexWrap="wrap">
							<Button
								component={RouterLink}
								to="/data-karyawan/data-surat-peringatan"
								variant="outlined"
								startIcon={<ArrowBackOutlinedIcon />}
							>
								Kembali
							</Button>
							<Button variant="contained" startIcon={<PrintOutlinedIcon />} onClick={handlePrint}>
								Print A4
							</Button>
						</Stack>
					</PageHeader>
				</Box>
				<Breadcrumbs aria-label="breadcrumb" sx={{ textTransform: 'uppercase' }} className="no-print">
					<Link underline="hover" component={RouterLink} to="/data-karyawan/data-surat-peringatan">
						Data Karyawan
					</Link>
					<Link underline="hover" component={RouterLink} to="/data-karyawan/data-surat-peringatan">
						Data Surat Peringatan
					</Link>
					<Typography color="text.tertiary">Detail</Typography>
				</Breadcrumbs>
				<Card className="warning-letter-detail-card" sx={{ p: 3, bgcolor: 'transparent', boxShadow: 'none' }}>
					{content}
				</Card>
			</Stack>
		</>
	);
}

export default WarningLetterDetailPage;
