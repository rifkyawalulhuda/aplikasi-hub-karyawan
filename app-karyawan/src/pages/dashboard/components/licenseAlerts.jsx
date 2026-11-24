import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';

import { DRILL_DOWN, describeRemainingDays, formatDate } from '../constants';
import { SectionCard, SectionLink, EmptyState } from './sectionCard';

const MAX_ROWS = 6;

const KIND_CONFIG = {
	KARYAWAN: { label: 'Karyawan', column: 'Karyawan', href: DRILL_DOWN.licenses },
	UNIT: { label: 'Unit', column: 'Unit', href: DRILL_DOWN.unitLicenses },
};

function statusTone(daysRemaining) {
	if (daysRemaining < 0) {
		return 'error.main';
	}

	if (daysRemaining <= 7) {
		return 'warning.main';
	}

	return 'warning.dark';
}

/** Lists employee/unit certificates that are expired or about to expire. */
function LicenseAlerts({ alerts = [], summary, soonDays = 25, delay = 0 }) {
	const [kind, setKind] = useState('KARYAWAN');

	const counts = {
		KARYAWAN: (summary?.expiredEmployeeLicenses || 0) + (summary?.expiringSoonEmployeeLicenses || 0),
		UNIT: (summary?.expiredUnitLicenses || 0) + (summary?.expiringSoonUnitLicenses || 0),
	};

	const rows = useMemo(() => alerts.filter((alert) => alert.kind === kind).slice(0, MAX_ROWS), [alerts, kind]);
	const config = KIND_CONFIG[kind];
	const totalIssue = counts.KARYAWAN + counts.UNIT;

	return (
		<SectionCard
			title="Lisensi & sertifikasi perlu tindakan"
			subtitle={`${summary?.expiredLicenses ?? 0} sudah expired · ${
				summary?.expiringSoonLicenses ?? 0
			} berakhir dalam ${soonDays} hari`}
			delay={delay}
			actions={
				<ToggleButtonGroup
					size="small"
					exclusive
					value={kind}
					onChange={(event, next) => next && setKind(next)}
					aria-label="Jenis lisensi"
				>
					<ToggleButton value="KARYAWAN" sx={{ gap: 0.75, px: 1.25, py: 0.5, textTransform: 'none' }}>
						Karyawan
						<Chip size="small" label={counts.KARYAWAN} sx={{ height: 18, fontSize: 11 }} />
					</ToggleButton>
					<ToggleButton value="UNIT" sx={{ gap: 0.75, px: 1.25, py: 0.5, textTransform: 'none' }}>
						Unit
						<Chip size="small" label={counts.UNIT} sx={{ height: 18, fontSize: 11 }} />
					</ToggleButton>
				</ToggleButtonGroup>
			}
			contentSx={{ pb: 1.5 }}
			footer={<SectionLink href={config.href} label={`Lihat semua lisensi ${config.label.toLowerCase()}`} />}
		>
			{rows.length === 0 ? (
				<EmptyState
					icon={VerifiedOutlinedIcon}
					tone="success"
					title="Tidak ada lisensi yang perlu ditindaklanjuti"
					description={`Semua lisensi ${config.label.toLowerCase()} masih berlaku di luar ${soonDays} hari ke depan.`}
				/>
			) : (
				<TableContainer sx={{ mt: 0.5, overflowX: 'auto' }}>
					<Table
						size="small"
						aria-label={`Lisensi ${config.label} yang perlu tindakan`}
						sx={{ tableLayout: 'fixed', minWidth: 400 }}
					>
						<TableHead>
							<TableRow>
								<TableCell sx={{ fontWeight: 700, pl: 0, width: '34%', whiteSpace: 'nowrap' }}>
									{config.column}
								</TableCell>
								<TableCell sx={{ fontWeight: 700, width: '36%', whiteSpace: 'nowrap' }}>
									Dokumen
								</TableCell>
								<TableCell sx={{ fontWeight: 700, width: '30%', whiteSpace: 'nowrap' }} align="right">
									Berlaku s.d.
								</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{rows.map((row) => {
								const tone = statusTone(row.daysRemaining);

								return (
									<TableRow key={row.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
										<TableCell sx={{ pl: 0 }}>
											<Typography variant="body2" fontWeight={600} noWrap>
												{row.subjectName}
											</Typography>
											<Typography variant="caption" color="text.secondary">
												{row.subjectNo}
											</Typography>
										</TableCell>
										<TableCell>
											<Typography variant="body2" noWrap>
												{row.documentName}
											</Typography>
											<Tooltip title={row.documentNumber || '-'} placement="bottom-start">
												<Typography
													variant="caption"
													color="text.secondary"
													noWrap
													display="block"
												>
													{row.documentNumber || '-'}
												</Typography>
											</Tooltip>
										</TableCell>
										<TableCell align="right">
											<Typography
												variant="body2"
												sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}
											>
												{formatDate(row.validUntil)}
											</Typography>
											<Stack
												direction="row"
												alignItems="center"
												justifyContent="flex-end"
												spacing={0.5}
											>
												<Box
													sx={{
														width: 6,
														height: 6,
														borderRadius: '50%',
														bgcolor: tone,
														flexShrink: 0,
													}}
												/>
												<Typography
													variant="caption"
													fontWeight={700}
													color={tone}
													noWrap
													sx={{ fontVariantNumeric: 'tabular-nums' }}
												>
													{describeRemainingDays(row.daysRemaining)}
												</Typography>
											</Stack>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</TableContainer>
			)}

			{totalIssue === 0 ? null : (
				<Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
					<Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main' }} />
					<Typography variant="caption" color="text.secondary">
						Prioritas: dokumen yang sudah melewati masa berlaku ditampilkan lebih dulu.
					</Typography>
				</Stack>
			)}
		</SectionCard>
	);
}

export default LicenseAlerts;
