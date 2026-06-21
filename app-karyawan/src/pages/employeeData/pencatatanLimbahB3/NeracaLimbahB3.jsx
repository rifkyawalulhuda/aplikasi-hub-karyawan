import { useCallback, useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';

import Breadcrumbs from '@mui/material/Breadcrumbs';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CircularProgress from '@mui/material/CircularProgress';
import Link from '@mui/material/Link';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';

import CardHeader from '@/components/cardHeader';
import PageHeader from '@/components/pageHeader';
import { useSite } from '@/contexts/siteContext';
import { exportNeracaLimbah, getNeracaLimbah } from '@/services/b3WasteService';

// --- Helpers ---

function formatAngka(value) {
	if (value == null || Number.isNaN(Number(value))) return '';
	const num = Number(value);
	return num.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getCurrentTriwulan() {
	return Math.ceil((new Date().getMonth() + 1) / 3);
}

// --- Constants ---

const TRIWULAN_OPTIONS = [
	{ value: 1, label: 'Q1 (Januari - Maret)' },
	{ value: 2, label: 'Q2 (April - Juni)' },
	{ value: 3, label: 'Q3 (Juli - September)' },
	{ value: 4, label: 'Q4 (Oktober - Desember)' },
];

function generateTahunOptions() {
	const currentYear = new Date().getFullYear();
	const options = [];
	for (let y = currentYear; y >= 2020; y -= 1) {
		options.push(y);
	}
	return options;
}

function NeracaLimbahB3() {
	const { enqueueSnackbar } = useSnackbar();
	const { currentSiteId } = useSite();

	const [tahun, setTahun] = useState(new Date().getFullYear());
	const [triwulan, setTriwulan] = useState(getCurrentTriwulan());
	const [loading, setLoading] = useState(false);
	const [data, setData] = useState(null);
	const [exporting, setExporting] = useState(false);

	const fetchNeraca = useCallback(async () => {
		if (!currentSiteId) return;

		setLoading(true);
		try {
			const result = await getNeracaLimbah(currentSiteId, tahun, triwulan);
			setData(result);
		} catch (err) {
			enqueueSnackbar(err.message || 'Gagal memuat data neraca', { variant: 'error' });
			setData(null);
		} finally {
			setLoading(false);
		}
	}, [currentSiteId, tahun, triwulan, enqueueSnackbar]);

	useEffect(() => {
		fetchNeraca();
	}, [fetchNeraca]);

	const handleExport = async () => {
		if (!currentSiteId) return;
		setExporting(true);
		try {
			await exportNeracaLimbah(currentSiteId, tahun, triwulan);
			enqueueSnackbar('Berhasil mengunduh file Excel', { variant: 'success' });
		} catch (err) {
			enqueueSnackbar(err.message || 'Gagal mengunduh file', { variant: 'error' });
		} finally {
			setExporting(false);
		}
	};

	const tahunOptions = generateTahunOptions();

	return (
		<>
			<PageHeader>
				<Breadcrumbs aria-label="breadcrumb">
					<Link underline="hover" color="inherit" href="/limbah-b3/pencatatan">
						LIMBAH B3
					</Link>
					<Typography color="text.primary">NERACA LIMBAH B3</Typography>
				</Breadcrumbs>
			</PageHeader>

			<Card sx={{ p: 0 }}>
				<CardHeader title="NERACA LIMBAH B3" subtitle="Neraca limbah B3 per triwulan sesuai format KLHK" />

				<Stack spacing={2} sx={{ p: 2 }}>
					{/* Filter controls */}
					<Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
						<TextField
							select
							label="Tahun"
							value={tahun}
							onChange={(e) => setTahun(Number(e.target.value))}
							size="small"
							sx={{ minWidth: 120 }}
						>
							{tahunOptions.map((y) => (
								<MenuItem key={y} value={y}>
									{y}
								</MenuItem>
							))}
						</TextField>

						<TextField
							select
							label="Triwulan"
							value={triwulan}
							onChange={(e) => setTriwulan(Number(e.target.value))}
							size="small"
							sx={{ minWidth: 220 }}
						>
							{TRIWULAN_OPTIONS.map((opt) => (
								<MenuItem key={opt.value} value={opt.value}>
									{opt.label}
								</MenuItem>
							))}
						</TextField>

						<Button
							variant="outlined"
							startIcon={exporting ? <CircularProgress size={16} /> : <DownloadOutlinedIcon />}
							onClick={handleExport}
							disabled={exporting || !currentSiteId || !data?.data?.length}
						>
							Ekspor Excel
						</Button>
					</Stack>

					{/* Content */}
					{!currentSiteId && (
						<Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
							Silakan pilih site terlebih dahulu
						</Typography>
					)}

					{currentSiteId && loading && (
						<Stack alignItems="center" sx={{ py: 4 }}>
							<CircularProgress />
						</Stack>
					)}

					{currentSiteId && !loading && data && data.data?.length === 0 && (
						<Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
							Tidak ada data neraca untuk periode ini
						</Typography>
					)}

					{currentSiteId && !loading && data && data.data?.length > 0 && (
						<>
							<Typography variant="body2" color="text.secondary">
								Periode: {data.periodeLabel}
							</Typography>

							<TableContainer component={Paper} variant="outlined">
								<Table size="small">
									<TableHead>
										<TableRow>
											<TableCell align="center" sx={{ fontWeight: 'bold' }}>
												No
											</TableCell>
											<TableCell sx={{ fontWeight: 'bold' }}>Kode Limbah</TableCell>
											<TableCell sx={{ fontWeight: 'bold' }}>Jenis Limbah B3</TableCell>
											<TableCell align="right" sx={{ fontWeight: 'bold' }}>
												Saldo Awal (kg)
											</TableCell>
											<TableCell align="right" sx={{ fontWeight: 'bold' }}>
												Masuk (kg)
											</TableCell>
											<TableCell align="right" sx={{ fontWeight: 'bold' }}>
												Keluar (kg)
											</TableCell>
											<TableCell align="right" sx={{ fontWeight: 'bold' }}>
												Saldo Akhir (kg)
											</TableCell>
											<TableCell sx={{ fontWeight: 'bold' }}>Pengelola</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{data.data.map((row, idx) => (
											<TableRow key={row.jenisLimbah.id}>
												<TableCell align="center">{idx + 1}</TableCell>
												<TableCell>{row.jenisLimbah.kode}</TableCell>
												<TableCell>{row.jenisLimbah.nama}</TableCell>
												<TableCell align="right">{formatAngka(row.saldoAwal)}</TableCell>
												<TableCell align="right">{formatAngka(row.masuk)}</TableCell>
												<TableCell align="right">{formatAngka(row.keluar)}</TableCell>
												<TableCell align="right">{formatAngka(row.saldoAkhir)}</TableCell>
												<TableCell>
													{row.pengelola.map((p) => p.vendorName).join(', ') || '-'}
												</TableCell>
											</TableRow>
										))}
										{/* Total row */}
										<TableRow>
											<TableCell colSpan={3} align="center" sx={{ fontWeight: 'bold' }}>
												TOTAL
											</TableCell>
											<TableCell align="right" sx={{ fontWeight: 'bold' }}>
												{formatAngka(data.totalSaldoAwal)}
											</TableCell>
											<TableCell align="right" sx={{ fontWeight: 'bold' }}>
												{formatAngka(data.totalMasuk)}
											</TableCell>
											<TableCell align="right" sx={{ fontWeight: 'bold' }}>
												{formatAngka(data.totalKeluar)}
											</TableCell>
											<TableCell align="right" sx={{ fontWeight: 'bold' }}>
												{formatAngka(data.totalSaldoAkhir)}
											</TableCell>
											<TableCell />
										</TableRow>
									</TableBody>
								</Table>
							</TableContainer>
						</>
					)}
				</Stack>
			</Card>
		</>
	);
}

export default NeracaLimbahB3;
