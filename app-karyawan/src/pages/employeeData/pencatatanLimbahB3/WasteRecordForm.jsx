import { useEffect, useState } from 'react';
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

import { createWasteRecord, updateWasteRecord, getWasteTypes } from '@/services/b3WasteService';

const validationSchema = yup.object({
	jenisLimbahId: yup.number().required('Jenis limbah wajib dipilih'),
	tanggalMasuk: yup
		.date()
		.required('Tanggal masuk wajib diisi')
		.min(new Date('2020-01-01'), 'Tanggal masuk minimal 1 Januari 2020')
		.max(new Date(), 'Tanggal masuk tidak boleh melebihi hari ini'),
	sumberLimbah: yup.string().required('Sumber limbah wajib diisi').max(200, 'Sumber limbah maksimal 200 karakter'),
	jumlahMasuk: yup
		.number()
		.required('Jumlah masuk wajib diisi')
		.min(0.01, 'Jumlah masuk minimal 0.01')
		.max(999999.99, 'Jumlah masuk maksimal 999999.99'),
	maksimalPenyimpanan: yup
		.number()
		.required('Maksimal penyimpanan wajib dipilih')
		.oneOf([90, 180], 'Harus 90 atau 180 hari'),
	petugasPenanggungJawab: yup
		.string()
		.required('Petugas penanggung jawab wajib diisi')
		.max(100, 'Maksimal 100 karakter'),
});

function getTodayString() {
	const today = new Date();
	const yyyy = today.getFullYear();
	const mm = String(today.getMonth() + 1).padStart(2, '0');
	const dd = String(today.getDate()).padStart(2, '0');
	return `${yyyy}-${mm}-${dd}`;
}

function WasteRecordForm({ open, onClose, onSuccess, editData, adminName, siteId }) {
	const { enqueueSnackbar } = useSnackbar();
	const [wasteTypes, setWasteTypes] = useState([]);
	const [loadingTypes, setLoadingTypes] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	const isEditMode = Boolean(editData);

	// Fetch waste types for dropdown
	useEffect(() => {
		if (open && siteId) {
			setLoadingTypes(true);
			getWasteTypes(siteId, { page: 0, pageSize: 999 })
				.then((res) => {
					setWasteTypes(res.data || []);
				})
				.catch(() => {
					enqueueSnackbar('Gagal memuat data jenis limbah', {
						variant: 'muiSnackbar',
						severity: 'error',
						title: 'Error',
					});
				})
				.finally(() => {
					setLoadingTypes(false);
				});
		}
	}, [open, siteId, enqueueSnackbar]);

	const formik = useFormik({
		enableReinitialize: true,
		initialValues: {
			jenisLimbahId: editData?.jenisLimbahId || '',
			tanggalMasuk: editData?.tanggalMasuk ? editData.tanggalMasuk.substring(0, 10) : getTodayString(),
			sumberLimbah: editData?.sumberLimbah || '',
			jumlahMasuk: editData?.jumlahMasuk ?? '',
			maksimalPenyimpanan: editData?.maksimalPenyimpanan || '',
			petugasPenanggungJawab: editData?.petugasPenanggungJawab || adminName || '',
		},
		validationSchema,
		onSubmit: async (values) => {
			setSubmitting(true);
			try {
				const payload = {
					...values,
					jenisLimbahId: Number(values.jenisLimbahId),
					jumlahMasuk: Number(values.jumlahMasuk),
					maksimalPenyimpanan: Number(values.maksimalPenyimpanan),
				};

				if (isEditMode) {
					await updateWasteRecord(siteId, editData.id, payload);
					enqueueSnackbar('Data limbah berhasil diperbarui', {
						variant: 'muiSnackbar',
						severity: 'success',
						title: 'Berhasil',
					});
				} else {
					await createWasteRecord(siteId, payload);
					enqueueSnackbar('Data limbah berhasil ditambahkan', {
						variant: 'muiSnackbar',
						severity: 'success',
						title: 'Berhasil',
					});
				}

				onClose();
				onSuccess?.();
			} catch (error) {
				const message = error?.message || 'Terjadi kesalahan pada server';
				enqueueSnackbar(message, {
					variant: 'muiSnackbar',
					severity: 'error',
					title: 'Error',
				});
			} finally {
				setSubmitting(false);
			}
		},
	});

	// Reset form when dialog opens/closes
	useEffect(() => {
		if (open) {
			formik.resetForm();
		}
	}, [open, editData]); // eslint-disable-line

	return (
		<Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="md">
			<DialogTitle>{isEditMode ? 'Edit Pencatatan Limbah B3' : 'Tambah Pencatatan Limbah B3'}</DialogTitle>
			<DialogContent>
				<Grid
					container
					spacing={2}
					component="form"
					id="waste-record-form"
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
							label="Tanggal Masuk"
							name="tanggalMasuk"
							type="date"
							value={formik.values.tanggalMasuk}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							error={formik.touched.tanggalMasuk && Boolean(formik.errors.tanggalMasuk)}
							helperText={formik.touched.tanggalMasuk && formik.errors.tanggalMasuk}
							InputLabelProps={{ shrink: true }}
							inputProps={{
								min: '2020-01-01',
								max: getTodayString(),
							}}
						/>
					</Grid>
					<Grid item xs={12}>
						<TextField
							fullWidth
							label="Sumber Limbah"
							name="sumberLimbah"
							value={formik.values.sumberLimbah}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							error={formik.touched.sumberLimbah && Boolean(formik.errors.sumberLimbah)}
							helperText={formik.touched.sumberLimbah && formik.errors.sumberLimbah}
							inputProps={{ maxLength: 200 }}
						/>
					</Grid>
					<Grid item xs={12} md={6}>
						<TextField
							fullWidth
							label="Jumlah Masuk (kg)"
							name="jumlahMasuk"
							type="number"
							value={formik.values.jumlahMasuk}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							error={formik.touched.jumlahMasuk && Boolean(formik.errors.jumlahMasuk)}
							helperText={formik.touched.jumlahMasuk && formik.errors.jumlahMasuk}
							inputProps={{
								min: 0.01,
								max: 999999.99,
								step: 0.01,
							}}
						/>
					</Grid>
					<Grid item xs={12} md={6}>
						<TextField
							select
							fullWidth
							label="Maksimal Penyimpanan (hari)"
							name="maksimalPenyimpanan"
							value={formik.values.maksimalPenyimpanan}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							error={formik.touched.maksimalPenyimpanan && Boolean(formik.errors.maksimalPenyimpanan)}
							helperText={formik.touched.maksimalPenyimpanan && formik.errors.maksimalPenyimpanan}
						>
							<MenuItem value={90}>90 hari</MenuItem>
							<MenuItem value={180}>180 hari</MenuItem>
						</TextField>
					</Grid>
					<Grid item xs={12}>
						<TextField
							fullWidth
							label="Petugas Penanggung Jawab"
							name="petugasPenanggungJawab"
							value={formik.values.petugasPenanggungJawab}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							error={
								formik.touched.petugasPenanggungJawab && Boolean(formik.errors.petugasPenanggungJawab)
							}
							helperText={formik.touched.petugasPenanggungJawab && formik.errors.petugasPenanggungJawab}
							inputProps={{ maxLength: 100 }}
							disabled={isEditMode}
						/>
					</Grid>
				</Grid>
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 3 }}>
				<Button onClick={onClose} disabled={submitting} color="inherit">
					Batal
				</Button>
				<Button type="submit" form="waste-record-form" variant="contained" disabled={submitting}>
					{submitting ? 'Menyimpan...' : 'Simpan'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default WasteRecordForm;
