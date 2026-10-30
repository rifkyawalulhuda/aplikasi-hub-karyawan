import { useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';

import DeliverySlipPrintDocument from '@/components/dokumen/deliverySlipPrintDocument';
import { getDeliverySlip } from '@/services/deliverySlipService';

const PRINT_PAGE_STYLE = `
@page { size: A4; margin: 0; }
@media print {
	html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
}
`;

function LembarPengirimanPrintPage() {
	const { id } = useParams();
	const [searchParams] = useSearchParams();
	const siteId = Number(searchParams.get('siteId'));

	const [slip, setSlip] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [printReady, setPrintReady] = useState(false);

	const fetchData = useCallback(async () => {
		if (!id) {
			setError('ID lembar pengiriman tidak valid.');
			setLoading(false);
			return;
		}

		setLoading(true);

		try {
			const result = await getDeliverySlip(id, Number.isFinite(siteId) ? siteId : null);
			setSlip(result);
			setError('');
		} catch (err) {
			setError(err.message || 'Gagal memuat lembar pengiriman.');
		} finally {
			setLoading(false);
		}
	}, [id, siteId]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	useEffect(() => {
		if (!loading && slip && printReady) {
			const timer = window.setTimeout(() => window.print(), 400);
			return () => window.clearTimeout(timer);
		}

		return undefined;
	}, [loading, slip, printReady]);

	const handlePrintReady = useCallback(() => {
		setPrintReady(true);
	}, []);

	if (loading) {
		return (
			<Stack alignItems="center" justifyContent="center" sx={{ minHeight: '60vh' }}>
				<CircularProgress />
			</Stack>
		);
	}

	if (error) {
		return (
			<Stack alignItems="center" spacing={2} sx={{ py: 8 }}>
				<Typography color="error">{error}</Typography>
			</Stack>
		);
	}

	return (
		<Box
			sx={{
				backgroundColor: '#f3f4f6',
				minHeight: '100vh',
				py: 3,
				'@media print': {
					backgroundColor: '#fff',
					minHeight: 'auto',
					py: 0,
					px: 0,
				},
			}}
		>
			<style>{PRINT_PAGE_STYLE}</style>
			<Box sx={{ width: '210mm', mx: 'auto', mb: 2, '@media print': { display: 'none' } }}>
				<Stack direction="row" justifyContent="flex-end" spacing={1}>
					<Button variant="contained" startIcon={<PrintOutlinedIcon />} onClick={() => window.print()}>
						Cetak
					</Button>
					<Button variant="outlined" onClick={() => window.close()}>
						Tutup
					</Button>
				</Stack>
			</Box>
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					gap: '8mm',
					'@media print': {
						display: 'block',
						gap: 0,
					},
				}}
			>
				<DeliverySlipPrintDocument slip={slip} onReady={handlePrintReady} />
			</Box>
		</Box>
	);
}

export default LembarPengirimanPrintPage;
