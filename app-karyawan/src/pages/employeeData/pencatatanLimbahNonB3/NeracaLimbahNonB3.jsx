import { useCallback, useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import CardHeader from '@/components/cardHeader';
import { useSite } from '@/contexts/siteContext';
import { getNonB3Neraca } from '@/services/nonB3WasteService';

const BULAN_OPTIONS = [
	{ value: 1, label: 'Januari' },
	{ value: 2, label: 'Februari' },
	{ value: 3, label: 'Maret' },
	{ value: 4, label: 'April' },
	{ value: 5, label: 'Mei' },
	{ value: 6, label: 'Juni' },
	{ value: 7, label: 'Juli' },
	{ value: 8, label: 'Agustus' },
	{ value: 9, label: 'September' },
	{ value: 10, label: 'Oktober' },
	{ value: 11, label: 'November' },
	{ value: 12, label: 'Desember' },
];

function getCurrentBulan() {
	return new Date().getMonth() + 1;
}

function generateTahunOptions() {
	const currentYear = new Date().getFullYear();
	const options = [];
	for (let year = currentYear; year >= 2020; year -= 1) {
		options.push(year);
	}
	return options;
}

function formatAngka(value) {
	if (value == null || Number.isNaN(Number(value))) return '0,000';
	return Number(value).toLocaleString('id-ID', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

function NeracaLimbahNonB3() {
	const { enqueueSnackbar } = useSnackbar();
	const { currentSiteId } = useSite();

	const [tahun, setTahun] = useState(new Date().getFullYear());
	const [bulan, setBulan] = useState(getCurrentBulan());
	const [loading, setLoading] = useState(false);
	const [data, setData] = useState(null);

	const fetchNeraca = useCallback(async () => {
		if (!currentSiteId) {
			setData(null);
			return;
		}

		setLoading(true);
		try {
			const result = await getNonB3Neraca(currentSiteId, tahun, bulan);
			setData(result);
		} catch (err) {
			enqueueSnackbar(err.message || 'Gagal memuat neraca limbah non-B3', { variant: 'error' });
			setData(null);
		} finally {
			setLoading(false);
		}
	}, [currentSiteId, tahun, bulan, enqueueSnackbar]);

	useEffect(() => {
		fetchNeraca();
	}, [fetchNeraca]);

	const rows = data?.rows || [];
	const tahunOptions = generateTahunOptions();

	return (
		<Card sx={{ minHeight: '60vh', p: 3 }}>
			<CardHeader
				title="Neraca Limbah Non-B3"
				subtitle="Rekap limbah non-B3 masuk dan keluar per bulan."
				size="small"
				sx={{ flexDirection: 'column', alignItems: 'stretch', gap: 2, mb: 2.5 }}
			>
				<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
					<TextField
						select
						size="small"
						label="Tahun"
						value={tahun}
						onChange={(event) => setTahun(Number(event.target.value))}
						sx={{ minWidth: 140 }}
					>
						{tahunOptions.map((option) => (
							<MenuItem key={option} value={option}>
								{option}
							</MenuItem>
						))}
					</TextField>
					<TextField
						select
						size="small"
						label="Bulan"
						value={bulan}
						onChange={(event) => setBulan(Number(event.target.value))}
						sx={{ minWidth: 200 }}
					>
						{BULAN_OPTIONS.map((option) => (
							<MenuItem key={option.value} value={option.value}>
								{option.label}
							</MenuItem>
						))}
					</TextField>
				</Stack>
			</CardHeader>

			{!currentSiteId ? (
				<Stack py={8} alignItems="center" spacing={1}>
					<Typography variant="h6">Pilih site terlebih dahulu</Typography>
					<Typography variant="body2" color="text.secondary">
						Silakan pilih site pada selektor di bagian atas.
					</Typography>
				</Stack>
			) : null}
			{currentSiteId && loading ? (
				<Stack alignItems="center" justifyContent="center" py={10}>
					<CircularProgress />
				</Stack>
			) : null}
			{currentSiteId && !loading ? (
				<>
					<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
						Periode: {data?.periodeLabel || '-'}
					</Typography>

					<TableContainer>
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell sx={{ fontWeight: 700 }}>Kode</TableCell>
									<TableCell sx={{ fontWeight: 700 }}>Jenis Limbah</TableCell>
									<TableCell align="right" sx={{ fontWeight: 700 }}>
										Masuk (Ton)
									</TableCell>
									<TableCell align="right" sx={{ fontWeight: 700 }}>
										Keluar (Ton)
									</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{rows.length === 0 ? (
									<TableRow>
										<TableCell colSpan={4} align="center" sx={{ py: 6, color: 'text.secondary' }}>
											Belum ada limbah non-B3 masuk atau keluar pada periode ini.
										</TableCell>
									</TableRow>
								) : (
									rows.map((row) => (
										<TableRow key={row.kode} hover>
											<TableCell>{row.kode}</TableCell>
											<TableCell>{row.nama}</TableCell>
											<TableCell align="right">{formatAngka(row.masukTon)}</TableCell>
											<TableCell align="right">{formatAngka(row.keluarTon)}</TableCell>
										</TableRow>
									))
								)}
								<TableRow>
									<TableCell colSpan={2} sx={{ fontWeight: 700 }}>
										TOTAL
									</TableCell>
									<TableCell align="right" sx={{ fontWeight: 700 }}>
										{formatAngka(data?.totalMasukTon)}
									</TableCell>
									<TableCell align="right" sx={{ fontWeight: 700 }}>
										{formatAngka(data?.totalKeluarTon)}
									</TableCell>
								</TableRow>
							</TableBody>
						</Table>
					</TableContainer>

					<Box sx={{ mt: 2 }}>
						<Typography variant="body2" fontWeight={600}>
							Saldo (masuk - keluar): {formatAngka(data?.saldoTon)} Ton
						</Typography>
					</Box>
				</>
			) : null}
		</Card>
	);
}

export default NeracaLimbahNonB3;
