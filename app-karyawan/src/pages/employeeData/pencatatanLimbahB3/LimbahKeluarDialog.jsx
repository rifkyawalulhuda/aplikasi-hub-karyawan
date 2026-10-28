import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSnackbar } from 'notistack';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';

import DeleteConfirmDialog from '@/components/masterData/deleteConfirmDialog';
import { B3_TREATMENT_OPTIONS } from '@/constants/b3Waste';
import { deleteWasteOutRecord, getWasteOutRecords } from '@/services/b3WasteService';

import WasteOutRecordForm from './WasteOutRecordForm';

const TREATMENT_LABEL_MAP = B3_TREATMENT_OPTIONS.reduce((accumulator, option) => {
	accumulator[option.value] = option.label;
	return accumulator;
}, {});

function formatDate(value) {
	if (!value) return '-';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return '-';
	return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatAngka(value) {
	if (value == null || Number.isNaN(Number(value))) return '0';
	return Number(value).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function LimbahKeluarDialog({ open, onClose, wasteRecord, siteId, adminName, onChanged }) {
	const { enqueueSnackbar } = useSnackbar();
	const [rows, setRows] = useState([]);
	const [loading, setLoading] = useState(false);
	const [formOpen, setFormOpen] = useState(false);
	const [editTarget, setEditTarget] = useState(null);
	const [deleteTarget, setDeleteTarget] = useState(null);
	const [deleting, setDeleting] = useState(false);

	const fetchRows = useCallback(async () => {
		if (!wasteRecord?.id || !siteId) return;

		setLoading(true);
		try {
			const result = await getWasteOutRecords(siteId, wasteRecord.id);
			setRows(Array.isArray(result) ? result : []);
		} catch (err) {
			enqueueSnackbar(err.message || 'Gagal memuat limbah keluar', { variant: 'error' });
			setRows([]);
		} finally {
			setLoading(false);
		}
	}, [wasteRecord?.id, siteId, enqueueSnackbar]);

	useEffect(() => {
		if (open) {
			setEditTarget(null);
			setDeleteTarget(null);
			fetchRows();
		}
	}, [open, fetchRows]);

	const totalKeluar = useMemo(() => rows.reduce((sum, row) => sum + Number(row.jumlahKeluar || 0), 0), [rows]);

	const sisaLimbah = useMemo(() => {
		const masuk = Number(wasteRecord?.jumlahMasuk || 0);
		return Number((masuk - totalKeluar).toFixed(2));
	}, [wasteRecord?.jumlahMasuk, totalKeluar]);

	const effectiveWasteRecord = useMemo(
		() => (wasteRecord ? { ...wasteRecord, sisaLimbah } : null),
		[wasteRecord, sisaLimbah],
	);

	const handleAdd = () => {
		setEditTarget(null);
		setFormOpen(true);
	};

	const handleEdit = (row) => {
		setEditTarget(row);
		setFormOpen(true);
	};

	const handleFormSuccess = () => {
		setFormOpen(false);
		setEditTarget(null);
		fetchRows();
		onChanged?.();
	};

	const handleDeleteConfirm = async () => {
		if (!deleteTarget) return;

		setDeleting(true);
		try {
			await deleteWasteOutRecord(siteId, deleteTarget.id);
			enqueueSnackbar('Limbah keluar berhasil dihapus.', { variant: 'success' });
			setDeleteTarget(null);
			await fetchRows();
			onChanged?.();
		} catch (err) {
			enqueueSnackbar(err.message || 'Gagal menghapus limbah keluar', { variant: 'error' });
		} finally {
			setDeleting(false);
		}
	};

	return (
		<>
			<Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
				<DialogTitle>Kelola Limbah Keluar</DialogTitle>
				<DialogContent>
					<Stack spacing={2} sx={{ mt: 0.5 }}>
						<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between">
							<Box>
								<Typography variant="body2" color="text.secondary">
									Jenis limbah
								</Typography>
								<Typography variant="subtitle2" fontWeight={600}>
									{wasteRecord?.jenisLimbah?.kode ? `${wasteRecord.jenisLimbah.kode} — ` : ''}
									{wasteRecord?.jenisLimbah?.nama || '-'}
								</Typography>
								<Typography variant="body2" color="text.secondary">
									Tanggal masuk: {formatDate(wasteRecord?.tanggalMasuk)}
								</Typography>
							</Box>
							<Box>
								<Typography variant="body2" color="text.secondary">
									Jumlah masuk: {formatAngka(wasteRecord?.jumlahMasuk)} kg
								</Typography>
								<Typography variant="body2" color="text.secondary">
									Total keluar: {formatAngka(totalKeluar)} kg
								</Typography>
								<Typography variant="body2" fontWeight={600}>
									Sisa di TPS: {formatAngka(sisaLimbah)} kg
								</Typography>
							</Box>
						</Stack>

						{loading ? (
							<Stack alignItems="center" sx={{ py: 4 }}>
								<CircularProgress />
							</Stack>
						) : (
							<TableContainer sx={{ maxHeight: 380 }}>
								<Table size="small" stickyHeader>
									<TableHead>
										<TableRow>
											<TableCell sx={{ fontWeight: 700 }}>Tanggal Keluar</TableCell>
											<TableCell align="right" sx={{ fontWeight: 700 }}>
												Jumlah (kg)
											</TableCell>
											<TableCell sx={{ fontWeight: 700 }}>Perlakuan</TableCell>
											<TableCell sx={{ fontWeight: 700 }}>Tujuan Penyerahan</TableCell>
											<TableCell sx={{ fontWeight: 700 }}>No. Dokumen</TableCell>
											<TableCell sx={{ fontWeight: 700 }}>Pengelola</TableCell>
											<TableCell sx={{ fontWeight: 700 }}>Petugas</TableCell>
											<TableCell align="center" sx={{ fontWeight: 700 }}>
												Aksi
											</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{rows.length === 0 ? (
											<TableRow>
												<TableCell
													colSpan={8}
													align="center"
													sx={{ py: 4, color: 'text.secondary' }}
												>
													Belum ada limbah keluar.
												</TableCell>
											</TableRow>
										) : (
											rows.map((row) => (
												<TableRow key={row.id} hover>
													<TableCell>{formatDate(row.tanggalKeluar)}</TableCell>
													<TableCell align="right">{formatAngka(row.jumlahKeluar)}</TableCell>
													<TableCell>
														{TREATMENT_LABEL_MAP[row.perlakuan] || row.perlakuan || '-'}
													</TableCell>
													<TableCell>{row.tujuanPenyerahan || '-'}</TableCell>
													<TableCell>{row.nomorDokumen || '-'}</TableCell>
													<TableCell>{row.vendor?.vendorName || '-'}</TableCell>
													<TableCell>{row.petugasPenanggungJawab || '-'}</TableCell>
													<TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
														<Tooltip title="Edit">
															<IconButton size="small" onClick={() => handleEdit(row)}>
																<EditOutlinedIcon fontSize="small" color="primary" />
															</IconButton>
														</Tooltip>
														<Tooltip title="Hapus">
															<IconButton
																size="small"
																onClick={() => setDeleteTarget(row)}
															>
																<DeleteOutlineOutlinedIcon
																	fontSize="small"
																	color="error"
																/>
															</IconButton>
														</Tooltip>
													</TableCell>
												</TableRow>
											))
										)}
									</TableBody>
								</Table>
							</TableContainer>
						)}
					</Stack>
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 3, justifyContent: 'space-between' }}>
					<Button
						variant="outlined"
						startIcon={<AddOutlinedIcon />}
						onClick={handleAdd}
						disabled={sisaLimbah <= 0}
					>
						Tambah Limbah Keluar
					</Button>
					<Button onClick={onClose} color="inherit">
						Tutup
					</Button>
				</DialogActions>
			</Dialog>

			<WasteOutRecordForm
				open={formOpen}
				onClose={() => {
					setFormOpen(false);
					setEditTarget(null);
				}}
				onSuccess={handleFormSuccess}
				wasteRecord={effectiveWasteRecord}
				editData={editTarget}
				adminName={adminName}
				siteId={siteId}
			/>

			<DeleteConfirmDialog
				open={Boolean(deleteTarget)}
				loading={deleting}
				title="Limbah Keluar"
				itemName={
					deleteTarget
						? `${formatDate(deleteTarget.tanggalKeluar)} — ${formatAngka(deleteTarget.jumlahKeluar)} kg`
						: ''
				}
				onClose={() => setDeleteTarget(null)}
				onConfirm={handleDeleteConfirm}
			/>
		</>
	);
}

export default LimbahKeluarDialog;
