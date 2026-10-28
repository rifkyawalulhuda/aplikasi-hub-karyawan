import { useCallback, useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';

import Breadcrumbs from '@mui/material/Breadcrumbs';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
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

import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';

import CardHeader from '@/components/cardHeader';
import PageHeader from '@/components/pageHeader';
import { useSite } from '@/contexts/siteContext';
import {
	exportNeracaLimbah,
	getNeracaKlhk,
	getNeracaLimbah,
	getSiteProfile,
	saveNeracaPeriod,
	saveSiteProfile,
} from '@/services/b3WasteService';

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

const EMPTY_PROFILE = {
	companyName: '',
	businessField: '',
	address: '',
	phoneNumber: '',
	responsibleName: '',
};

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
	const [klhk, setKlhk] = useState(null);
	const [exporting, setExporting] = useState(false);
	const [residuInput, setResiduInput] = useState('');
	const [catatanInput, setCatatanInput] = useState('');
	const [savingPeriod, setSavingPeriod] = useState(false);
	const [profileOpen, setProfileOpen] = useState(false);
	const [profileForm, setProfileForm] = useState(EMPTY_PROFILE);
	const [savingProfile, setSavingProfile] = useState(false);

	const fetchNeraca = useCallback(async () => {
		if (!currentSiteId) return;

		setLoading(true);
		try {
			const [result, klhkResult] = await Promise.all([
				getNeracaLimbah(currentSiteId, tahun, triwulan),
				getNeracaKlhk(currentSiteId, tahun, triwulan),
			]);
			setData(result);
			setKlhk(klhkResult);
			setResiduInput(klhkResult?.residuTon != null ? String(klhkResult.residuTon) : '0');
			setCatatanInput(klhkResult?.catatan || '');
		} catch (err) {
			enqueueSnackbar(err.message || 'Gagal memuat data neraca', { variant: 'error' });
			setData(null);
			setKlhk(null);
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

	const handleSavePeriod = async () => {
		if (!currentSiteId) return;

		const residu = Number(residuInput);
		if (!Number.isFinite(residu) || residu < 0) {
			enqueueSnackbar('Residu harus berupa angka 0 atau lebih', { variant: 'error' });
			return;
		}

		setSavingPeriod(true);
		try {
			await saveNeracaPeriod(currentSiteId, { tahun, triwulan, residu, catatan: catatanInput });
			enqueueSnackbar('Residu dan catatan periode berhasil disimpan', { variant: 'success' });
			await fetchNeraca();
		} catch (err) {
			enqueueSnackbar(err.message || 'Gagal menyimpan residu periode', { variant: 'error' });
		} finally {
			setSavingPeriod(false);
		}
	};

	const handleOpenProfile = async () => {
		if (!currentSiteId) return;

		setProfileOpen(true);
		try {
			const profile = await getSiteProfile(currentSiteId);
			setProfileForm({
				companyName: profile?.companyName || '',
				businessField: profile?.businessField || '',
				address: profile?.address || '',
				phoneNumber: profile?.phoneNumber || '',
				responsibleName: profile?.responsibleName || '',
			});
		} catch {
			setProfileForm(EMPTY_PROFILE);
		}
	};

	const handleSaveProfile = async () => {
		if (!currentSiteId) return;

		if (!profileForm.companyName.trim() || !profileForm.businessField.trim()) {
			enqueueSnackbar('Nama perusahaan dan bidang usaha wajib diisi', { variant: 'error' });
			return;
		}

		setSavingProfile(true);
		try {
			await saveSiteProfile(currentSiteId, profileForm);
			enqueueSnackbar('Profil perusahaan berhasil disimpan', { variant: 'success' });
			setProfileOpen(false);
			await fetchNeraca();
		} catch (err) {
			enqueueSnackbar(err.message || 'Gagal menyimpan profil perusahaan', { variant: 'error' });
		} finally {
			setSavingProfile(false);
		}
	};

	const handlePrint = () => {
		if (!currentSiteId) return;

		const params = new URLSearchParams({
			tahun: String(tahun),
			triwulan: String(triwulan),
			siteId: String(currentSiteId),
		});
		window.open(`/print/limbah-b3/neraca?${params.toString()}`, '_blank');
	};

	const tahunOptions = generateTahunOptions();
	const hasAnyData = Boolean(klhk && (klhk.sectionA.length > 0 || klhk.sectionB.length > 0));

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
							startIcon={<BusinessOutlinedIcon />}
							onClick={handleOpenProfile}
							disabled={!currentSiteId}
						>
							Profil Perusahaan
						</Button>

						<Button
							variant="outlined"
							startIcon={exporting ? <CircularProgress size={16} /> : <DownloadOutlinedIcon />}
							onClick={handleExport}
							disabled={exporting || !currentSiteId || !data?.data?.length}
						>
							Ekspor Excel
						</Button>

						<Button
							variant="contained"
							startIcon={<PrintOutlinedIcon />}
							onClick={handlePrint}
							disabled={!currentSiteId || loading}
						>
							Cetak Dokumen
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

					{/* Ringkasan format dokumen KLHK */}
					{currentSiteId && !loading && klhk && (
						<>
							<Divider sx={{ mt: 1 }} />
							<Typography variant="subtitle1" fontWeight={600}>
								Ringkasan Format Neraca Limbah B3
							</Typography>

							{!hasAnyData && (
								<Typography variant="body2" color="text.secondary">
									Belum ada limbah masuk/keluar pada periode ini. Residu dan catatan tetap dapat
									disimpan.
								</Typography>
							)}

							<Grid container spacing={2}>
								<Grid item xs={12} md={6}>
									<Paper variant="outlined" sx={{ p: 2 }}>
										<Typography variant="subtitle2" fontWeight={700} gutterBottom>
											I. JENIS AWAL LIMBAH — TOTAL A
										</Typography>
										{klhk.sectionA.length === 0 && (
											<Typography variant="body2" color="text.secondary">
												-
											</Typography>
										)}
										{klhk.sectionA.map((row) => (
											<Stack
												key={row.jenisLimbahId}
												direction="row"
												justifyContent="space-between"
												spacing={2}
											>
												<Typography variant="body2">
													{row.kode} — {row.nama}
												</Typography>
												<Typography variant="body2">
													{formatAngka(row.jumlahTon)} ton
												</Typography>
											</Stack>
										))}
										<Divider sx={{ my: 1 }} />
										<Stack direction="row" justifyContent="space-between">
											<Typography variant="body2" fontWeight={700}>
												TOTAL A (+)
											</Typography>
											<Typography variant="body2" fontWeight={700}>
												{formatAngka(klhk.totalATon)} ton
											</Typography>
										</Stack>
									</Paper>
								</Grid>

								<Grid item xs={12} md={6}>
									<Paper variant="outlined" sx={{ p: 2 }}>
										<Typography variant="subtitle2" fontWeight={700} gutterBottom>
											II. PERLAKUAN
										</Typography>
										{klhk.sectionB.length === 0 && (
											<Typography variant="body2" color="text.secondary">
												-
											</Typography>
										)}
										{klhk.sectionB.map((group) => (
											<Stack key={group.perlakuan} spacing={0.5} sx={{ mb: 1 }}>
												<Stack direction="row" justifyContent="space-between">
													<Typography variant="body2" fontWeight={700}>
														{group.label}
													</Typography>
													<Typography variant="body2" fontWeight={700}>
														{formatAngka(group.totalTon)} ton
													</Typography>
												</Stack>
												{group.items.map((item) => (
													<Stack
														key={`${group.perlakuan}-${item.jenisLimbahId}`}
														direction="row"
														justifyContent="space-between"
														sx={{ pl: 2 }}
													>
														<Typography variant="caption" color="text.secondary">
															{item.kode} — {item.nama} (
															{item.hasEnvironmentalApproval ? 'ADA' : 'TIDAK ADA'})
														</Typography>
														<Typography variant="caption" color="text.secondary">
															{formatAngka(item.jumlahTon)} ton
														</Typography>
													</Stack>
												))}
											</Stack>
										))}
										<Divider sx={{ my: 1 }} />
										<Stack direction="row" justifyContent="space-between">
											<Typography variant="body2" fontWeight={700}>
												TOTAL B (-)
											</Typography>
											<Typography variant="body2" fontWeight={700}>
												{formatAngka(klhk.totalBTon)} ton
											</Typography>
										</Stack>
									</Paper>
								</Grid>
							</Grid>

							<Grid container spacing={2}>
								<Grid item xs={12} md={4}>
									<TextField
										fullWidth
										size="small"
										label="Residu / C (ton)"
										type="number"
										inputProps={{ min: 0, step: 0.01 }}
										value={residuInput}
										onChange={(event) => setResiduInput(event.target.value)}
									/>
								</Grid>
								<Grid item xs={12} md={4}>
									<TextField
										fullWidth
										size="small"
										label="Belum Terkelola / D (ton)"
										value={formatAngka(klhk.belumTerkelolaTon)}
										InputProps={{ readOnly: true }}
									/>
								</Grid>
								<Grid item xs={12} md={4}>
									<TextField
										fullWidth
										size="small"
										label="Total Tersisa (C + D) (ton)"
										value={formatAngka(
											Number(residuInput || 0) + Number(klhk.belumTerkelolaTon || 0),
										)}
										InputProps={{ readOnly: true }}
									/>
								</Grid>
							</Grid>

							<Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
								<Typography variant="body2">
									Kinerja Pengelolaan LB3:{' '}
									{klhk.kinerjaPercent == null ? '-' : `${formatAngka(klhk.kinerjaPercent)}%`}
								</Typography>
								{klhk.skalaWaktu.length > 0 && (
									<Typography variant="body2" color="text.secondary">
										Skala waktu penataan:{' '}
										{klhk.skalaWaktu
											.map((item) => `${item.nama} ${item.maksimalHari} hari`)
											.join('; ')}
									</Typography>
								)}
							</Stack>

							<TextField
								fullWidth
								size="small"
								label="Catatan"
								multiline
								minRows={2}
								inputProps={{ maxLength: 2000 }}
								value={catatanInput}
								onChange={(event) => setCatatanInput(event.target.value)}
							/>

							<Stack direction="row" justifyContent="flex-end">
								<Button
									variant="contained"
									startIcon={savingPeriod ? <CircularProgress size={16} /> : <SaveOutlinedIcon />}
									onClick={handleSavePeriod}
									disabled={savingPeriod}
								>
									Simpan Residu & Catatan
								</Button>
							</Stack>
						</>
					)}
				</Stack>
			</Card>

			{/* Profil Perusahaan Dialog */}
			<Dialog
				open={profileOpen}
				onClose={savingProfile ? undefined : () => setProfileOpen(false)}
				fullWidth
				maxWidth="sm"
			>
				<DialogTitle>Profil Perusahaan</DialogTitle>
				<DialogContent>
					<Stack spacing={2} sx={{ mt: 1 }}>
						<TextField
							fullWidth
							label="Nama Perusahaan"
							value={profileForm.companyName}
							onChange={(event) =>
								setProfileForm((current) => ({ ...current, companyName: event.target.value }))
							}
							inputProps={{ maxLength: 255 }}
							required
						/>
						<TextField
							fullWidth
							label="Bidang Usaha"
							value={profileForm.businessField}
							onChange={(event) =>
								setProfileForm((current) => ({ ...current, businessField: event.target.value }))
							}
							inputProps={{ maxLength: 255 }}
							required
						/>
						<TextField
							fullWidth
							label="Alamat"
							multiline
							minRows={2}
							value={profileForm.address}
							onChange={(event) =>
								setProfileForm((current) => ({ ...current, address: event.target.value }))
							}
						/>
						<TextField
							fullWidth
							label="Telepon"
							value={profileForm.phoneNumber}
							onChange={(event) =>
								setProfileForm((current) => ({ ...current, phoneNumber: event.target.value }))
							}
						/>
						<TextField
							fullWidth
							label="Penanggung Jawab"
							value={profileForm.responsibleName}
							onChange={(event) =>
								setProfileForm((current) => ({ ...current, responsibleName: event.target.value }))
							}
						/>
					</Stack>
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 3 }}>
					<Button onClick={() => setProfileOpen(false)} disabled={savingProfile} color="inherit">
						Batal
					</Button>
					<Button type="button" variant="contained" onClick={handleSaveProfile} disabled={savingProfile}>
						{savingProfile ? 'Menyimpan...' : 'Simpan'}
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}

export default NeracaLimbahB3;
