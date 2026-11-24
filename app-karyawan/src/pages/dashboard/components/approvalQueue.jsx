import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';

import { DRILL_DOWN, LEAVE_STATUS_MAP, formatDate, formatNumber } from '../constants';
import { SectionCard, SectionLink, EmptyState } from './sectionCard';

const PENDING_STATUSES = ['SUBMITTED', 'IN_APPROVAL'];
const DECIDED_STATUSES = ['APPROVED', 'REJECTED', 'CANCELLED'];

function initialsOf(name = '') {
	return name
		.split(' ')
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0])
		.join('')
		.toUpperCase();
}

/** Pending leave approvals, one click away from the leave module. */
function ApprovalQueue({ pendingLeaves = [], recentLeaves = [], summary, periodLabel, delay = 0 }) {
	const navigate = useNavigate();
	const theme = useTheme();
	const pending = pendingLeaves.filter((item) => PENDING_STATUSES.includes(item.status)).slice(0, 5);
	const recentDecisions = recentLeaves.filter((item) => DECIDED_STATUSES.includes(item.status)).slice(0, 3);

	const submitted = summary?.submittedLeaveRequests || 0;
	const inApproval = summary?.inApprovalLeaveRequests || 0;
	const totalPending = summary?.activeLeaveRequests || 0;

	const breakdown = (summary?.leaveStatusBreakdown || []).map((item) => {
		const meta = LEAVE_STATUS_MAP[item.status] || LEAVE_STATUS_MAP.SUBMITTED;

		return {
			...item,
			label: meta.label,
			color: meta.color === 'default' ? theme.palette.text.disabled : theme.palette[meta.color].main,
		};
	});
	const breakdownTotal = breakdown.reduce((sum, item) => sum + item.count, 0);

	return (
		<SectionCard
			title="Menunggu persetujuan"
			subtitle={`${formatNumber(totalPending)} pengajuan cuti belum selesai`}
			delay={delay}
			contentSx={{ display: 'flex', flexDirection: 'column' }}
			footer={<SectionLink href={DRILL_DOWN.leaves} label="Buka modul cuti karyawan" />}
		>
			{totalPending > 0 ? (
				<Stack direction="row" flexWrap="wrap" sx={{ mb: 1.5, gap: 1 }}>
					<Chip size="small" color="info" variant="outlined" label={`${submitted} diajukan`} />
					<Chip size="small" color="warning" variant="outlined" label={`${inApproval} dalam approval`} />
				</Stack>
			) : null}

			<Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
				{pending.length === 0 ? (
					<>
						<EmptyState
							icon={TaskAltOutlinedIcon}
							tone="success"
							title="Tidak ada pengajuan yang menunggu"
							description="Semua pengajuan cuti sudah diproses."
							minHeight={0}
						/>
						{recentDecisions.length > 0 ? (
							<Box sx={{ mt: 2 }}>
								<Typography
									variant="caption"
									fontWeight={700}
									color="text.secondary"
									letterSpacing={0.4}
									textTransform="uppercase"
									fontSize="0.7rem"
									display="block"
									sx={{ mb: 0.5 }}
								>
									Terakhir diproses
								</Typography>
								<List disablePadding>
									{recentDecisions.map((item, index) => {
										const status = LEAVE_STATUS_MAP[item.status] || LEAVE_STATUS_MAP.CANCELLED;

										return (
											<Box key={item.id}>
												{index > 0 ? <Divider component="li" /> : null}
												<Stack
													direction="row"
													alignItems="center"
													justifyContent="space-between"
													gap={1}
													sx={{ py: 0.85 }}
												>
													<Box sx={{ minWidth: 0 }}>
														<Typography variant="body2" fontWeight={600} noWrap>
															{item.employeeName}
														</Typography>
														<Typography
															variant="caption"
															color="text.secondary"
															display="block"
															noWrap
														>
															{item.leaveType} · {item.leaveDays} hari ·{' '}
															{formatDate(item.createdAt)}
														</Typography>
													</Box>
													<Chip
														size="small"
														color={status.color}
														label={status.label}
														sx={{
															height: 20,
															fontSize: 11,
															fontWeight: 600,
															flexShrink: 0,
														}}
													/>
												</Stack>
											</Box>
										);
									})}
								</List>
							</Box>
						) : null}
					</>
				) : (
					<List disablePadding sx={{ mt: 0.5 }}>
						{pending.map((item, index) => {
							const status = LEAVE_STATUS_MAP[item.status] || LEAVE_STATUS_MAP.SUBMITTED;

							return (
								<Box key={item.id}>
									{index > 0 ? <Divider component="li" /> : null}
									<ListItemButton
										onClick={() => navigate(DRILL_DOWN.leaves)}
										sx={{ px: 0.5, py: 1, borderRadius: 1.5, alignItems: 'flex-start' }}
									>
										<Avatar
											sx={(theme) => ({
												width: 32,
												height: 32,
												mr: 1.5,
												mt: 0.25,
												fontSize: 12,
												fontWeight: 700,
												bgcolor: alpha(theme.palette.primary.main, 0.12),
												color: 'primary.main',
											})}
										>
											{initialsOf(item.employeeName)}
										</Avatar>
										<Box sx={{ minWidth: 0, flexGrow: 1 }}>
											<Stack
												direction="row"
												justifyContent="space-between"
												alignItems="center"
												gap={1}
											>
												<Typography variant="body2" fontWeight={600} noWrap>
													{item.employeeName}
												</Typography>
												<Chip
													size="small"
													color={status.color}
													label={status.label}
													sx={{ height: 20, fontSize: 11, fontWeight: 600 }}
												/>
											</Stack>
											<Typography variant="caption" color="text.secondary" display="block" noWrap>
												{item.leaveType} · {item.leaveDays} hari · diajukan{' '}
												{formatDate(item.createdAt)}
											</Typography>
										</Box>
									</ListItemButton>
								</Box>
							);
						})}
					</List>
				)}
			</Box>

			<Box sx={{ mt: 'auto', pt: 1.5, borderTop: 1, borderColor: 'divider' }}>
				<Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 1 }}>
					<Typography
						variant="caption"
						fontWeight={700}
						color="text.secondary"
						letterSpacing={0.4}
						textTransform="uppercase"
						fontSize="0.7rem"
					>
						Status pengajuan
					</Typography>
					<Typography variant="caption" color="text.secondary">
						{periodLabel}
					</Typography>
				</Stack>

				{breakdownTotal === 0 ? (
					<Typography variant="caption" color="text.secondary">
						Belum ada pengajuan cuti pada periode ini.
					</Typography>
				) : (
					<>
						<Stack
							direction="row"
							sx={{ height: 8, borderRadius: 4, overflow: 'hidden', bgcolor: 'action.hover', gap: '2px' }}
							role="img"
							aria-label={breakdown.map((item) => `${item.label} ${item.count}`).join(', ')}
						>
							{breakdown
								.filter((item) => item.count > 0)
								.map((item) => (
									<Box
										key={item.status}
										sx={{
											width: `${(item.count / breakdownTotal) * 100}%`,
											bgcolor: item.color,
											borderRadius: 1,
										}}
									/>
								))}
						</Stack>
						<Box
							sx={{
								mt: 1,
								display: 'grid',
								gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
								columnGap: 1.5,
								rowGap: 0.5,
							}}
						>
							{breakdown.map((item) => (
								<Stack key={item.status} direction="row" alignItems="center" spacing={0.75}>
									<Box
										sx={{
											width: 7,
											height: 7,
											borderRadius: '50%',
											bgcolor: item.color,
											flexShrink: 0,
										}}
									/>
									<Typography variant="caption" color="text.secondary" noWrap sx={{ flexGrow: 1 }}>
										{item.label}
									</Typography>
									<Typography
										variant="caption"
										fontWeight={700}
										sx={{ fontVariantNumeric: 'tabular-nums' }}
									>
										{formatNumber(item.count)}
									</Typography>
								</Stack>
							))}
						</Box>
					</>
				)}
			</Box>
		</SectionCard>
	);
}

export default ApprovalQueue;
