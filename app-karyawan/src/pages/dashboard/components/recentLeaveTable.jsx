import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router-dom';

import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';

import { DRILL_DOWN, LEAVE_STATUS_MAP, formatDate } from '../constants';
import { SectionCard, SectionLink, EmptyState } from './sectionCard';

/** Latest leave requests across all statuses. */
function RecentLeaveTable({ recentLeaves = [], delay = 0 }) {
	const navigate = useNavigate();

	return (
		<SectionCard
			title="Pengajuan cuti terbaru"
			subtitle={`${recentLeaves.length} pengajuan terakhir`}
			delay={delay}
			contentSx={{ pb: 1 }}
			footer={<SectionLink href={DRILL_DOWN.leaves} label="Lihat semua pengajuan cuti" />}
		>
			{recentLeaves.length === 0 ? (
				<EmptyState
					icon={EventNoteOutlinedIcon}
					title="Belum ada pengajuan cuti"
					description="Pengajuan terbaru akan muncul di sini."
				/>
			) : (
				<TableContainer sx={{ overflowX: 'auto' }}>
					<Table size="small" aria-label="Pengajuan cuti terbaru" sx={{ minWidth: 380 }}>
						<TableHead>
							<TableRow>
								<TableCell sx={{ fontWeight: 700, pl: 0 }}>Karyawan</TableCell>
								<TableCell sx={{ fontWeight: 700 }}>Cuti</TableCell>
								<TableCell sx={{ fontWeight: 700 }}>Diajukan</TableCell>
								<TableCell sx={{ fontWeight: 700, pr: 0 }} align="right">
									Status
								</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{recentLeaves.map((item) => {
								const status = LEAVE_STATUS_MAP[item.status] || LEAVE_STATUS_MAP.SUBMITTED;

								return (
									<TableRow
										key={item.id}
										hover
										onClick={() => navigate(DRILL_DOWN.leaves)}
										sx={{ cursor: 'pointer', '&:last-child td': { borderBottom: 0 } }}
									>
										<TableCell sx={{ pl: 0 }}>
											<Typography variant="body2" fontWeight={600} noWrap>
												{item.employeeName}
											</Typography>
											<Typography variant="caption" color="text.secondary">
												{item.employeeNo}
											</Typography>
										</TableCell>
										<TableCell>
											<Typography variant="body2" noWrap>
												{item.leaveType}
											</Typography>
											<Typography
												variant="caption"
												color="text.secondary"
												noWrap
												sx={{ fontVariantNumeric: 'tabular-nums' }}
											>
												{item.leaveDays} hari
											</Typography>
										</TableCell>
										<TableCell>
											<Typography
												variant="body2"
												noWrap
												sx={{ fontVariantNumeric: 'tabular-nums' }}
											>
												{formatDate(item.createdAt)}
											</Typography>
										</TableCell>
										<TableCell align="right" sx={{ pr: 0 }}>
											<Chip
												size="small"
												color={status.color}
												variant="outlined"
												label={status.label}
												sx={{ fontWeight: 600, height: 20, fontSize: 11 }}
											/>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</TableContainer>
			)}
		</SectionCard>
	);
}

export default RecentLeaveTable;
