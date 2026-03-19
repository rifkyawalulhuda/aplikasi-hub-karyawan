import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { formatLongDate } from '@/utils/employeePortal';

import LeaveStatusChip from './leaveStatusChip';

function LeaveRequestTimeline({ revisions = [], approvals = [] }) {
	if (!revisions.length) {
		return null;
	}

	return (
		<Stack spacing={2}>
			{revisions.map((revision) => {
				const revisionApprovals = approvals.filter((approval) => approval.revisionNo === revision.revisionNo);

				return (
					<Paper key={revision.revisionNo} sx={{ p: 2.25, borderRadius: 4 }}>
						<Stack spacing={1.5}>
							<Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
								<Typography variant="subtitle1" sx={{ color: '#123B66', fontWeight: 700 }}>
									Revisi {revision.revisionNo}
								</Typography>
								<LeaveStatusChip status={revision.status} label={revision.statusLabel} />
							</Stack>
							<Typography variant="body2" color="text.secondary">
								{formatLongDate(revision.periodStart)} - {formatLongDate(revision.periodEnd)}
								{' | '}
								{revision.leaveDays} hari
							</Typography>
							<Typography variant="body2" color="text.secondary">
								Saldo sebelum: {revision.balanceBefore} | Saldo setelah: {revision.remainingLeave}
							</Typography>
							<Typography variant="body2" color="text.secondary">
								Catatan pengajuan: {revision.notes || '-'}
							</Typography>
							{revision.rejectionNote ? (
								<Typography variant="body2" color="error.main">
									Alasan reject: {revision.rejectionNote}
								</Typography>
							) : null}
							<Divider />
							<Stack spacing={1}>
								{revisionApprovals.length ? (
									revisionApprovals.map((approval) => (
										<Paper
											key={approval.id}
											variant="outlined"
											sx={{ p: 1.5, borderRadius: 3, borderColor: 'rgba(18,59,102,0.12)' }}
										>
											<Stack spacing={0.75}>
												<Stack
													direction="row"
													justifyContent="space-between"
													alignItems="center"
													spacing={1}
												>
													<Typography
														variant="body2"
														sx={{ color: '#123B66', fontWeight: 700 }}
													>
														Tahap {approval.stageOrder} - {approval.stageLabel}
													</Typography>
													<LeaveStatusChip
														status={approval.status}
														label={approval.statusLabel}
														variant="outlined"
													/>
												</Stack>
												<Typography variant="body2" color="text.secondary">
													{approval.approver.fullName} | {approval.approver.jobLevelName}
												</Typography>
												{approval.actionNote ? (
													<Typography variant="body2" color="text.secondary">
														Catatan: {approval.actionNote}
													</Typography>
												) : null}
											</Stack>
										</Paper>
									))
								) : (
									<Typography variant="body2" color="text.secondary">
										Belum ada stage approval pada revisi ini.
									</Typography>
								)}
							</Stack>
						</Stack>
					</Paper>
				);
			})}
		</Stack>
	);
}

export default LeaveRequestTimeline;
