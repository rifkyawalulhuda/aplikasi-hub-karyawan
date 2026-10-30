import { useEffect, useMemo, useState } from 'react';

import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';

import {
	CONFIRMATION_MODE_OPTIONS,
	DEFAULT_CONFIRMATION_EMAIL,
	DEFAULT_SENDER_ADDRESS,
	DEFAULT_SENDER_COMPANY,
	DOCUMENT_CONFIDENTIALITY_OPTIONS,
	GOODS_TYPE_OPTIONS,
	HANDLING_TYPE_OPTIONS,
	MIN_ITEM_ROWS,
	PURPOSE_OPTIONS,
	SLIP_TYPE_OPTIONS,
} from './constants';
import { getTodayInputValue } from './utils';

function createEmptyItem() {
	return { description: '', note: '' };
}

function buildInitialForm(initialValue, siteProfile) {
	const items = (initialValue?.items || []).map((item) => ({
		description: item.description || '',
		note: item.note || '',
	}));

	while (items.length < MIN_ITEM_ROWS) {
		items.push(createEmptyItem());
	}

	return {
		slipNumber: initialValue?.slipNumber || '',
		slipDate: initialValue?.slipDate || getTodayInputValue(),
		recipientName: initialValue?.recipientName || '',
		recipientAddress: initialValue?.recipientAddress || '',
		recipientAttention: initialValue?.recipientAttention || '',
		recipientPosition: initialValue?.recipientPosition || '',
		senderCompany: initialValue?.senderCompany || siteProfile?.companyName || DEFAULT_SENDER_COMPANY,
		senderAddress: initialValue?.senderAddress || siteProfile?.address || DEFAULT_SENDER_ADDRESS,
		senderEmployeeId: initialValue?.senderEmployeeId || '',
		senderName: initialValue?.senderName || '',
		senderPosition: initialValue?.senderPosition || '',
		slipTypes: initialValue?.slipTypes || [],
		slipTypeOther: initialValue?.slipTypeOther || '',
		documentConfidentiality: initialValue?.documentConfidentiality || '',
		documentConfidentialityOther: initialValue?.documentConfidentialityOther || '',
		goodsTypes: initialValue?.goodsTypes || [],
		goodsTypeOther: initialValue?.goodsTypeOther || '',
		handlingTypes: initialValue?.handlingTypes || [],
		handlingTypeOther: initialValue?.handlingTypeOther || '',
		purposes: initialValue?.purposes || [],
		purposeOther: initialValue?.purposeOther || '',
		confirmationMode: initialValue?.confirmationMode || '',
		confirmationEmail: initialValue?.confirmationEmail || DEFAULT_CONFIRMATION_EMAIL,
		returnAddress: initialValue?.returnAddress || DEFAULT_SENDER_ADDRESS,
		senderDate: initialValue?.senderDate || getTodayInputValue(),
		receiverName: initialValue?.receiverName || '',
		receiverPosition: initialValue?.receiverPosition || '',
		receiverDate: initialValue?.receiverDate || '',
		items,
	};
}

function SectionHeading({ children }) {
	return (
		<Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 0.5 }}>
			{children}
		</Typography>
	);
}

function OptionGroup({ options, selected, onToggle, otherValue, onOtherChange, otherLabel = 'Lain-lain' }) {
	let selectedList = [];

	if (Array.isArray(selected)) {
		selectedList = selected;
	} else if (selected) {
		selectedList = [selected];
	}

	return (
		<Stack spacing={1}>
			<Stack direction="row" flexWrap="wrap" columnGap={1} rowGap={0.5}>
				{options.map((option) => (
					<FormControlLabel
						key={option.value}
						control={
							<Checkbox
								size="small"
								checked={selectedList.includes(option.value)}
								onChange={() => onToggle(option.value)}
							/>
						}
						label={option.label}
						sx={{ mr: 1 }}
					/>
				))}
			</Stack>
			{selectedList.includes('LAINNYA') ? (
				<TextField
					size="small"
					label={`Keterangan ${otherLabel}`}
					value={otherValue}
					onChange={(event) => onOtherChange(event.target.value)}
					sx={{ maxWidth: 420 }}
				/>
			) : null}
		</Stack>
	);
}

function DeliverySlipFormDialog({
	open,
	loading,
	initialValue,
	employeeOptions = [],
	siteId,
	siteProfile,
	onClose,
	onSubmit,
}) {
	const isEditMode = Boolean(initialValue);
	const [form, setForm] = useState(() => buildInitialForm(initialValue, siteProfile));
	const [errors, setErrors] = useState({});

	useEffect(() => {
		if (open) {
			setForm(buildInitialForm(initialValue, siteProfile));
			setErrors({});
		}
	}, [open, initialValue, siteProfile]);

	const selectedEmployee = useMemo(
		() => employeeOptions.find((employee) => employee.id === Number(form.senderEmployeeId)) || null,
		[employeeOptions, form.senderEmployeeId],
	);

	const updateField = (field, value) => {
		setForm((current) => ({ ...current, [field]: value }));
		setErrors((current) => ({ ...current, [field]: undefined }));
	};

	const handleToggle = (field, value, single = false) => {
		setForm((current) => {
			const list = current[field] || [];

			if (single) {
				return { ...current, [field]: list.includes(value) ? '' : value };
			}

			return {
				...current,
				[field]: list.includes(value) ? list.filter((item) => item !== value) : [...list, value],
			};
		});
		setErrors((current) => ({ ...current, [field]: undefined }));
	};

	const handleEmployeeChange = (employee) => {
		setForm((current) => ({
			...current,
			senderEmployeeId: employee?.id || '',
			senderName: employee?.fullName || '',
			senderPosition: employee?.jobLevelName || '',
		}));
		setErrors((current) => ({ ...current, senderEmployeeId: undefined }));
	};

	const handleItemChange = (index, field, value) => {
		setForm((current) => {
			const items = current.items.map((item, itemIndex) =>
				itemIndex === index ? { ...item, [field]: value } : item,
			);

			return { ...current, items };
		});
	};

	const handleAddItem = () => {
		setForm((current) => ({ ...current, items: [...current.items, createEmptyItem()] }));
	};

	const handleRemoveItem = (index) => {
		setForm((current) => {
			if (current.items.length <= MIN_ITEM_ROWS) {
				return current;
			}

			return { ...current, items: current.items.filter((item, itemIndex) => itemIndex !== index) };
		});
	};

	const validate = () => {
		const nextErrors = {};

		if (!form.slipNumber.trim()) {
			nextErrors.slipNumber = 'Nomor lembar pengiriman wajib diisi.';
		}

		if (!form.slipDate) {
			nextErrors.slipDate = 'Tanggal wajib diisi.';
		}

		if (!form.recipientName.trim()) {
			nextErrors.recipientName = 'Tujuan pengiriman wajib diisi.';
		}

		if (!form.senderEmployeeId && !form.senderName.trim()) {
			nextErrors.senderEmployeeId = 'Pengirim wajib dipilih.';
		}

		if (form.slipTypes.includes('LAINNYA') && !form.slipTypeOther.trim()) {
			nextErrors.slipTypeOther = 'Keterangan lain-lain wajib diisi.';
		}

		if (form.documentConfidentiality === 'LAINNYA' && !form.documentConfidentialityOther.trim()) {
			nextErrors.documentConfidentialityOther = 'Keterangan lain-lain wajib diisi.';
		}

		if (form.goodsTypes.includes('LAINNYA') && !form.goodsTypeOther.trim()) {
			nextErrors.goodsTypeOther = 'Keterangan lain-lain wajib diisi.';
		}

		if (form.handlingTypes.includes('LAINNYA') && !form.handlingTypeOther.trim()) {
			nextErrors.handlingTypeOther = 'Keterangan lain-lain wajib diisi.';
		}

		if (form.purposes.includes('LAINNYA') && !form.purposeOther.trim()) {
			nextErrors.purposeOther = 'Keterangan lain-lain wajib diisi.';
		}

		setErrors(nextErrors);
		return Object.keys(nextErrors).length === 0;
	};

	const handleSubmit = () => {
		if (!validate()) {
			return;
		}

		onSubmit({
			...form,
			siteId,
			items: form.items.filter((item) => item.description.trim() || item.note.trim()),
		});
	};

	return (
		<Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="lg" scroll="paper">
			<DialogTitle>{isEditMode ? 'Edit Lembar Pengiriman' : 'Lembar Pengiriman Baru'}</DialogTitle>
			<DialogContent dividers>
				<Stack spacing={2.5}>
					<Grid container spacing={2}>
						<Grid item xs={12} md={5}>
							<TextField
								fullWidth
								size="small"
								label="Nomor Lembar Pengiriman"
								placeholder="104/SII/CLC/IV/2026"
								value={form.slipNumber}
								onChange={(event) => updateField('slipNumber', event.target.value)}
								error={Boolean(errors.slipNumber)}
								helperText={errors.slipNumber || ' '}
							/>
						</Grid>
						<Grid item xs={12} md={3}>
							<TextField
								fullWidth
								size="small"
								type="date"
								label="Tanggal"
								value={form.slipDate}
								onChange={(event) => updateField('slipDate', event.target.value)}
								error={Boolean(errors.slipDate)}
								helperText={errors.slipDate || ' '}
								InputLabelProps={{ shrink: true }}
							/>
						</Grid>
						<Grid item xs={12} md={4}>
							<Autocomplete
								options={employeeOptions}
								value={selectedEmployee}
								getOptionLabel={(option) => option.fullName || ''}
								isOptionEqualToValue={(option, value) => option.id === value.id}
								onChange={(event, value) => handleEmployeeChange(value)}
								renderInput={(params) => (
									<TextField
										{...params}
										size="small"
										label="Pengirim"
										error={Boolean(errors.senderEmployeeId)}
										helperText={errors.senderEmployeeId || ' '}
									/>
								)}
							/>
						</Grid>
						<Grid item xs={12} md={4}>
							<TextField
								fullWidth
								size="small"
								label="Posisi Pengirim"
								value={form.senderPosition}
								InputProps={{ readOnly: true }}
								helperText="Mengikuti jabatan karyawan terpilih"
							/>
						</Grid>
						<Grid item xs={12} md={8}>
							<TextField
								fullWidth
								size="small"
								label="Perusahaan Pengirim (Dari)"
								value={form.senderCompany}
								onChange={(event) => updateField('senderCompany', event.target.value)}
								helperText="Default dari profil site"
							/>
						</Grid>
						<Grid item xs={12}>
							<TextField
								fullWidth
								size="small"
								multiline
								minRows={2}
								label="Alamat Pengirim"
								value={form.senderAddress}
								onChange={(event) => updateField('senderAddress', event.target.value)}
							/>
						</Grid>
					</Grid>

					<Divider />

					<Grid container spacing={2}>
						<Grid item xs={12} md={5}>
							<TextField
								fullWidth
								size="small"
								label="Untuk (Tujuan)"
								value={form.recipientName}
								onChange={(event) => updateField('recipientName', event.target.value)}
								error={Boolean(errors.recipientName)}
								helperText={errors.recipientName || ' '}
							/>
						</Grid>
						<Grid item xs={12} md={4}>
							<TextField
								fullWidth
								size="small"
								label="Atensi"
								value={form.recipientAttention}
								onChange={(event) => updateField('recipientAttention', event.target.value)}
								helperText=" "
							/>
						</Grid>
						<Grid item xs={12} md={3}>
							<TextField
								fullWidth
								size="small"
								label="Posisi Tujuan"
								value={form.recipientPosition}
								onChange={(event) => updateField('recipientPosition', event.target.value)}
								helperText=" "
							/>
						</Grid>
						<Grid item xs={12}>
							<TextField
								fullWidth
								size="small"
								multiline
								minRows={2}
								label="Alamat Tujuan"
								value={form.recipientAddress}
								onChange={(event) => updateField('recipientAddress', event.target.value)}
							/>
						</Grid>
					</Grid>

					<Divider />

					<Box>
						<SectionHeading>1. Jenis lembar pengiriman</SectionHeading>
						<OptionGroup
							options={SLIP_TYPE_OPTIONS}
							selected={form.slipTypes}
							onToggle={(value) => handleToggle('slipTypes', value)}
							otherValue={form.slipTypeOther}
							onOtherChange={(value) => updateField('slipTypeOther', value)}
						/>
						{errors.slipTypeOther ? (
							<Typography variant="caption" color="error">
								{errors.slipTypeOther}
							</Typography>
						) : null}
					</Box>

					<Box>
						<SectionHeading>2. Jenis dokumen</SectionHeading>
						<OptionGroup
							options={DOCUMENT_CONFIDENTIALITY_OPTIONS}
							selected={form.documentConfidentiality}
							onToggle={(value) => handleToggle('documentConfidentiality', value, true)}
							otherValue={form.documentConfidentialityOther}
							onOtherChange={(value) => updateField('documentConfidentialityOther', value)}
						/>
						{errors.documentConfidentialityOther ? (
							<Typography variant="caption" color="error">
								{errors.documentConfidentialityOther}
							</Typography>
						) : null}
					</Box>

					<Box>
						<SectionHeading>3. Jenis Barang</SectionHeading>
						<OptionGroup
							options={GOODS_TYPE_OPTIONS}
							selected={form.goodsTypes}
							onToggle={(value) => handleToggle('goodsTypes', value)}
							otherValue={form.goodsTypeOther}
							onOtherChange={(value) => updateField('goodsTypeOther', value)}
						/>
						{errors.goodsTypeOther ? (
							<Typography variant="caption" color="error">
								{errors.goodsTypeOther}
							</Typography>
						) : null}
					</Box>

					<Box>
						<SectionHeading>4. Informasi Penanganan Selama Pengiriman</SectionHeading>
						<OptionGroup
							options={HANDLING_TYPE_OPTIONS}
							selected={form.handlingTypes}
							onToggle={(value) => handleToggle('handlingTypes', value)}
							otherValue={form.handlingTypeOther}
							onOtherChange={(value) => updateField('handlingTypeOther', value)}
						/>
						{errors.handlingTypeOther ? (
							<Typography variant="caption" color="error">
								{errors.handlingTypeOther}
							</Typography>
						) : null}
					</Box>

					<Box>
						<SectionHeading>5. Dikirimkan Untuk</SectionHeading>
						<OptionGroup
							options={PURPOSE_OPTIONS}
							selected={form.purposes}
							onToggle={(value) => handleToggle('purposes', value)}
							otherValue={form.purposeOther}
							onOtherChange={(value) => updateField('purposeOther', value)}
						/>
						{errors.purposeOther ? (
							<Typography variant="caption" color="error">
								{errors.purposeOther}
							</Typography>
						) : null}
					</Box>

					<Divider />

					<Box>
						<Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
							<SectionHeading>6. Keterangan / Detail</SectionHeading>
							<Button size="small" startIcon={<AddOutlinedIcon />} onClick={handleAddItem}>
								Tambah Baris
							</Button>
						</Stack>
						<Stack spacing={1}>
							{form.items.map((item, index) => (
								<Stack key={`item-${index}`} direction="row" spacing={1} alignItems="flex-start">
									<Typography
										sx={{ width: 24, pt: 1, textAlign: 'center', fontWeight: 700, fontSize: 13 }}
									>
										{index + 1}
									</Typography>
									<TextField
										fullWidth
										size="small"
										label="Deskripsi"
										value={item.description}
										onChange={(event) => handleItemChange(index, 'description', event.target.value)}
									/>
									<TextField
										fullWidth
										size="small"
										label="Catatan (jika ada)"
										value={item.note}
										onChange={(event) => handleItemChange(index, 'note', event.target.value)}
									/>
									<IconButton
										size="small"
										color="error"
										disabled={form.items.length <= MIN_ITEM_ROWS}
										onClick={() => handleRemoveItem(index)}
										sx={{ mt: 0.5 }}
									>
										<DeleteOutlineOutlinedIcon fontSize="small" />
									</IconButton>
								</Stack>
							))}
						</Stack>
					</Box>

					<Divider />

					<Box>
						<SectionHeading>7. Informasi</SectionHeading>
						<Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
							Konfirmasi pengiriman dokumen/barang, dapat dipilih sesuai kebutuhan:
						</Typography>
						<Stack spacing={0.5}>
							{CONFIRMATION_MODE_OPTIONS.map((option) => (
								<FormControlLabel
									key={option.value}
									control={
										<Checkbox
											size="small"
											checked={form.confirmationMode === option.value}
											onChange={() => handleToggle('confirmationMode', option.value, true)}
										/>
									}
									label={<Typography variant="body2">{option.label}</Typography>}
								/>
							))}
						</Stack>
						<Grid container spacing={2} sx={{ mt: 0.5 }}>
							<Grid item xs={12} md={6}>
								<TextField
									fullWidth
									size="small"
									label="E-mail tujuan pengembalian"
									value={form.confirmationEmail}
									onChange={(event) => updateField('confirmationEmail', event.target.value)}
								/>
							</Grid>
							<Grid item xs={12} md={6}>
								<TextField
									fullWidth
									size="small"
									multiline
									minRows={2}
									label="Alamat pengembalian"
									value={form.returnAddress}
									onChange={(event) => updateField('returnAddress', event.target.value)}
								/>
							</Grid>
						</Grid>
					</Box>

					<Divider />

					<Grid container spacing={2}>
						<Grid item xs={12} md={6}>
							<Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
								Dikirimkan Oleh
							</Typography>
							<Grid container spacing={2}>
								<Grid item xs={12} md={6}>
									<TextField
										fullWidth
										size="small"
										label="Nama"
										value={form.senderName}
										InputProps={{ readOnly: true }}
										helperText=" "
									/>
								</Grid>
								<Grid item xs={12} md={6}>
									<TextField
										fullWidth
										size="small"
										type="date"
										label="Tanggal"
										value={form.senderDate}
										onChange={(event) => updateField('senderDate', event.target.value)}
										InputLabelProps={{ shrink: true }}
										helperText=" "
									/>
								</Grid>
							</Grid>
						</Grid>
						<Grid item xs={12} md={6}>
							<Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
								Diterima Oleh
							</Typography>
							<Grid container spacing={2}>
								<Grid item xs={12} md={6}>
									<TextField
										fullWidth
										size="small"
										label="Nama Penerima"
										value={form.receiverName}
										onChange={(event) => updateField('receiverName', event.target.value)}
										helperText="Opsional"
									/>
								</Grid>
								<Grid item xs={12} md={6}>
									<TextField
										fullWidth
										size="small"
										label="Posisi Penerima"
										value={form.receiverPosition}
										onChange={(event) => updateField('receiverPosition', event.target.value)}
										helperText="Opsional"
									/>
								</Grid>
								<Grid item xs={12} md={6}>
									<TextField
										fullWidth
										size="small"
										type="date"
										label="Tanggal Diterima"
										value={form.receiverDate}
										onChange={(event) => updateField('receiverDate', event.target.value)}
										InputLabelProps={{ shrink: true }}
										helperText="Opsional"
									/>
								</Grid>
							</Grid>
						</Grid>
					</Grid>
				</Stack>
			</DialogContent>
			<DialogActions sx={{ px: 3, py: 2 }}>
				<Button onClick={onClose} disabled={loading} color="inherit">
					Batal
				</Button>
				<Button onClick={handleSubmit} disabled={loading} variant="contained">
					{loading ? 'Menyimpan...' : 'Simpan'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default DeliverySlipFormDialog;
