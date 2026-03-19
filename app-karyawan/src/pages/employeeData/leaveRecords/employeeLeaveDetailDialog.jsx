import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import formatLeaveDate from './utils';

function formatDateTime(value) {
	if (!value) {
		return '-';
	}

	const parsed = new Date(value);

	if (Number.isNaN(parsed.getTime())) {
		return String(value);
	}

	return parsed.toLocaleString('id-ID');
}

function InfoRow({ label, value }) {
	const displayValue = value === 0 ? '0' : value || '-';

	return (
		<Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
			<Typography variant="body2" color="text.secondary">
				{label}
			</Typography>
			<Typography variant="body2" sx={{ fontWeight: 600, textAlign: { sm: 'right' } }}>
				{displayValue}
			</Typography>
		</Stack>
	);
}

function EmployeeLeaveDetailDialog({ open, loading = false, data, onClose }) {
	let content = (
		<Typography variant="body2" color="text.secondary">
			Detail data cuti karyawan belum tersedia.
		</Typography>
	);

	if (loading) {
		content = (
			<Stack alignItems="center" justifyContent="center" py={8}>
				<CircularProgress />
			</Stack>
		);
	} else if (data) {
		content = (
			<Stack spacing={2.5}>
				<Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
					<Stack spacing={1.5}>
						<Typography variant="h6" sx={{ color: '#123B66', fontWeight: 700 }}>
							Saldo Utama
						</Typography>
						<Divider />
						<Stack spacing={1}>
							<InfoRow label="NO" value={data.id} />
							<InfoRow label="Nama Karyawan" value={data.employeeName} />
							<InfoRow label="NIK" value={data.employeeNo} />
							<InfoRow label="Jenis Cuti" value={data.leaveType} />
							<InfoRow label="Tahun" value={data.year} />
							<InfoRow label="Jumlah Cuti Tahunan" value={data.leaveDays} />
							<InfoRow
								label="Periode"
								value={`${formatLeaveDate(data.periodStart)} - ${formatLeaveDate(data.periodEnd)}`}
							/>
							<InfoRow label="Sisa Cuti" value={data.remainingLeave} />
							<InfoRow label="Catatan" value={data.notes || '-'} />
							<InfoRow label="Total History" value={data.historyCount} />
							<InfoRow label="Terakhir Diupdate" value={formatDateTime(data.updatedAt)} />
						</Stack>
					</Stack>
				</Paper>

				<Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
					<Stack spacing={1.5}>
						<Typography variant="h6" sx={{ color: '#123B66', fontWeight: 700 }}>
							History Cuti
						</Typography>
						{data.histories?.length ? (
							<TableContainer>
								<Table size="small">
									<TableHead>
										<TableRow>
											<TableCell>Tanggal</TableCell>
											<TableCell>Sumber</TableCell>
											<TableCell>Request</TableCell>
											<TableCell>Periode</TableCell>
											<TableCell>Jumlah</TableCell>
											<TableCell>Saldo Sebelum</TableCell>
											<TableCell>Saldo Sesudah</TableCell>
											<TableCell>Catatan</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{data.histories.map((item) => (
											<TableRow hover key={item.id}>
												<TableCell>{formatDateTime(item.changeDate)}</TableCell>
												<TableCell>{item.sourceLabel}</TableCell>
												<TableCell>{item.requestNumber || '-'}</TableCell>
												<TableCell>
													{`${formatLeaveDate(item.periodStart)} - ${formatLeaveDate(
														item.periodEnd,
													)}`}
												</TableCell>
												<TableCell>{item.leaveDays}</TableCell>
												<TableCell>{item.balanceBefore}</TableCell>
												<TableCell>{item.balanceAfter}</TableCell>
												<TableCell>{item.notes || '-'}</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</TableContainer>
						) : (
							<Typography variant="body2" color="text.secondary">
								Belum ada history untuk data cuti ini.
							</Typography>
						)}
					</Stack>
				</Paper>
			</Stack>
		);
	}

	return (
		<Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
			<DialogTitle>Detail Data Cuti Karyawan</DialogTitle>
			<DialogContent dividers>{content}</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>Tutup</Button>
			</DialogActions>
		</Dialog>
	);
}

export default EmployeeLeaveDetailDialog;
