import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import GlobalStyles from '@mui/material/GlobalStyles';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';

import DeliverySlipPrintDocument from '@/components/dokumen/deliverySlipPrintDocument';
import { getDeliverySlips } from '@/services/deliverySlipService';

const READY_TIMEOUT_MS = 3000;

function LembarPengirimanBulkPrintPage() {
	const { enqueueSnackbar } = useSnackbar();
	const [searchParams] = useSearchParams();
	const [records, setRecords] = useState([]);
	const [loading, setLoading] = useState(true);
	const [readyIds, setReadyIds] = useState(() => new Set());
	const [hasTriggeredPrint, setHasTriggeredPrint] = useState(false);
	const [preparationTimedOut, setPreparationTimedOut] = useState(false);
	const timeoutRef = useRef(null);

	const siteId = Number(searchParams.get('siteId')) || null;

	const selectedIds = useMemo(() => {
		const parsedIds = (searchParams.get('ids') || '')
			.split(',')
			.map((value) => Number(value))
			.filter((value) => Number.isInteger(value));

		return [...new Set(parsedIds)];
	}, [searchParams]);

	useEffect(() => {
		let cancelled = false;

		const init = async () => {
			if (selectedIds.length === 0) {
				setRecords([]);
				setLoading(false);
				return;
			}

			setLoading(true);

			try {
				const slips = await getDeliverySlips(siteId);

				if (cancelled) {
					return;
				}

				const wantedIdSet = new Set(selectedIds);
				setRecords((slips || []).filter((slip) => wantedIdSet.has(slip.id)));
			} catch (error) {
				if (!cancelled) {
					enqueueSnackbar(error.message, { variant: 'error' });
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		};

		init();

		return () => {
			cancelled = true;
		};
	}, [enqueueSnackbar, selectedIds, siteId]);

	const handleReady = useCallback((id) => {
		setReadyIds((currentIds) => {
			if (currentIds.has(id)) {
				return currentIds;
			}

			const nextIds = new Set(currentIds);
			nextIds.add(id);
			return nextIds;
		});
	}, []);

	const readyHandlers = useMemo(
		() => new Map(records.map((record) => [record.id, () => handleReady(record.id)])),
		[handleReady, records],
	);

	const allReady = records.length > 0 && readyIds.size >= records.length;

	useEffect(() => {
		if (loading || records.length === 0) {
			return undefined;
		}

		timeoutRef.current = window.setTimeout(() => {
			if (!allReady) {
				setPreparationTimedOut(true);
			}
		}, READY_TIMEOUT_MS);

		return () => {
			if (timeoutRef.current) {
				window.clearTimeout(timeoutRef.current);
			}
		};
	}, [allReady, loading, records.length]);

	useEffect(() => {
		if (loading || !allReady || hasTriggeredPrint) {
			return undefined;
		}

		const timer = window.setTimeout(() => {
			setHasTriggeredPrint(true);
			window.print();
		}, 350);

		return () => window.clearTimeout(timer);
	}, [allReady, hasTriggeredPrint, loading]);

	const handleManualPrint = () => {
		setHasTriggeredPrint(true);
		setPreparationTimedOut(false);
		window.print();
	};

	let content = (
		<Stack alignItems="center" spacing={2} py={10}>
			<Typography variant="h6">Tidak ada lembar pengiriman yang bisa dicetak.</Typography>
			<Typography variant="body2" color="text.secondary">
				Pilih data dari halaman daftar lembar pengiriman terlebih dahulu.
			</Typography>
			<Button
				component={RouterLink}
				to="/dokumen/lembar-pengiriman"
				variant="outlined"
				startIcon={<ArrowBackOutlinedIcon />}
			>
				Kembali
			</Button>
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
			<Stack className="bulk-print-stack" sx={{ gap: '8mm' }}>
				{records.map((record, index) => (
					<Box
						key={record.id}
						className="slip-print-wrapper"
						sx={{
							borderBottom: '1px dashed',
							borderColor: 'divider',
							'&:last-of-type': { borderBottom: 0 },
						}}
					>
						<DeliverySlipPrintDocument
							slip={record}
							onReady={readyHandlers.get(record.id)}
							forceBreakAfterLast={index < records.length - 1}
						/>
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
						'.slip-print-wrapper': {
							display: 'block !important',
							margin: '0 !important',
							padding: '0 !important',
							border: '0 !important',
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
							Print A4 Lembar Pengiriman
						</Typography>
						<Typography variant="body2" color="text.secondary">
							{allReady
								? `${records.length} dokumen siap dicetak.`
								: `Menyiapkan ${readyIds.size}/${records.length} dokumen...`}
						</Typography>
					</Box>
					<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
						<Button
							component={RouterLink}
							to="/dokumen/lembar-pengiriman"
							variant="outlined"
							startIcon={<ArrowBackOutlinedIcon />}
						>
							Kembali
						</Button>
						<Button
							variant="contained"
							startIcon={<PrintOutlinedIcon />}
							onClick={handleManualPrint}
							disabled={loading || records.length === 0}
						>
							Print A4
						</Button>
					</Stack>
				</Stack>
				{preparationTimedOut && !allReady ? (
					<Alert severity="info" className="no-print">
						Sebagian dokumen belum selesai disiapkan. Tekan tombol Print A4 untuk mencetak.
					</Alert>
				) : null}
				{content}
			</Stack>
		</>
	);
}

export default LembarPengirimanBulkPrintPage;
