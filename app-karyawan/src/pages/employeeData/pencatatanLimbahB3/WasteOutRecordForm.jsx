import { useMemo } from 'react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useSnackbar } from 'notistack';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';

import { createWasteOutRecord, updateWasteOutRecord } from '@/services/b3WasteService';

const getValidationSchema = (minDate, maxJumlah) =>
	yup.object({
		tanggalKeluar: yup
			.date()
			.required('Tanggal keluar wajib diisi')
			.min(minDate, 'Tanggal keluar tidak boleh sebelum tanggal masuk')
			.max(new Date(), 'Tanggal keluar tidak boleh melebihi hari ini'),
		jumlahKeluar: yup
			.number()
			.required('Jumlah keluar wajib diisi')
			.min(0.01, 'Jumlah keluar minimal 0.01')
			.max(maxJumlah, `Jumlah keluar maksimal ${maxJumlah}`),
		tujuanPenyerahan: yup
			.string()
			.required('Tujuan penyerahan wajib diisi')
			.max(200, 'Tujuan penyerahan maksimal 200 karakter'),
		nomorDokumen: yup
			.string()
			.required('Nomor dokumen wajib diisi')
			.max(100, 'Nomor dokumen maksimal 100 karakter'),
		petugasPenanggungJawab: yup
			.string()
			.required('Petugas penanggung jawab wajib diisi')
			.max(100, 'Maksimal 100 karakter'),
	});

function formatDateForInput(dateValue) {
	if (!dateValue) return '';
	const d = new Date(dateValue);
	if (Number.isNaN(d.getTime())) return '';
	return d.toISOString().split('T')[0];
}

function WasteOutRecordForm({ open, onClose, onSuccess, wasteRecord, editData, adminName, siteId }) {
	const { enqueueSnackbar } = useSnackbar();
	const isEditMode = Boolean(editData);

	const minDate = useMemo(() => {
		if (!wasteRecord?.tanggalMasuk) return new Date('2020-01-01');
		return new Date(wasteRecord.tanggalMasuk);
	}, [wasteRecord?.tanggalMasuk]);

	const maxJumlah = useMemo(() => {
		const sisa = Number(wasteRecord?.sisaLimbah) || 0;
		if (isEditMode) {
			return sisa + Number(editData?.jumlahKeluar || 0);
		}
		return sisa;
	}, [wasteRecord?.sisaLimbah, editData?.jumlahKeluar, isEditMode]);

	const validationSchema = useMemo(() => getValidationSchema(minDate, maxJumlah), [minDate, maxJumlah]);

	const formik = useFormik({
		enableReinitialize: true,
		initialValues: {
			tanggalKeluar: formatDateForInput(editData?.tanggalKeluar) || '',
			jumlahKeluar: editData?.jumlahKeluar ?? '',
			tujuanPenyerahan: editData?.tujuanPenyerahan || '',
			nomorDokumen: editData?.nomorDokumen || '',
			petugasPenanggungJawab: editData?.petugasPenanggungJawab || adminName || '',
		},
		validationSchema,
		onSubmit: async (values, { setSubmitting }) => {
			try {
				const payload = {
					tanggalKeluar: values.tanggalKeluar,
					jumlahKeluar: Number(values.jumlahKeluar),
					tujuanPenyerahan: values.tujuanPenyerahan.trim(),
					nomorDokumen: values.nomorDokumen.trim(),
					petugasPenanggungJawab: values.petugasPenanggungJawab.trim(),
				};

				if (isEditMode) {
					await updateWasteOutRecord(siteId, editData.id, payload);
					enqueueSnackbar('Pencatatan limbah keluar berhasil diperbarui', { variant: 'success' });
				} else {
					await createWasteOutRecord(siteId, wasteRecord.id, payload);
					enqueueSnackbar('Pencatatan limbah keluar berhasil ditambahkan', { variant: 'success' });
				}

				onSuccess?.();
			} catch (err) {
				enqueueSnackbar(err.message || 'Gagal menyimpan pencatatan limbah keluar', { variant: 'error' });
			} finally {
				setSubmitting(false);
			}
		},
	});

	const handleClose = () => {
		formik.resetForm();
		onClose?.();
	};

	return (
		<Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
			<DialogTitle>
				{isEditMode ? 'Edit Pencatatan Limbah Keluar' : 'Tambah Pencatatan Limbah Keluar'}
			</DialogTitle>
			<form onSubmit={formik.handleSubmit}>
				<DialogContent>
					<Stack spacing={2} sx={{ mt: 1 }}>
						<TextField
							fullWidth
							label="Tanggal Keluar"
							name="tanggalKeluar"
							type="date"
							InputLabelProps={{ shrink: true }}
							inputProps={{
								min: formatDateForInput(minDate),
								max: formatDateForInput(new Date()),
							}}
							value={formik.values.tanggalKeluar}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							error={formik.touched.tanggalKeluar && Boolean(formik.errors.tanggalKeluar)}
							helperText={formik.touched.tanggalKeluar && formik.errors.tanggalKeluar}
						/>
						<TextField
							fullWidth
							label="Jumlah Keluar (kg)"
							name="jumlahKeluar"
							type="number"
							inputProps={{
								min: 0.01,
								max: maxJumlah,
								step: 0.01,
							}}
							value={formik.values.jumlahKeluar}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							error={formik.touched.jumlahKeluar && Boolean(formik.errors.jumlahKeluar)}
							helperText={
								formik.touched.jumlahKeluar && formik.errors.jumlahKeluar
									? formik.errors.jumlahKeluar
									: `Sisa limbah tersedia: ${maxJumlah} kg`
							}
						/>
						<TextField
							fullWidth
							label="Tujuan Penyerahan"
							name="tujuanPenyerahan"
							multiline
							rows={2}
							inputProps={{ maxLength: 200 }}
							value={formik.values.tujuanPenyerahan}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							error={formik.touched.tujuanPenyerahan && Boolean(formik.errors.tujuanPenyerahan)}
							helperText={formik.touched.tujuanPenyerahan && formik.errors.tujuanPenyerahan}
						/>
						<TextField
							fullWidth
							label="Nomor Dokumen"
							name="nomorDokumen"
							inputProps={{ maxLength: 100 }}
							value={formik.values.nomorDokumen}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							error={formik.touched.nomorDokumen && Boolean(formik.errors.nomorDokumen)}
							helperText={formik.touched.nomorDokumen && formik.errors.nomorDokumen}
						/>
						<TextField
							fullWidth
							label="Petugas Penanggung Jawab"
							name="petugasPenanggungJawab"
							inputProps={{ maxLength: 100 }}
							value={formik.values.petugasPenanggungJawab}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							disabled={isEditMode}
							error={
								formik.touched.petugasPenanggungJawab && Boolean(formik.errors.petugasPenanggungJawab)
							}
							helperText={formik.touched.petugasPenanggungJawab && formik.errors.petugasPenanggungJawab}
						/>
					</Stack>
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 2 }}>
					<Button onClick={handleClose} color="inherit">
						Batal
					</Button>
					<Button type="submit" variant="contained" disabled={formik.isSubmitting}>
						{formik.isSubmitting ? 'Menyimpan...' : 'Simpan'}
					</Button>
				</DialogActions>
			</form>
		</Dialog>
	);
}

export default WasteOutRecordForm;
