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

import LeaveRequestTimeline from '@/components/employeePortal/leaveRequestTimeline';
import LeaveStatusChip from '@/components/employeePortal/leaveStatusChip';
import { formatLongDate } from '@/utils/employeePortal';

function InfoRow({ label, value }) {
	return (
		<Stack direction="row" justifyContent="space-between" spacing={2}>
			<Typography variant="body2" color="text.secondary">
				{label}
			</Typography>
			<Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right' }}>
				{value || '-'}
			</Typography>
		</Stack>
	);
}

function LeaveRequestDetailDialog({ open, loading = false, data, title = 'Detail Request Cuti', onClose }) {
	let content = (
		<Typography variant="body2" color="text.secondary">
			Detail request cuti belum tersedia.
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
						<Stack
							direction={{ xs: 'column', sm: 'row' }}
							justifyContent="space-between"
							alignItems={{ xs: 'flex-start', sm: 'center' }}
							spacing={1}
						>
							<Stack spacing={0.5}>
								<Typography variant="h6" sx={{ color: '#123B66', fontWeight: 700 }}>
									{data.requestNumber}
								</Typography>
								<Typography variant="body2" color="text.secondary">
									{data.employeeName} ({data.employeeNo})
								</Typography>
							</Stack>
							<LeaveStatusChip status={data.status} label={data.statusLabel} />
						</Stack>
						<Divider />
						<Stack spacing={1}>
							<InfoRow label="Jenis cuti" value={data.leaveType} />
							<InfoRow
								label="Periode"
								value={`${formatLongDate(data.periodStart)} - ${formatLongDate(data.periodEnd)}`}
							/>
							<InfoRow label="Jumlah hari" value={`${data.leaveDays || 0} hari`} />
							<InfoRow label="Tahun cuti" value={data.leaveYear} />
							<InfoRow label="Revisi aktif" value={`Revisi ${data.revisionNo || 1}`} />
							<InfoRow label="Saldo sebelum" value={data.balanceBefore} />
							<InfoRow label="Saldo setelah" value={data.remainingLeave} />
							<InfoRow label="Stage aktif" value={data.activeStageLabel || '-'} />
							<InfoRow
								label="Tanggal submit"
								value={data.submittedAt ? new Date(data.submittedAt).toLocaleString('id-ID') : '-'}
							/>
							{data.approvedAt ? (
								<InfoRow
									label="Tanggal approved"
									value={new Date(data.approvedAt).toLocaleString('id-ID')}
								/>
							) : null}
							{data.rejectedAt ? (
								<InfoRow
									label="Tanggal rejected"
									value={new Date(data.rejectedAt).toLocaleString('id-ID')}
								/>
							) : null}
							{data.cancelledAt ? (
								<InfoRow
									label="Tanggal cancel"
									value={new Date(data.cancelledAt).toLocaleString('id-ID')}
								/>
							) : null}
							<InfoRow label="Catatan pengajuan" value={data.notes || '-'} />
							{data.rejectionNote ? (
								<InfoRow label="Catatan reject terakhir" value={data.rejectionNote} />
							) : null}
						</Stack>
					</Stack>
				</Paper>

				<Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
					<Stack spacing={1.5}>
						<Typography variant="h6" sx={{ color: '#123B66', fontWeight: 700 }}>
							Timeline Approval
						</Typography>
						<LeaveRequestTimeline revisions={data.revisions || []} approvals={data.approvals || []} />
					</Stack>
				</Paper>

				<Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
					<Stack spacing={1.5}>
						<Typography variant="h6" sx={{ color: '#123B66', fontWeight: 700 }}>
							Log Email
						</Typography>
						{data.emailOutbox?.length ? (
							<TableContainer>
								<Table size="small">
									<TableHead>
										<TableRow>
											<TableCell>Revisi</TableCell>
											<TableCell>Penerima</TableCell>
											<TableCell>Subject</TableCell>
											<TableCell>Status</TableCell>
											<TableCell>Waktu</TableCell>
											<TableCell>Error</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{data.emailOutbox.map((item) => (
											<TableRow key={item.id} hover>
												<TableCell>{item.revisionNo || '-'}</TableCell>
												<TableCell>
													<Stack spacing={0.25}>
														<Typography variant="body2">
															{item.recipientName || '-'}
														</Typography>
														<Typography variant="caption" color="text.secondary">
															{item.recipientEmail}
														</Typography>
													</Stack>
												</TableCell>
												<TableCell>{item.subject}</TableCell>
												<TableCell>
													<LeaveStatusChip
														status={item.status}
														label={item.status}
														variant="outlined"
													/>
												</TableCell>
												<TableCell>
													{item.sentAt ? new Date(item.sentAt).toLocaleString('id-ID') : '-'}
												</TableCell>
												<TableCell>{item.errorMessage || '-'}</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</TableContainer>
						) : (
							<Typography variant="body2" color="text.secondary">
								Belum ada log email untuk request ini.
							</Typography>
						)}
					</Stack>
				</Paper>
			</Stack>
		);
	}

	return (
		<Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
			<DialogTitle>{title}</DialogTitle>
			<DialogContent dividers>{content}</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>Tutup</Button>
			</DialogActions>
		</Dialog>
	);
}

export default LeaveRequestDetailDialog;
