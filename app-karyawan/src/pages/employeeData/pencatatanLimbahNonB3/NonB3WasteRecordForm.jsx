import { useEffect, useMemo, useState } from 'react';
import { useFormik } from 'formik';
import { useSnackbar } from 'notistack';
import * as yup from 'yup';

import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';

import apiRequest, { appendSiteIdParam } from '@/services/api';
import { createNonB3WasteRecord, getNonB3WasteTypes, updateNonB3WasteRecord } from '@/services/nonB3WasteService';

const getValidationSchema = (minDate) =>
	yup.object({
		jenisLimbahId: yup.number().required('Jenis limbah wajib dipilih'),
		tanggalMasuk: yup
			.date()
			.required('Tanggal masuk wajib diisi')
			.min(new Date('2020-01-01'), 'Tanggal masuk minimal 1 Januari 2020')
			.max(new Date(), 'Tanggal masuk tidak boleh melebihi hari ini'),
		tanggalKeluar: yup
			.date()
			.required('Tanggal keluar wajib diisi')
			.min(minDate, 'Tanggal keluar tidak boleh sebelum tanggal masuk')
			.max(new Date(), 'Tanggal keluar tidak boleh melebihi hari ini'),
		jumlahKg: yup
			.number()
			.typeError('Jumlah limbah harus berupa angka')
			.required('Jumlah limbah wajib diisi')
			.min(0.01, 'Jumlah limbah minimal 0.01')
			.max(999999.99, 'Jumlah limbah maksimal 999999.99'),
		nomorSuratJalan: yup
			.string()
			.required('Nomor surat jalan wajib diisi')
			.max(100, 'Nomor surat jalan maksimal 100 karakter'),
		nomorDokumen: yup.string().max(100, 'Nomor dokumen maksimal 100 karakter'),
		nopolKendaraan: yup.string().max(20, 'Nopol kendaraan maksimal 20 karakter'),
		petugasPenanggungJawab: yup.string().max(100, 'Maksimal 100 karakter'),
	});

function toInputDate(value) {
	if (!value) return '';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return '';
	const yyyy = date.getFullYear();
	const mm = String(date.getMonth() + 1).padStart(2, '0');
	const dd = String(date.getDate()).padStart(2, '0');
	return `${yyyy}-${mm}-${dd}`;
}

function getTodayString() {
	return toInputDate(new Date());
}

function NonB3WasteRecordForm({ open, onClose, onSuccess, editData, adminName, siteId }) {
	const { enqueueSnackbar } = useSnackbar();
	const [wasteTypes, setWasteTypes] = useState([]);
	const [vendors, setVendors] = useState([]);
	const [loadingTypes, setLoadingTypes] = useState(false);
	const [loadingVendors, setLoadingVendors] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	const isEditMode = Boolean(editData);

	useEffect(() => {
		if (!open || !siteId) return;

		setLoadingTypes(true);
		getNonB3WasteTypes(siteId, { page: 0, pageSize: 999 })
			.then((res) => setWasteTypes(res.data || []))
			.catch(() => {
				enqueueSnackbar('Gagal memuat data jenis limbah non-B3', {
					variant: 'muiSnackbar',
					severity: 'error',
					title: 'Error',
				});
			})
			.finally(() => setLoadingTypes(false));

		setLoadingVendors(true);
		apiRequest(appendSiteIdParam('/master/master-vendors', siteId))
			.then((data) => setVendors(Array.isArray(data) ? data : data?.data || []))
			.catch(() => setVendors([]))
			.finally(() => setLoadingVendors(false));
	}, [open, siteId, enqueueSnackbar]);

	const initialValues = useMemo(
		() => ({
			jenisLimbahId: editData?.jenisLimbahId || '',
			tanggalMasuk: editData?.tanggalMasuk ? toInputDate(editData.tanggalMasuk) : getTodayString(),
			tanggalKeluar: editData?.tanggalKeluar ? toInputDate(editData.tanggalKeluar) : getTodayString(),
			jumlahKg: editData?.jumlahKg ?? '',
			nomorSuratJalan: editData?.nomorSuratJalan || '',
			nomorDokumen: editData?.nomorDokumen || '',
			nopolKendaraan: editData?.nopolKendaraan || '',
			vendorId: editData?.vendorId || editData?.vendor?.id || '',
			petugasPenanggungJawab: editData?.petugasPenanggungJawab || adminName || '',
		}),
		[editData, adminName],
	);

	const formik = useFormik({
		enableReinitialize: true,
		initialValues,
		validationSchema: yup.lazy((values) =>
			getValidationSchema(values.tanggalMasuk ? new Date(values.tanggalMasuk) : new Date('2020-01-01')),
		),
		onSubmit: async (values) => {
			setSubmitting(true);
			try {
				const payload = {
					jenisLimbahId: Number(values.jenisLimbahId),
					tanggalMasuk: values.tanggalMasuk,
					tanggalKeluar: values.tanggalKeluar,
					jumlahKg: Number(values.jumlahKg),
					nomorSuratJalan: values.nomorSuratJalan.trim(),
					nomorDokumen: values.nomorDokumen.trim() || null,
					nopolKendaraan: values.nopolKendaraan.trim() || null,
					vendorId: values.vendorId ? Number(values.vendorId) : null,
					petugasPenanggungJawab: values.petugasPenanggungJawab.trim() || null,
				};

				if (isEditMode) {
					await updateNonB3WasteRecord(siteId, editData.id, payload);
					enqueueSnackbar('Pencatatan limbah non-B3 berhasil diperbarui', {
						variant: 'muiSnackbar',
						severity: 'success',
						title: 'Berhasil',
					});
				} else {
					await createNonB3WasteRecord(siteId, payload);
					enqueueSnackbar('Pencatatan limbah non-B3 berhasil ditambahkan', {
						variant: 'muiSnackbar',
						severity: 'success',
						title: 'Berhasil',
					});
				}

				onClose();
				onSuccess?.();
			} catch (error) {
				enqueueSnackbar(error?.message || 'Terjadi kesalahan pada server', {
					variant: 'muiSnackbar',
					severity: 'error',
					title: 'Error',
				});
			} finally {
				setSubmitting(false);
			}
		},
	});

	useEffect(() => {
		if (open) {
			formik.resetForm({ values: initialValues });
		}
	}, [open, initialValues]); // eslint-disable-line

	return (
		<Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="md">
			<DialogTitle>
				{isEditMode ? 'Edit Pencatatan Limbah Non-B3' : 'Tambah Pencatatan Limbah Non-B3'}
			</DialogTitle>
			<DialogContent>
				<Grid
					container
					spacing={2}
					component="form"
					id="non-b3-waste-record-form"
					sx={{ pt: 1 }}
					onSubmit={formik.handleSubmit}
				>
					<Grid item xs={12} md={6}>
						<TextField
							select
							fullWidth
							label="Jenis Limbah"
							name="jenisLimbahId"
							value={formik.values.jenisLimbahId}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							error={formik.touched.jenisLimbahId && Boolean(formik.errors.jenisLimbahId)}
							helperText={formik.touched.jenisLimbahId && formik.errors.jenisLimbahId}
							disabled={loadingTypes}
						>
							{loadingTypes ? (
								<MenuItem value="" disabled>
									<CircularProgress size={20} sx={{ mr: 1 }} /> Memuat...
								</MenuItem>
							) : (
								wasteTypes.map((type) => (
									<MenuItem key={type.id} value={type.id}>
										{type.kode} - {type.nama}
									</MenuItem>
								))
							)}
						</TextField>
					</Grid>
					<Grid item xs={12} md={6}>
						<TextField
							fullWidth
							label="Jumlah Limbah (kg)"
							name="jumlahKg"
							type="number"
							value={formik.values.jumlahKg}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							error={formik.touched.jumlahKg && Boolean(formik.errors.jumlahKg)}
							helperText={formik.touched.jumlahKg && formik.errors.jumlahKg}
							inputProps={{ min: 0.01, max: 999999.99, step: 0.01 }}
						/>
					</Grid>
					<Grid item xs={12} md={6}>
						<TextField
							fullWidth
							label="Tanggal Masuk"
							name="tanggalMasuk"
							type="date"
							value={formik.values.tanggalMasuk}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							error={formik.touched.tanggalMasuk && Boolean(formik.errors.tanggalMasuk)}
							helperText={formik.touched.tanggalMasuk && formik.errors.tanggalMasuk}
							InputLabelProps={{ shrink: true }}
							inputProps={{ min: '2020-01-01', max: getTodayString() }}
						/>
					</Grid>
					<Grid item xs={12} md={6}>
						<TextField
							fullWidth
							label="Tanggal Keluar"
							name="tanggalKeluar"
							type="date"
							value={formik.values.tanggalKeluar}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							error={formik.touched.tanggalKeluar && Boolean(formik.errors.tanggalKeluar)}
							helperText={formik.touched.tanggalKeluar && formik.errors.tanggalKeluar}
							InputLabelProps={{ shrink: true }}
							inputProps={{
								min: formik.values.tanggalMasuk || '2020-01-01',
								max: getTodayString(),
							}}
						/>
					</Grid>
					<Grid item xs={12} md={6}>
						<TextField
							select
							fullWidth
							label="Pengelola Pihak Ke-3"
							name="vendorId"
							value={formik.values.vendorId}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							disabled={loadingVendors}
							helperText="Diambil dari Master Vendor"
						>
							<MenuItem value="">
								<em>Tidak ada</em>
							</MenuItem>
							{loadingVendors ? (
								<MenuItem value="" disabled>
									<CircularProgress size={20} sx={{ mr: 1 }} /> Memuat...
								</MenuItem>
							) : (
								vendors.map((vendor) => (
									<MenuItem key={vendor.id} value={vendor.id}>
										{vendor.vendorName}
									</MenuItem>
								))
							)}
						</TextField>
					</Grid>
					<Grid item xs={12} md={6}>
						<TextField
							fullWidth
							label="Nopol Kendaraan (opsional)"
							name="nopolKendaraan"
							value={formik.values.nopolKendaraan}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							error={formik.touched.nopolKendaraan && Boolean(formik.errors.nopolKendaraan)}
							helperText={formik.touched.nopolKendaraan && formik.errors.nopolKendaraan}
							inputProps={{ maxLength: 20 }}
						/>
					</Grid>
					<Grid item xs={12} md={6}>
						<TextField
							fullWidth
							label="Nomor Dokumen (opsional)"
							name="nomorDokumen"
							value={formik.values.nomorDokumen}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							error={formik.touched.nomorDokumen && Boolean(formik.errors.nomorDokumen)}
							helperText={formik.touched.nomorDokumen && formik.errors.nomorDokumen}
							inputProps={{ maxLength: 100 }}
						/>
					</Grid>
					<Grid item xs={12} md={6}>
						<TextField
							fullWidth
							label="Nomor Surat Jalan"
							name="nomorSuratJalan"
							value={formik.values.nomorSuratJalan}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							error={formik.touched.nomorSuratJalan && Boolean(formik.errors.nomorSuratJalan)}
							helperText={formik.touched.nomorSuratJalan && formik.errors.nomorSuratJalan}
							inputProps={{ maxLength: 100 }}
						/>
					</Grid>
					<Grid item xs={12}>
						<TextField
							fullWidth
							label="Petugas Penanggung Jawab (opsional)"
							name="petugasPenanggungJawab"
							value={formik.values.petugasPenanggungJawab}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							error={
								formik.touched.petugasPenanggungJawab && Boolean(formik.errors.petugasPenanggungJawab)
							}
							helperText={formik.touched.petugasPenanggungJawab && formik.errors.petugasPenanggungJawab}
							inputProps={{ maxLength: 100 }}
						/>
					</Grid>
				</Grid>
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 3 }}>
				<Button onClick={onClose} disabled={submitting} color="inherit">
					Batal
				</Button>
				<Button type="submit" form="non-b3-waste-record-form" variant="contained" disabled={submitting}>
					{submitting ? 'Menyimpan...' : 'Simpan'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default NonB3WasteRecordForm;
