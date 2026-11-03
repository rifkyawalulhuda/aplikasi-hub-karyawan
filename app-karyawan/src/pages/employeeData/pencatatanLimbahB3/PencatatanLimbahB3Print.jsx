import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import CatatanPengelolaanLimbahDocument from '@/components/dokumen/catatanPengelolaanLimbahDocument';
import { getPencatatanPrint } from '@/services/b3WasteService';

const FORM_NO = 'SII-QSHE-035-03';

function PencatatanLimbahB3Print() {
	const [searchParams] = useSearchParams();
	const siteId = Number(searchParams.get('siteId'));
	const from = searchParams.get('from') || '';
	const to = searchParams.get('to') || '';
	const periodeText = searchParams.get('periode') || '';
	const lokasiKerja = searchParams.get('lokasiKerja') || '';
	const penanggungJawab = searchParams.get('penanggungJawab') || '';
	const dibuatOleh = searchParams.get('dibuatOleh') || '';
	const diperiksaOleh = searchParams.get('diperiksaOleh') || '';
	const diketahuiOleh = searchParams.get('diketahuiOleh') || '';
	const catatan = searchParams.get('catatan') || '';

	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	const fetchData = useCallback(async () => {
		if (!Number.isFinite(siteId) || !siteId) {
			setError('Parameter site tidak valid.');
			setLoading(false);
			return;
		}

		setLoading(true);
		try {
			const result = await getPencatatanPrint(siteId, { from, to });
			setData(result);
			setError('');
		} catch (err) {
			setError(err.message || 'Gagal memuat data pencatatan limbah B3.');
		} finally {
			setLoading(false);
		}
	}, [siteId, from, to]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

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
		<CatatanPengelolaanLimbahDocument
			rows={data?.rows || []}
			keterangan={data?.keterangan || []}
			formNo={FORM_NO}
			keteranganTitle="Jenis Limbah B3"
			documentLabel="No. e-Manifest"
			documentField="nomorEManifest"
			periode={periodeText}
			lokasiKerja={lokasiKerja}
			penanggungJawab={penanggungJawab}
			dibuatOleh={dibuatOleh}
			diperiksaOleh={diperiksaOleh}
			diketahuiOleh={diketahuiOleh}
			catatan={catatan}
		/>
	);
}

export default PencatatanLimbahB3Print;
