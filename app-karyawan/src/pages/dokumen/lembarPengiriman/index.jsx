import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSnackbar } from 'notistack';

import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import Link from '@mui/material/Link';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';

import CardHeader from '@/components/cardHeader';
import DeleteConfirmDialog from '@/components/masterData/deleteConfirmDialog';
import PageHeader from '@/components/pageHeader';
import { useSite } from '@/contexts/siteContext';
import useUrlSearchKeyword from '@/hooks/useUrlSearchKeyword';
import { getSiteProfile } from '@/services/b3WasteService';
import {
	createDeliverySlip,
	deleteDeliverySlip,
	getDeliverySlips,
	updateDeliverySlip,
} from '@/services/deliverySlipService';
import apiRequest from '@/services/api';

import DeliverySlipFormDialog from './deliverySlipFormDialog';
import DeliverySlipTable from './deliverySlipTable';
import { formatDateShort, formatDateId } from './utils';

async function fetchEmployeeOptions(siteId) {
	const path = siteId ? `/master/employees?siteId=${siteId}` : '/master/employees';
	return apiRequest(path);
}

function LembarPengirimanPage() {
	const { enqueueSnackbar } = useSnackbar();
	const { currentSiteId } = useSite();
	const [rows, setRows] = useState([]);
	const [employeeOptions, setEmployeeOptions] = useState([]);
	const [siteProfile, setSiteProfile] = useState(null);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [formOpen, setFormOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [selectedItem, setSelectedItem] = useState(null);
	const [searchKeyword, setSearchKeyword] = useUrlSearchKeyword();
	const [dateFrom, setDateFrom] = useState('');
	const [dateTo, setDateTo] = useState('');
	const [statusFilter, setStatusFilter] = useState('ALL');

	const loadData = useCallback(async () => {
		setLoading(true);

		try {
			const [slips, employees, profile] = await Promise.all([
				getDeliverySlips(currentSiteId),
				fetchEmployeeOptions(currentSiteId).catch(() => []),
				currentSiteId ? getSiteProfile(currentSiteId).catch(() => null) : Promise.resolve(null),
			]);

			setRows(slips || []);
			setEmployeeOptions(employees || []);
			setSiteProfile(profile);
		} catch (error) {
			enqueueSnackbar(error.message, { variant: 'error' });
		} finally {
			setLoading(false);
		}
	}, [currentSiteId, enqueueSnackbar]);

	useEffect(() => {
		loadData();
	}, [loadData]);

	const filteredRows = useMemo(() => {
		const keyword = searchKeyword.trim().toLowerCase();

		return rows.filter((row) => {
			if (dateFrom && row.slipDate < dateFrom) {
				return false;
			}

			if (dateTo && row.slipDate > dateTo) {
				return false;
			}

			if (statusFilter !== 'ALL' && row.status !== statusFilter) {
				return false;
			}

			if (!keyword) {
				return true;
			}

			const haystack = [
				row.slipNumber,
				row.recipientName,
				row.recipientAttention,
				row.senderName,
				row.senderCompany,
				row.receiverName,
				formatDateShort(row.slipDate),
			];

			return haystack.some((value) =>
				String(value || '')
					.toLowerCase()
					.includes(keyword),
			);
		});
	}, [rows, searchKeyword, dateFrom, dateTo, statusFilter]);

	const closeFormDialog = () => {
		setFormOpen(false);
		setSelectedItem(null);
	};

	const closeDeleteDialog = () => {
		setDeleteOpen(false);
		setSelectedItem(null);
	};

	const handleOpenCreate = () => {
		if (!currentSiteId) {
			enqueueSnackbar('Pilih site terlebih dahulu sebelum membuat lembar pengiriman.', {
				variant: 'warning',
			});
			return;
		}

		setSelectedItem(null);
		setFormOpen(true);
	};

	const handleSubmit = async (values) => {
		setSubmitting(true);

		try {
			const saved = selectedItem
				? await updateDeliverySlip(selectedItem.id, values)
				: await createDeliverySlip(values);

			setRows((current) => {
				if (selectedItem) {
					return current.map((item) => (item.id === saved.id ? saved : item));
				}

				return [saved, ...current];
			});

			closeFormDialog();
			enqueueSnackbar(`Lembar pengiriman berhasil ${selectedItem ? 'diperbarui' : 'ditambahkan'}.`, {
				variant: 'success',
			});
		} catch (error) {
			enqueueSnackbar(error.message, { variant: 'error' });
		} finally {
			setSubmitting(false);
		}
	};

	const handleDelete = async () => {
		if (!selectedItem) {
			return;
		}

		setSubmitting(true);

		try {
			await deleteDeliverySlip(selectedItem.id);
			setRows((current) => current.filter((item) => item.id !== selectedItem.id));
			closeDeleteDialog();
			enqueueSnackbar('Lembar pengiriman berhasil dihapus.', { variant: 'success' });
		} catch (error) {
			enqueueSnackbar(error.message, { variant: 'error' });
		} finally {
			setSubmitting(false);
		}
	};

	const handlePrint = (row) => {
		const params = currentSiteId ? `?siteId=${currentSiteId}` : '';
		window.open(`/print/dokumen/lembar-pengiriman/${row.id}${params}`, '_blank', 'noopener,noreferrer');
	};

	const handleExportExcel = async () => {
		if (filteredRows.length === 0) {
			enqueueSnackbar('Tidak ada data untuk diexport.', { variant: 'error' });
			return;
		}

		const ExcelJS = await import('exceljs');
		const Workbook = ExcelJS.Workbook || ExcelJS.default?.Workbook;
		const workbook = new Workbook();
		const worksheet = workbook.addWorksheet('Lembar Pengiriman');

		worksheet.columns = [
			{ header: 'NO', key: 'no', width: 8 },
			{ header: 'NOMOR LEMBAR', key: 'slipNumber', width: 26 },
			{ header: 'TANGGAL', key: 'slipDate', width: 18 },
			{ header: 'UNTUK', key: 'recipientName', width: 26 },
			{ header: 'ATENSI', key: 'recipientAttention', width: 24 },
			{ header: 'POSISI TUJUAN', key: 'recipientPosition', width: 18 },
			{ header: 'DARI', key: 'senderCompany', width: 28 },
			{ header: 'PENGIRIM', key: 'senderName', width: 24 },
			{ header: 'POSISI PENGIRIM', key: 'senderPosition', width: 20 },
			{ header: 'JENIS LEMBAR', key: 'slipTypes', width: 22 },
			{ header: 'JENIS DOKUMEN', key: 'documentConfidentiality', width: 18 },
			{ header: 'JENIS BARANG', key: 'goodsTypes', width: 22 },
			{ header: 'PENANGANAN', key: 'handlingTypes', width: 28 },
			{ header: 'DIKIRIMKAN UNTUK', key: 'purposes', width: 26 },
			{ header: 'JUMLAH ITEM', key: 'itemCount', width: 14 },
			{ header: 'PENERIMA', key: 'receiverName', width: 24 },
			{ header: 'POSISI PENERIMA', key: 'receiverPosition', width: 20 },
			{ header: 'TANGGAL DITERIMA', key: 'receiverDate', width: 18 },
			{ header: 'STATUS', key: 'status', width: 12 },
		];

		worksheet.getRow(1).font = { bold: true };
		worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

		filteredRows.forEach((row, index) => {
			const filledItems = (row.items || []).filter((item) => item.description || item.note);

			worksheet.addRow({
				no: index + 1,
				slipNumber: row.slipNumber,
				slipDate: formatDateId(row.slipDate),
				recipientName: row.recipientName,
				recipientAttention: row.recipientAttention,
				recipientPosition: row.recipientPosition,
				senderCompany: row.senderCompany,
				senderName: row.senderName,
				senderPosition: row.senderPosition,
				slipTypes: (row.slipTypes || []).join(', '),
				documentConfidentiality: row.documentConfidentiality,
				goodsTypes: (row.goodsTypes || []).join(', '),
				handlingTypes: (row.handlingTypes || []).join(', '),
				purposes: (row.purposes || []).join(', '),
				itemCount: filledItems.length,
				receiverName: row.receiverName,
				receiverPosition: row.receiverPosition,
				receiverDate: row.receiverDate ? formatDateId(row.receiverDate) : '',
				status: row.status,
			});
		});

		worksheet.eachRow((row, rowNumber) => {
			const targetRow = row;
			targetRow.alignment = {
				vertical: rowNumber === 1 ? 'middle' : 'top',
				horizontal: rowNumber === 1 ? 'center' : 'left',
				wrapText: true,
			};

			if (rowNumber === 1) {
				targetRow.fill = {
					type: 'pattern',
					pattern: 'solid',
					fgColor: { argb: 'DDE4EE' },
				};
			}
		});

		const buffer = await workbook.xlsx.writeBuffer();
		const blob = new Blob([buffer], {
			type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		});
		const url = window.URL.createObjectURL(blob);
		const link = document.createElement('a');
		const suffix = dateFrom || dateTo ? `${dateFrom || 'all'}_${dateTo || 'all'}` : 'all-data';

		link.href = url;
		link.download = `lembar-pengiriman-${suffix}.xlsx`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		window.URL.revokeObjectURL(url);
	};

	return (
		<>
			<PageHeader title="Lembar Pengiriman">
				<Breadcrumbs aria-label="breadcrumb" sx={{ textTransform: 'uppercase' }}>
					<Link underline="hover" href="#!">
						Dokumen
					</Link>
					<Typography color="text.tertiary">Lembar Pengiriman</Typography>
				</Breadcrumbs>
			</PageHeader>
			<Card sx={{ minHeight: '60vh', p: 3 }}>
				<CardHeader
					title="Lembar Pengiriman"
					subtitle="Kelola surat pengiriman dokumen/barang (SII-QSHE-050-02)"
					size="small"
					sx={{ flexDirection: 'column', alignItems: 'stretch', gap: 2, mb: 2.5 }}
				>
					<Grid container spacing={1.5} alignItems="center">
						<Grid item xs={12} xl={4}>
							<TextField
								fullWidth
								size="small"
								label="Cari Data"
								value={searchKeyword}
								onChange={(event) => setSearchKeyword(event.target.value)}
								placeholder="Nomor, tujuan, pengirim..."
								InputProps={{
									startAdornment: (
										<InputAdornment position="start">
											<SearchOutlinedIcon fontSize="small" />
										</InputAdornment>
									),
								}}
							/>
						</Grid>
						<Grid item xs={12} sm={6} md={4} lg={2}>
							<TextField
								fullWidth
								size="small"
								type="date"
								label="Dari Tanggal"
								value={dateFrom}
								onChange={(event) => setDateFrom(event.target.value)}
								InputLabelProps={{ shrink: true }}
							/>
						</Grid>
						<Grid item xs={12} sm={6} md={4} lg={2}>
							<TextField
								fullWidth
								size="small"
								type="date"
								label="Sampai Tanggal"
								value={dateTo}
								onChange={(event) => setDateTo(event.target.value)}
								InputLabelProps={{ shrink: true }}
							/>
						</Grid>
						<Grid item xs={12} sm={6} md={4} lg={2}>
							<TextField
								fullWidth
								size="small"
								select
								label="Status"
								value={statusFilter}
								onChange={(event) => setStatusFilter(event.target.value)}
							>
								<MenuItem value="ALL">Semua</MenuItem>
								<MenuItem value="DRAFT">Draft</MenuItem>
								<MenuItem value="DITERIMA">Diterima</MenuItem>
							</TextField>
						</Grid>
						<Grid item xs={12} lg="auto" sx={{ ml: { lg: 'auto' } }}>
							<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
								<Button
									variant="outlined"
									startIcon={<DownloadOutlinedIcon />}
									onClick={handleExportExcel}
									sx={{ minWidth: 160, whiteSpace: 'nowrap' }}
								>
									Export Excel
								</Button>
								<Button
									variant="contained"
									startIcon={<AddOutlinedIcon />}
									onClick={handleOpenCreate}
									sx={{ minWidth: 200, whiteSpace: 'nowrap' }}
								>
									Tambah Lembar Pengiriman
								</Button>
							</Stack>
						</Grid>
					</Grid>
				</CardHeader>
				<Box>
					<DeliverySlipTable
						rows={filteredRows}
						loading={loading}
						onEdit={(item) => {
							setSelectedItem(item);
							setFormOpen(true);
						}}
						onDelete={(item) => {
							setSelectedItem(item);
							setDeleteOpen(true);
						}}
						onPrint={handlePrint}
					/>
				</Box>
			</Card>
			<DeliverySlipFormDialog
				open={formOpen}
				loading={submitting}
				initialValue={selectedItem}
				employeeOptions={employeeOptions}
				siteId={currentSiteId}
				siteProfile={siteProfile}
				onClose={closeFormDialog}
				onSubmit={handleSubmit}
			/>
			<DeleteConfirmDialog
				open={deleteOpen}
				loading={submitting}
				title="lembar pengiriman"
				itemName={selectedItem?.slipNumber}
				onClose={closeDeleteDialog}
				onConfirm={handleDelete}
			/>
		</>
	);
}

export default LembarPengirimanPage;
