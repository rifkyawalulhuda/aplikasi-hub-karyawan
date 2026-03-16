import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import GlobalStyles from '@mui/material/GlobalStyles';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';

import apiRequest from '@/services/api';

import WarningLetterPrintDocument from './warningLetterPrintDocument';

async function fetchWarningLetters() {
	return apiRequest('/data-karyawan/warning-letters');
}

function WarningLetterBulkPrintPage() {
	const { enqueueSnackbar } = useSnackbar();
	const [searchParams] = useSearchParams();
	const [records, setRecords] = useState([]);
	const [loading, setLoading] = useState(true);
	const [hasTriggeredPrint, setHasTriggeredPrint] = useState(false);

	const selectedIds = useMemo(
		() =>
			(searchParams.get('ids') || '')
				.split(',')
				.map((value) => Number(value))
				.filter((value) => Number.isInteger(value)),
		[searchParams],
	);

	useEffect(() => {
		const init = async () => {
			setLoading(true);

			try {
				const data = await fetchWarningLetters();

				if (selectedIds.length === 0) {
					setRecords([]);
					return;
				}

				const recordsById = new Map(data.map((item) => [item.id, item]));
				setRecords(selectedIds.map((id) => recordsById.get(id)).filter(Boolean));
			} catch (error) {
				enqueueSnackbar(error.message, { variant: 'error' });
			} finally {
				setLoading(false);
			}
		};

		init();
	}, [enqueueSnackbar, selectedIds]);

	useEffect(() => {
		let timeoutId;

		if (!loading && !hasTriggeredPrint && records.length > 0) {
			timeoutId = window.setTimeout(() => {
				setHasTriggeredPrint(true);
				window.print();
			}, 350);
		}

		return () => {
			if (timeoutId) {
				window.clearTimeout(timeoutId);
			}
		};
	}, [hasTriggeredPrint, loading, records]);

	let content = (
		<Stack alignItems="center" spacing={1} py={10}>
			<Typography variant="h6">Tidak ada data surat peringatan untuk dicetak.</Typography>
			<Typography variant="body2" color="text.secondary">
				Pilih data dari halaman daftar terlebih dahulu.
			</Typography>
		</Stack>
	);

	if (loading) {
		content = (
			<Stack alignItems="center" justifyContent="center" py={10}>
				<CircularProgress />
			</Stack>
		);
	} else if (records.length > 0) {
		content = (
			<Stack className="bulk-print-stack" spacing={3}>
				{records.map((record) => (
					<Box key={record.id} className="bulk-print-page-wrapper">
						<WarningLetterPrintDocument record={record} />
					</Box>
				))}
			</Stack>
		);
	}

	return (
		<>
			<GlobalStyles
				styles={{
					'@page': {
						size: 'A4',
						margin: 0,
					},
					body: {
						margin: 0,
						padding: 0,
						background: '#f5f7fb',
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
						'.no-print': {
							display: 'none !important',
						},
						'.bulk-print-root': {
							display: 'block !important',
							padding: '0 !important',
							margin: '0 !important',
						},
						'.bulk-print-stack': {
							display: 'block !important',
							gap: '0 !important',
						},
						'.bulk-print-root > *': {
							margin: '0 !important',
						},
						'.bulk-print-stack > *': {
							margin: '0 !important',
						},
						'.bulk-print-page-wrapper': {
							display: 'block !important',
							margin: '0 !important',
							padding: '0 !important',
							breakAfter: 'page',
							pageBreakAfter: 'always',
						},
						'.bulk-print-page-wrapper:last-of-type': {
							breakAfter: 'auto',
							pageBreakAfter: 'auto',
						},
					},
				}}
			/>
			<Stack className="bulk-print-root" spacing={3} sx={{ p: 3 }}>
				<Stack
					className="no-print"
					direction={{ xs: 'column', sm: 'row' }}
					spacing={1.5}
					justifyContent="space-between"
					alignItems={{ xs: 'stretch', sm: 'center' }}
				>
					<Box>
						<Typography variant="h5" fontWeight={700}>
							Print A4 Surat Peringatan
						</Typography>
						<Typography variant="body2" color="text.secondary">
							{records.length} surat peringatan siap dicetak.
						</Typography>
					</Box>
					<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
						<Button
							component={RouterLink}
							to="/data-karyawan/data-surat-peringatan"
							variant="outlined"
							startIcon={<ArrowBackOutlinedIcon />}
						>
							Kembali
						</Button>
						<Button variant="contained" startIcon={<PrintOutlinedIcon />} onClick={() => window.print()}>
							Print A4
						</Button>
					</Stack>
				</Stack>
				{content}
			</Stack>
		</>
	);
}

export default WarningLetterBulkPrintPage;
