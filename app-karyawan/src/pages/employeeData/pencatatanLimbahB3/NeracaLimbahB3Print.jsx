import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';

import { getNeracaKlhk } from '@/services/b3WasteService';

function formatAngka(value) {
	if (value == null || Number.isNaN(Number(value))) return '0,00';
	return Number(value).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const borderCell = {
	border: '1px solid #000',
	padding: '3px 5px',
	verticalAlign: 'top',
	fontSize: '11px',
};

function NeracaLimbahB3Print() {
	const [searchParams] = useSearchParams();
	const tahun = Number(searchParams.get('tahun'));
	const triwulan = Number(searchParams.get('triwulan'));
	const siteId = Number(searchParams.get('siteId'));

	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	const fetchData = useCallback(async () => {
		if (!tahun || !triwulan) {
			setError('Parameter tahun dan triwulan tidak lengkap.');
			setLoading(false);
			return;
		}

		setLoading(true);
		try {
			const result = await getNeracaKlhk(Number.isFinite(siteId) ? siteId : null, tahun, triwulan);
			setData(result);
			setError('');
		} catch (err) {
			setError(err.message || 'Gagal memuat neraca limbah B3.');
		} finally {
			setLoading(false);
		}
	}, [tahun, triwulan, siteId]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	useEffect(() => {
		if (!loading && data) {
			const timer = window.setTimeout(() => window.print(), 500);
			return () => window.clearTimeout(timer);
		}

		return undefined;
	}, [loading, data]);

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

	const profile = data?.profil || {};
	const skalaWaktuText = (data?.skalaWaktu || [])
		.map((item) => `${item.nama} — ${item.maksimalHari} hari`)
		.join('; ');
	const kinerjaText = data?.kinerjaPercent == null ? '..................%' : `${formatAngka(data.kinerjaPercent)}%`;

	return (
		<Box sx={{ backgroundColor: '#f3f4f6', minHeight: '100vh', py: 3 }}>
			<Box
				sx={{
					mx: 'auto',
					width: '210mm',
					minHeight: '297mm',
					backgroundColor: '#fff',
					color: '#000',
					p: '12mm',
					boxShadow: 2,
					'@media print': {
						boxShadow: 'none',
						margin: 0,
						width: 'auto',
						minHeight: 'auto',
						p: 0,
					},
				}}
			>
				<Stack
					direction="row"
					justifyContent="flex-end"
					spacing={1}
					sx={{ mb: 2, '@media print': { display: 'none' } }}
				>
					<Button variant="contained" startIcon={<PrintOutlinedIcon />} onClick={() => window.print()}>
						Cetak
					</Button>
					<Button variant="outlined" onClick={() => window.close()}>
						Tutup
					</Button>
				</Stack>

				<Typography sx={{ textAlign: 'center', fontWeight: 700, fontSize: '14px', mb: 2 }}>
					FORMAT NERACA LIMBAH B3
				</Typography>

				<Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', mb: 1 }}>
					<Box component="tbody">
						<Box component="tr">
							<Box component="td" sx={{ ...borderCell, width: '28%' }}>
								Nama Perusahaan
							</Box>
							<Box component="td" sx={borderCell} colSpan={4}>
								{profile.companyName || '-'}
							</Box>
						</Box>
						<Box component="tr">
							<Box component="td" sx={borderCell}>
								Bidang Usaha
							</Box>
							<Box component="td" sx={borderCell} colSpan={4}>
								{profile.businessField || '-'}
							</Box>
						</Box>
						<Box component="tr">
							<Box component="td" sx={borderCell}>
								Periode Waktu
							</Box>
							<Box component="td" sx={borderCell} colSpan={4}>
								{data?.periodeLabel || '-'}
							</Box>
						</Box>
					</Box>
				</Box>

				<Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
					<Box component="thead">
						<Box component="tr">
							<Box
								component="th"
								sx={{ ...borderCell, width: '4%', textAlign: 'center', fontWeight: 700 }}
							/>
							<Box component="th" sx={{ ...borderCell, width: '30%', fontWeight: 700 }}>
								JENIS AWAL LIMBAH
							</Box>
							<Box
								component="th"
								sx={{ ...borderCell, width: '14%', fontWeight: 700, textAlign: 'center' }}
							>
								JUMLAH
								<br />
								(TON)
							</Box>
							<Box component="th" sx={{ ...borderCell, fontWeight: 700 }}>
								CATATAN :
							</Box>
							<Box
								component="th"
								sx={{ ...borderCell, width: '12%', fontWeight: 700, textAlign: 'center' }}
							>
								PERSETUJUAN
								<br />
								LINGKUNGAN
							</Box>
						</Box>
					</Box>
					<Box component="tbody">
						{/* Bagian I */}
						{(data?.sectionA || []).length === 0 && (
							<Box component="tr">
								<Box component="td" sx={{ ...borderCell, textAlign: 'center', fontWeight: 700 }}>
									I
								</Box>
								<Box component="td" sx={borderCell} colSpan={4}>
									-
								</Box>
							</Box>
						)}
						{(data?.sectionA || []).map((row, index) => (
							<Box component="tr" key={`a-${row.jenisLimbahId}`}>
								<Box component="td" sx={{ ...borderCell, textAlign: 'center', fontWeight: 700 }}>
									{index === 0 ? 'I' : ''}
								</Box>
								<Box component="td" sx={borderCell}>
									{row.kode} — {row.nama}
								</Box>
								<Box component="td" sx={{ ...borderCell, textAlign: 'right' }}>
									{formatAngka(row.jumlahTon)}
								</Box>
								<Box component="td" sx={borderCell} />
								<Box component="td" sx={{ ...borderCell, textAlign: 'center' }} />
							</Box>
						))}
						<Box component="tr">
							<Box component="td" sx={borderCell} />
							<Box component="td" sx={{ ...borderCell, fontWeight: 700 }}>
								TOTAL
							</Box>
							<Box component="td" sx={{ ...borderCell, textAlign: 'right', fontWeight: 700 }}>
								A (+) {formatAngka(data?.totalATon)}
							</Box>
							<Box component="td" sx={borderCell} colSpan={2} />
						</Box>

						{/* Bagian II */}
						<Box component="tr">
							<Box component="td" sx={{ ...borderCell, textAlign: 'center', fontWeight: 700 }}>
								II
							</Box>
							<Box component="td" sx={{ ...borderCell, fontWeight: 700 }}>
								PERLAKUAN
							</Box>
							<Box component="td" sx={{ ...borderCell, fontWeight: 700, textAlign: 'center' }}>
								JUMLAH
								<br />
								(TON)
							</Box>
							<Box component="td" sx={{ ...borderCell, fontWeight: 700 }}>
								JENIS LIMBAH YANG DIKELOLA
							</Box>
							<Box component="td" sx={{ ...borderCell, fontWeight: 700, textAlign: 'center' }}>
								PERSETUJUAN LINGKUNGAN
								<br />
								ADA / TIDAK ADA
							</Box>
						</Box>

						{(data?.sectionB || []).length === 0 && (
							<Box component="tr">
								<Box component="td" sx={borderCell} colSpan={5}>
									-
								</Box>
							</Box>
						)}

						{(data?.sectionB || []).map((group) =>
							group.items.map((item, itemIndex) => (
								<Box component="tr" key={`b-${group.perlakuan}-${item.jenisLimbahId}`}>
									<Box component="td" sx={borderCell} />
									<Box component="td" sx={{ ...borderCell, fontWeight: itemIndex === 0 ? 700 : 400 }}>
										{itemIndex === 0 ? group.label : ''}
									</Box>
									<Box component="td" sx={{ ...borderCell, textAlign: 'right' }}>
										{itemIndex === 0 ? formatAngka(group.totalTon) : ''}
									</Box>
									<Box component="td" sx={borderCell}>
										{item.kode} — {item.nama} ({formatAngka(item.jumlahTon)} ton)
									</Box>
									<Box component="td" sx={{ ...borderCell, textAlign: 'center' }}>
										{item.hasEnvironmentalApproval ? 'ADA' : 'TIDAK ADA'}
									</Box>
								</Box>
							)),
						)}

						<Box component="tr">
							<Box component="td" sx={borderCell} />
							<Box component="td" sx={{ ...borderCell, fontWeight: 700 }}>
								TOTAL
							</Box>
							<Box component="td" sx={{ ...borderCell, textAlign: 'right', fontWeight: 700 }}>
								B (-) {formatAngka(data?.totalBTon)}
							</Box>
							<Box component="td" sx={borderCell} colSpan={2} />
						</Box>

						{/* Rekap */}
						<Box component="tr">
							<Box component="td" sx={borderCell} colSpan={2}>
								RESIDU *
							</Box>
							<Box component="td" sx={{ ...borderCell, textAlign: 'right', fontWeight: 700 }} colSpan={3}>
								C (+) {formatAngka(data?.residuTon)} TON
							</Box>
						</Box>
						<Box component="tr">
							<Box component="td" sx={borderCell} colSpan={2}>
								JUMLAH LIMBAH YANG BELUM TERKELOLA **
							</Box>
							<Box component="td" sx={{ ...borderCell, textAlign: 'right', fontWeight: 700 }} colSpan={3}>
								D (+) {formatAngka(data?.belumTerkelolaTon)} TON
							</Box>
						</Box>
						<Box component="tr">
							<Box component="td" sx={borderCell} colSpan={2}>
								TOTAL JUMLAH LIMBAH YANG TERSISA **
							</Box>
							<Box component="td" sx={{ ...borderCell, textAlign: 'right', fontWeight: 700 }} colSpan={3}>
								(C + D) {formatAngka(data?.totalTersisaTon)} TON
							</Box>
						</Box>
						<Box component="tr">
							<Box component="td" sx={borderCell} colSpan={2}>
								KINERJA PENGELOLAAN LB3 SELAMA PERIODE
							</Box>
							<Box component="td" sx={{ ...borderCell, textAlign: 'right', fontWeight: 700 }} colSpan={3}>
								{`{ [A - (C + D)] / A } x 100% = ${kinerjaText}`}
							</Box>
						</Box>
						<Box component="tr">
							<Box component="td" sx={borderCell} colSpan={2}>
								SKALA WAKTU PENATAAN
							</Box>
							<Box component="td" sx={borderCell} colSpan={3}>
								{skalaWaktuText || '-'}
							</Box>
						</Box>
						{data?.catatan ? (
							<Box component="tr">
								<Box component="td" sx={borderCell} colSpan={2}>
									CATATAN
								</Box>
								<Box component="td" sx={{ ...borderCell, whiteSpace: 'pre-wrap' }} colSpan={3}>
									{data.catatan}
								</Box>
							</Box>
						) : null}
					</Box>
				</Box>

				<Box sx={{ mt: 1.5, fontSize: '10px', lineHeight: 1.5 }}>
					<Typography sx={{ fontSize: '11px', fontWeight: 700 }}>KETERANGAN :</Typography>
					<Typography sx={{ fontSize: '10px' }}>
						* RESIDU adalah jumlah limbah tersisa dari proses perlakuan seperti abu insenerator, bottom ash
						dan atau fly ash dari pemanfaatan sludge oil di boiler, residu dari penyimpanan oli bekas dll
					</Typography>
					<Typography sx={{ fontSize: '10px' }}>
						** JUMLAH LIMBAH YANG BELUM TERKELOLA adalah limbah yang disimpan melebihi skala waktu penaatan.
					</Typography>
				</Box>

				<Stack direction="row" justifyContent="flex-end" sx={{ mt: 4 }}>
					<Box sx={{ textAlign: 'center', minWidth: '60mm' }}>
						<Typography sx={{ fontSize: '11px' }}>
							{(profile.address || '').split('\n').map((line, index) => (
								// eslint-disable-next-line react/no-array-index-key
								<span key={`address-${index}`}>
									{line}
									<br />
								</span>
							))}
						</Typography>
						<Typography sx={{ fontSize: '11px', mt: 3 }}>
							{profile.responsibleName || '......................'}
						</Typography>
					</Box>
				</Stack>
			</Box>
		</Box>
	);
}

export default NeracaLimbahB3Print;
