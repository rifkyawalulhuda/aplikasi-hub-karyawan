import { useState, useEffect, useCallback } from 'react';
import {
	Box,
	Card,
	CardContent,
	Typography,
	Switch,
	FormControlLabel,
	TextField,
	Button,
	IconButton,
	Chip,
	Divider,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	Checkbox,
	Tooltip,
	CircularProgress,
	Alert,
	InputAdornment,
	MenuItem,
	Select,
	FormControl,
	InputLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';

import apiRequest from '@/services/api';

function SectionHeader({ icon: Icon, title, description }) {
	return (
		<Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2.5 }}>
			<Box
				sx={{
					width: 40,
					height: 40,
					borderRadius: 2,
					bgcolor: 'primary.50',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					flexShrink: 0,
				}}
			>
				<Icon sx={{ fontSize: 20, color: 'primary.main' }} />
			</Box>
			<Box>
				<Typography variant="subtitle1" fontWeight={600}>
					{title}
				</Typography>
				{description && (
					<Typography variant="body2" color="text.secondary">
						{description}
					</Typography>
				)}
			</Box>
		</Box>
	);
}

function getChipColor(val) {
	if (val === 0) return 'error';
	if (val <= 30) return 'warning';
	return 'primary';
}

function ThresholdChip({ val, onRemove }) {
	const handleDelete = useCallback(() => onRemove(val), [onRemove, val]);
	return (
		<Chip
			key={val}
			label={val === 0 ? 'Hari-H (0)' : `${val} hari`}
			onDelete={handleDelete}
			color={getChipColor(val)}
			variant="outlined"
			size="small"
		/>
	);
}

function ThresholdEditor({ label, thresholds, onChange }) {
	const [inputValue, setInputValue] = useState('');
	const [error, setError] = useState('');

	const handleAdd = useCallback(() => {
		const val = parseInt(inputValue, 10);
		if (Number.isNaN(val) || val < 0) {
			setError('Masukkan angka ≥ 0');
			return;
		}
		if (thresholds.includes(val)) {
			setError('Threshold sudah ada');
			return;
		}
		onChange([...thresholds, val].sort((a, b) => b - a));
		setInputValue('');
		setError('');
	}, [inputValue, thresholds, onChange]);

	const handleRemove = useCallback(
		(val) => {
			onChange(thresholds.filter((t) => t !== val));
		},
		[thresholds, onChange],
	);

	const handleKeyDown = useCallback(
		(e) => {
			if (e.key === 'Enter') {
				e.preventDefault();
				handleAdd();
			}
		},
		[handleAdd],
	);

	const handleInputChange = useCallback((e) => {
		setInputValue(e.target.value);
		setError('');
	}, []);

	return (
		<Box>
			<Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
				{label}
			</Typography>
			<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2, minHeight: 36 }}>
				{thresholds.length === 0 && (
					<Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
						Belum ada threshold. Tambahkan di bawah.
					</Typography>
				)}
				{thresholds.map((val) => (
					<ThresholdChip key={val} val={val} onRemove={handleRemove} />
				))}
			</Box>
			<Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
				<TextField
					size="small"
					type="number"
					value={inputValue}
					onChange={handleInputChange}
					onKeyDown={handleKeyDown}
					placeholder="contoh: 45"
					error={Boolean(error)}
					helperText={error || 'Hari sebelum kadaluarsa (0 = hari H)'}
					slotProps={{
						input: {
							endAdornment: <InputAdornment position="end">hari</InputAdornment>,
							inputProps: { min: 0, max: 365 },
						},
					}}
					sx={{ width: 180 }}
				/>
				<Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={handleAdd} sx={{ mt: 0.25 }}>
					Tambah
				</Button>
			</Box>
		</Box>
	);
}

function RecipientRow({ recipient, index, onToggle, onRemove }) {
	const handleToggle = useCallback(() => onToggle(index), [onToggle, index]);
	const handleRemove = useCallback(() => onRemove(index), [onRemove, index]);
	return (
		<TableRow hover>
			<TableCell padding="checkbox">
				<Checkbox checked={recipient.isActive} onChange={handleToggle} size="small" color="primary" />
			</TableCell>
			<TableCell>
				<Typography variant="body2" sx={{ opacity: recipient.isActive ? 1 : 0.5 }}>
					{recipient.email}
				</Typography>
			</TableCell>
			<TableCell>
				<Typography variant="body2" color="text.secondary" sx={{ opacity: recipient.isActive ? 1 : 0.5 }}>
					{recipient.name || '-'}
				</Typography>
			</TableCell>
			<TableCell align="right">
				<Tooltip title="Hapus penerima">
					<IconButton size="small" onClick={handleRemove} color="error">
						<DeleteOutlineIcon fontSize="small" />
					</IconButton>
				</Tooltip>
			</TableCell>
		</TableRow>
	);
}

function RecipientTable({ recipients, onChange }) {
	const [newEmail, setNewEmail] = useState('');
	const [newName, setNewName] = useState('');
	const [addError, setAddError] = useState('');

	function validateEmail(email) {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
	}

	const handleAdd = useCallback(() => {
		const email = newEmail.trim();
		const name = newName.trim();

		if (!email) {
			setAddError('Email wajib diisi.');
			return;
		}
		if (!validateEmail(email)) {
			setAddError('Format email tidak valid.');
			return;
		}
		if (recipients.some((r) => r.email.toLowerCase() === email.toLowerCase())) {
			setAddError('Email sudah ada dalam daftar.');
			return;
		}

		onChange([...recipients, { email, name, isActive: true }]);
		setNewEmail('');
		setNewName('');
		setAddError('');
	}, [newEmail, newName, recipients, onChange]);

	const handleToggle = useCallback(
		(index) => {
			onChange(recipients.map((r, i) => (i === index ? { ...r, isActive: !r.isActive } : r)));
		},
		[recipients, onChange],
	);

	const handleRemove = useCallback(
		(index) => {
			onChange(recipients.filter((_, i) => i !== index));
		},
		[recipients, onChange],
	);

	const handleEmailChange = useCallback((e) => {
		setNewEmail(e.target.value);
		setAddError('');
	}, []);

	const handleNameChange = useCallback((e) => {
		setNewName(e.target.value);
	}, []);

	const handleEmailKeyDown = useCallback(
		(e) => {
			if (e.key === 'Enter') handleAdd();
		},
		[handleAdd],
	);

	const handleNameKeyDown = useCallback(
		(e) => {
			if (e.key === 'Enter') handleAdd();
		},
		[handleAdd],
	);

	return (
		<Box>
			{recipients.length > 0 && (
				<Table size="small" sx={{ mb: 2 }}>
					<TableHead>
						<TableRow>
							<TableCell padding="checkbox">Aktif</TableCell>
							<TableCell>Email</TableCell>
							<TableCell>Nama</TableCell>
							<TableCell align="right">Hapus</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{recipients.map((r, i) => (
							<RecipientRow
								key={r.email}
								recipient={r}
								index={i}
								onToggle={handleToggle}
								onRemove={handleRemove}
							/>
						))}
					</TableBody>
				</Table>
			)}

			<Box
				sx={{
					display: 'flex',
					gap: 1,
					alignItems: 'flex-start',
					flexWrap: 'wrap',
					p: 2,
					bgcolor: 'grey.50',
					borderRadius: 2,
					border: '1px dashed',
					borderColor: 'grey.300',
				}}
			>
				<TextField
					size="small"
					label="Email penerima"
					type="email"
					value={newEmail}
					onChange={handleEmailChange}
					onKeyDown={handleEmailKeyDown}
					error={Boolean(addError)}
					helperText={addError}
					sx={{ flex: '1 1 200px', minWidth: 200 }}
				/>
				<TextField
					size="small"
					label="Nama (opsional)"
					value={newName}
					onChange={handleNameChange}
					onKeyDown={handleNameKeyDown}
					sx={{ flex: '1 1 160px', minWidth: 160 }}
				/>
				<Button
					variant="contained"
					size="small"
					startIcon={<AddIcon />}
					onClick={handleAdd}
					sx={{ mt: 0.25, flexShrink: 0 }}
				>
					Tambah Penerima
				</Button>
			</Box>
		</Box>
	);
}

export default function EmailNotificationSettingsPage() {
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [testing, setTesting] = useState(false);
	const [pageAlert, setPageAlert] = useState(null);

	const [isEnabled, setIsEnabled] = useState(false);
	const [sendHour, setSendHour] = useState(7);
	const [unitThresholds, setUnitThresholds] = useState([90, 60, 30, 0]);
	const [employeeThresholds, setEmployeeThresholds] = useState([90, 60, 30, 0]);
	const [recipients, setRecipients] = useState([]);

	const showAlert = useCallback((type, message, duration = 5000) => {
		setPageAlert({ type, message });
		setTimeout(() => setPageAlert(null), duration);
	}, []);

	useEffect(() => {
		setLoading(true);
		apiRequest('/admin/email-notification-settings')
			.then((data) => {
				setIsEnabled(data.isEnabled ?? false);
				setSendHour(data.sendHour ?? 7);
				setUnitThresholds(data.unitThresholds ?? [90, 60, 30, 0]);
				setEmployeeThresholds(data.employeeThresholds ?? [90, 60, 30, 0]);
				setRecipients(data.recipients ?? []);
			})
			.catch((err) => showAlert('error', err.message))
			.finally(() => setLoading(false));
	}, [showAlert]);

	const handleSave = useCallback(async () => {
		setSaving(true);
		try {
			await apiRequest('/admin/email-notification-settings', {
				method: 'PUT',
				body: JSON.stringify({
					isEnabled,
					sendHour,
					unitThresholds,
					employeeThresholds,
					recipients,
				}),
			});
			showAlert('success', 'Pengaturan berhasil disimpan.');
		} catch (err) {
			showAlert('error', err.message);
		} finally {
			setSaving(false);
		}
	}, [isEnabled, sendHour, unitThresholds, employeeThresholds, recipients, showAlert]);

	const handleTest = useCallback(async () => {
		setTesting(true);
		try {
			const result = await apiRequest('/admin/email-notification-settings/test', { method: 'POST' });
			showAlert('success', result.message);
		} catch (err) {
			showAlert('error', err.message);
		} finally {
			setTesting(false);
		}
	}, [showAlert]);

	const handleEnabledChange = useCallback((e) => setIsEnabled(e.target.checked), []);
	const handleHourChange = useCallback((e) => setSendHour(Number(e.target.value)), []);
	const handleAlertClose = useCallback(() => setPageAlert(null), []);

	const hours = Array.from({ length: 24 }, (_, i) => i);

	if (loading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
				<CircularProgress />
			</Box>
		);
	}

	return (
		<Box sx={{ maxWidth: 860, mx: 'auto', p: { xs: 2, md: 3 } }}>
			{/* Page Header */}
			<Box sx={{ mb: 3 }}>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
					<EmailOutlinedIcon sx={{ color: 'primary.main', fontSize: 28 }} />
					<Typography variant="h5" fontWeight={700}>
						Pengaturan Email Notifikasi
					</Typography>
				</Box>
				<Typography variant="body2" color="text.secondary">
					Konfigurasi notifikasi email otomatis untuk lisensi &amp; sertifikasi yang akan kadaluarsa.
				</Typography>
			</Box>

			{/* Alert */}
			{pageAlert && (
				<Alert severity={pageAlert.type} sx={{ mb: 2 }} onClose={handleAlertClose}>
					{pageAlert.message}
				</Alert>
			)}

			<Stack spacing={3}>
				{/* Section 1: Enable & Schedule */}
				<Card variant="outlined">
					<CardContent>
						<SectionHeader
							icon={NotificationsActiveOutlinedIcon}
							title="Status & Jadwal"
							description="Aktifkan notifikasi dan atur jam pengiriman harian."
						/>
						<Stack spacing={2.5}>
							<FormControlLabel
								control={<Switch checked={isEnabled} onChange={handleEnabledChange} color="primary" />}
								label={
									<Box>
										<Typography variant="body2" fontWeight={500}>
											{isEnabled ? 'Notifikasi Aktif' : 'Notifikasi Nonaktif'}
										</Typography>
										<Typography variant="caption" color="text.secondary">
											{isEnabled
												? 'Email akan dikirim otomatis setiap hari pada jam yang ditentukan.'
												: 'Email tidak akan dikirim sampai notifikasi diaktifkan.'}
										</Typography>
									</Box>
								}
							/>

							<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
								<AccessTimeOutlinedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
								<FormControl size="small" sx={{ minWidth: 160 }}>
									<InputLabel>Jam Pengiriman</InputLabel>
									<Select value={sendHour} label="Jam Pengiriman" onChange={handleHourChange}>
										{hours.map((h) => (
											<MenuItem key={h} value={h}>
												{String(h).padStart(2, '0')}:00 WIB
											</MenuItem>
										))}
									</Select>
								</FormControl>
								<Typography variant="caption" color="text.secondary">
									Notifikasi akan dikirim setiap hari pada jam tersebut.
								</Typography>
							</Box>
						</Stack>
					</CardContent>
				</Card>

				{/* Section 2: Unit Thresholds */}
				<Card variant="outlined">
					<CardContent>
						<SectionHeader
							icon={LocalShippingOutlinedIcon}
							title="Threshold Lisensi & Sertifikasi Unit"
							description="Tentukan berapa hari sebelum kadaluarsa notifikasi dikirim untuk sertifikasi unit."
						/>
						<ThresholdEditor
							label="Kirim notifikasi pada hari-hari berikut sebelum kadaluarsa:"
							thresholds={unitThresholds}
							onChange={setUnitThresholds}
						/>
					</CardContent>
				</Card>

				{/* Section 3: Employee Thresholds */}
				<Card variant="outlined">
					<CardContent>
						<SectionHeader
							icon={BadgeOutlinedIcon}
							title="Threshold Lisensi & Sertifikasi Karyawan"
							description="Tentukan berapa hari sebelum kadaluarsa notifikasi dikirim untuk sertifikasi karyawan."
						/>
						<ThresholdEditor
							label="Kirim notifikasi pada hari-hari berikut sebelum kadaluarsa:"
							thresholds={employeeThresholds}
							onChange={setEmployeeThresholds}
						/>
					</CardContent>
				</Card>

				{/* Section 4: Recipients */}
				<Card variant="outlined">
					<CardContent>
						<SectionHeader
							icon={PeopleOutlinedIcon}
							title="Penerima Email"
							description="Tambahkan alamat email yang akan menerima notifikasi kadaluarsa. Centang untuk mengaktifkan."
						/>
						<RecipientTable recipients={recipients} onChange={setRecipients} />
					</CardContent>
				</Card>

				{/* Actions */}
				<Divider />
				<Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
					<Button
						variant="outlined"
						startIcon={testing ? <CircularProgress size={16} /> : <SendOutlinedIcon />}
						onClick={handleTest}
						disabled={testing || saving}
					>
						Kirim Test Email
					</Button>
					<Button
						variant="contained"
						startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveOutlinedIcon />}
						onClick={handleSave}
						disabled={saving || testing}
					>
						Simpan Pengaturan
					</Button>
				</Box>
			</Stack>
		</Box>
	);
}
