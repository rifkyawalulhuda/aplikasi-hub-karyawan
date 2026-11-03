import { useEffect, useMemo, useRef, useState } from 'react';

import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';

const MONTH_LABELS = [
	'Januari',
	'Februari',
	'Maret',
	'April',
	'Mei',
	'Juni',
	'Juli',
	'Agustus',
	'September',
	'Oktober',
	'November',
	'Desember',
];

function toInputDate(date) {
	const yyyy = date.getFullYear();
	const mm = String(date.getMonth() + 1).padStart(2, '0');
	const dd = String(date.getDate()).padStart(2, '0');
	return `${yyyy}-${mm}-${dd}`;
}

function formatPeriode(from, to) {
	if (!from && !to) return '';
	const format = (value) => {
		if (!value) return '';
		const [year, month, day] = value.split('-');
		return `${Number(day)} ${MONTH_LABELS[Number(month) - 1]} ${year}`;
	};
	if (from && to) return `${format(from)} s.d. ${format(to)}`;
	return format(from || to);
}

function getInitialPeriod() {
	const today = new Date();
	const start = new Date(today.getFullYear(), today.getMonth(), 1);
	return { from: toInputDate(start), to: toInputDate(today) };
}

export default function CetakPencatatanDialog({
	open,
	onClose,
	siteId,
	siteName = '',
	adminName = '',
	responsibleName = '',
}) {
	const initialPeriod = useMemo(() => getInitialPeriod(), []);
	const [from, setFrom] = useState(initialPeriod.from);
	const [to, setTo] = useState(initialPeriod.to);
	const [lokasiKerja, setLokasiKerja] = useState(siteName);
	const [penanggungJawab, setPenanggungJawab] = useState(adminName);
	const [dibuatOleh, setDibuatOleh] = useState(adminName);
	const [diperiksaOleh, setDiperiksaOleh] = useState('');
	const [diketahuiOleh, setDiketahuiOleh] = useState(responsibleName);
	const [catatan, setCatatan] = useState('');
	const [error, setError] = useState('');
	const [opening, setOpening] = useState(false);
	const wasOpenRef = useRef(false);

	useEffect(() => {
		if (open && !wasOpenRef.current) {
			const period = getInitialPeriod();
			setFrom(period.from);
			setTo(period.to);
			setLokasiKerja(siteName);
			setPenanggungJawab(adminName);
			setDibuatOleh(adminName);
			setDiperiksaOleh('');
			setDiketahuiOleh(responsibleName);
			setCatatan('');
			setError('');
			setOpening(false);
		}

		wasOpenRef.current = open;
	}, [open, siteName, adminName, responsibleName]);

	const handleSubmit = (event) => {
		event.preventDefault();

		if (!siteId) {
			setError('Site belum dipilih.');
			return;
		}
		if (from && to && from > to) {
			setError('Tanggal awal tidak boleh melebihi tanggal akhir.');
			return;
		}

		setOpening(true);
		const params = new URLSearchParams({
			siteId: String(siteId),
			from,
			to,
			periode: formatPeriode(from, to),
			lokasiKerja,
			penanggungJawab,
			dibuatOleh,
			diperiksaOleh,
			diketahuiOleh,
			catatan,
		});
		window.open(`/print/limbah-b3/pencatatan?${params.toString()}`, '_blank');
		setOpening(false);
		onClose?.();
	};

	return (
		<Dialog open={open} onClose={opening ? undefined : onClose} fullWidth maxWidth="sm">
			<DialogTitle>Cetak Catatan Pengelolaan Limbah</DialogTitle>
			<DialogContent>
				<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
					Form SII-QSHE-035-03. Baris dicetak per pengiriman limbah keluar pada periode tanggal masuk yang
					dipilih.
				</Typography>
				<Grid container spacing={2} component="form" id="cetak-pencatatan-form" onSubmit={handleSubmit}>
					<Grid item xs={12} sm={6}>
						<TextField
							fullWidth
							type="date"
							label="Periode Awal"
							value={from}
							onChange={(event) => setFrom(event.target.value)}
							InputLabelProps={{ shrink: true }}
						/>
					</Grid>
					<Grid item xs={12} sm={6}>
						<TextField
							fullWidth
							type="date"
							label="Periode Akhir"
							value={to}
							onChange={(event) => setTo(event.target.value)}
							InputLabelProps={{ shrink: true }}
						/>
					</Grid>
					<Grid item xs={12}>
						<TextField
							fullWidth
							label="Lokasi Kerja"
							value={lokasiKerja}
							onChange={(event) => setLokasiKerja(event.target.value)}
							inputProps={{ maxLength: 120 }}
						/>
					</Grid>
					<Grid item xs={12}>
						<TextField
							fullWidth
							label="Penanggung Jawab"
							value={penanggungJawab}
							onChange={(event) => setPenanggungJawab(event.target.value)}
							inputProps={{ maxLength: 120 }}
						/>
					</Grid>
					<Grid item xs={12} sm={4}>
						<TextField
							fullWidth
							label="Dibuat oleh"
							value={dibuatOleh}
							onChange={(event) => setDibuatOleh(event.target.value)}
							inputProps={{ maxLength: 120 }}
						/>
					</Grid>
					<Grid item xs={12} sm={4}>
						<TextField
							fullWidth
							label="Diperiksa oleh"
							value={diperiksaOleh}
							onChange={(event) => setDiperiksaOleh(event.target.value)}
							inputProps={{ maxLength: 120 }}
						/>
					</Grid>
					<Grid item xs={12} sm={4}>
						<TextField
							fullWidth
							label="Diketahui oleh"
							value={diketahuiOleh}
							onChange={(event) => setDiketahuiOleh(event.target.value)}
							inputProps={{ maxLength: 120 }}
						/>
					</Grid>
					<Grid item xs={12}>
						<TextField
							fullWidth
							multiline
							minRows={2}
							label="Catatan (opsional)"
							value={catatan}
							onChange={(event) => setCatatan(event.target.value)}
							inputProps={{ maxLength: 500 }}
						/>
					</Grid>
					{error ? (
						<Grid item xs={12}>
							<Typography color="error" variant="body2">
								{error}
							</Typography>
						</Grid>
					) : null}
				</Grid>
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 2 }}>
				<Button onClick={onClose} color="inherit">
					Batal
				</Button>
				<Button
					type="submit"
					form="cetak-pencatatan-form"
					variant="contained"
					startIcon={opening ? <CircularProgress size={18} /> : <PrintOutlinedIcon />}
					disabled={opening}
				>
					Buka Pratinjau Cetak
				</Button>
			</DialogActions>
		</Dialog>
	);
}
