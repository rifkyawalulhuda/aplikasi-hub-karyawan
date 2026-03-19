import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

const PAGE_WIDTH = '210mm';
const PAGE_HEIGHT = '297mm';
const FONT_FAMILY = '"Arial", "Helvetica", sans-serif';

function TextLine({ value = '', width = '100%', align = 'left' }) {
	return (
		<Box
			sx={{
				minHeight: '5.4mm',
				borderBottom: '0.55mm solid #111',
				width,
				display: 'flex',
				alignItems: 'flex-end',
				justifyContent: align === 'center' ? 'center' : 'flex-start',
				pb: 0.2,
				px: 0.25,
				overflow: 'hidden',
			}}
		>
			<Typography
				sx={{
					fontFamily: FONT_FAMILY,
					fontSize: '9.6pt',
					lineHeight: 1.15,
					fontWeight: 500,
					whiteSpace: 'nowrap',
					textOverflow: 'ellipsis',
					overflow: 'hidden',
				}}
			>
				{value || ' '}
			</Typography>
		</Box>
	);
}

function FormLabel({ idLabel, enLabel, width = '44mm' }) {
	return (
		<Box sx={{ width }}>
			<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '8.9pt', lineHeight: 1.12 }}>{idLabel}</Typography>
			<Typography
				sx={{
					fontFamily: FONT_FAMILY,
					fontSize: '8.7pt',
					lineHeight: 1.1,
					fontStyle: 'italic',
					mt: 0.15,
				}}
			>
				{enLabel}
			</Typography>
		</Box>
	);
}

function FormFieldRow({ idLabel, enLabel, value, valueWidth = '70mm', labelWidth, trailing }) {
	return (
		<Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
			<FormLabel idLabel={idLabel} enLabel={enLabel} width={labelWidth} />
			<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '9pt', lineHeight: 1.55, pt: 0.2 }}>:</Typography>
			<TextLine value={value} width={valueWidth} />
			{trailing ? <Box sx={{ flex: 1 }}>{trailing}</Box> : null}
		</Box>
	);
}

function CheckboxItem({ item }) {
	return (
		<Stack direction="row" spacing={0.9} alignItems="flex-start">
			<Box
				sx={{
					width: '7.6mm',
					height: '7.6mm',
					border: '0.55mm solid #111',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					flexShrink: 0,
					mt: 0.1,
				}}
			>
				<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '11pt', fontWeight: 700, lineHeight: 1 }}>
					{item.checked ? 'X' : ''}
				</Typography>
			</Box>
			<Stack spacing={0.1}>
				<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '9pt', lineHeight: 1.15 }}>
					{item.label}
				</Typography>
				<Typography
					sx={{
						fontFamily: FONT_FAMILY,
						fontSize: '8.7pt',
						lineHeight: 1.1,
						fontStyle: 'italic',
					}}
				>
					{item.sublabel}
				</Typography>
			</Stack>
		</Stack>
	);
}

function ApprovalCell({ title, date, name, width, hideTop = false }) {
	return (
		<Box
			sx={{
				width,
				borderTop: hideTop ? 0 : '0.55mm solid #111',
				borderRight: '0.55mm solid #111',
				borderBottom: '0.55mm solid #111',
				minHeight: '31mm',
				display: 'grid',
				gridTemplateRows: '10mm 1fr',
			}}
		>
			<Box
				sx={{
					borderBottom: '0.55mm solid #111',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					px: 1,
					textAlign: 'center',
				}}
			>
				<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '8.4pt', lineHeight: 1.15 }}>{title}</Typography>
			</Box>
			<Stack spacing={0.45} sx={{ px: 1, pt: 1.2, alignItems: 'center', textAlign: 'center' }}>
				<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '8.7pt', lineHeight: 1.1 }}>
					{date || ' '}
				</Typography>
				<Typography
					sx={{
						fontFamily: FONT_FAMILY,
						fontSize: '8.2pt',
						lineHeight: 1.15,
						fontWeight: 600,
						wordBreak: 'break-word',
					}}
				>
					{name || ' '}
				</Typography>
			</Stack>
		</Box>
	);
}

function LeaveApplicationPrintDocument({ data }) {
	return (
		<Box
			className="leave-application-print-page"
			sx={{
				width: PAGE_WIDTH,
				height: PAGE_HEIGHT,
				mx: 'auto',
				bgcolor: '#fff',
				color: '#111',
				boxShadow: '0 12px 30px rgba(15, 23, 42, 0.12)',
				overflow: 'hidden',
				fontFamily: FONT_FAMILY,
				'@media print': {
					width: PAGE_WIDTH,
					height: PAGE_HEIGHT,
					boxShadow: 'none',
					m: 0,
				},
			}}
		>
			<Box
				sx={{
					width: '100%',
					height: '100%',
					px: '12mm',
					pt: '8mm',
					pb: '8mm',
					display: 'flex',
					flexDirection: 'column',
				}}
			>
				<Box sx={{ borderTop: '0.55mm solid #111', mb: 0.35 }} />

				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: '1fr 58mm',
						borderLeft: '0.55mm solid #111',
						borderRight: '0.55mm solid #111',
					}}
				>
					<Box sx={{ borderRight: '0.55mm solid #111', px: 0.7, py: 0.4 }}>
						<Stack spacing={0.35}>
							<Typography
								sx={{ fontFamily: FONT_FAMILY, fontSize: '10pt', fontWeight: 700, color: '#0837d7' }}
							>
								PT SANKYU INDONESIA INTERNATIONAL
							</Typography>
							<Typography
								sx={{ fontFamily: FONT_FAMILY, fontSize: '10pt', fontWeight: 700, color: '#0837d7' }}
							>
								QUALITY, SAFETY, HEALTH, AND ENVIRONMENTAL DIVISION
							</Typography>
							<Typography
								sx={{ fontFamily: FONT_FAMILY, fontSize: '10pt', fontWeight: 700, color: '#0837d7' }}
							>
								SISTEM MANAJEMEN TERINTEGRASI
							</Typography>
						</Stack>
					</Box>
					<Box sx={{ display: 'grid', gridTemplateColumns: '20mm 1fr' }}>
						{[
							['Tgl Efektif', '01 Agustus 2024'],
							['Rev', '02'],
							['Form No', 'SII-QSHE-084-01'],
						].map(([label, value], index) => (
							<Box key={label} sx={{ display: 'contents' }}>
								<Box
									sx={{
										borderBottom: index < 2 ? '0.55mm solid #111' : 0,
										borderRight: '0.55mm solid #111',
										px: 0.6,
										py: 0.3,
									}}
								>
									<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '8.9pt', lineHeight: 1.2 }}>
										{label}
									</Typography>
								</Box>
								<Box sx={{ borderBottom: index < 2 ? '0.55mm solid #111' : 0, px: 0.6, py: 0.3 }}>
									<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '8.9pt', lineHeight: 1.2 }}>
										{value}
									</Typography>
								</Box>
							</Box>
						))}
					</Box>
				</Box>

				<Box
					sx={{
						border: '0.55mm solid #111',
						borderTop: '0.55mm solid #111',
						px: 1,
						py: 0.55,
						textAlign: 'center',
					}}
				>
					<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '10.6pt', fontWeight: 700, lineHeight: 1.15 }}>
						Form Permohonan Cuti dan Ijin
					</Typography>
					<Typography
						sx={{
							fontFamily: FONT_FAMILY,
							fontSize: '10.2pt',
							fontWeight: 700,
							fontStyle: 'italic',
							lineHeight: 1.1,
							mt: 0.2,
						}}
					>
						Permission & Leave Application
					</Typography>
				</Box>

				<Stack spacing={1.35} sx={{ mt: 0.8, flex: 1 }}>
					<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 3.2, rowGap: 1.25 }}>
						<Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.2 }}>
							<FormLabel idLabel="Site / Div" enLabel="" width="30mm" />
							<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '9pt', lineHeight: 1.4, pt: 0.15 }}>
								:
							</Typography>
							<TextLine value={data.employeeSiteDiv} width="66mm" />
						</Box>
						<Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.2 }}>
							<FormLabel idLabel="Departemen" enLabel="Department" width="30mm" />
							<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '9pt', lineHeight: 1.4, pt: 0.15 }}>
								:
							</Typography>
							<TextLine value={data.employeeDepartmentName} width="66mm" />
						</Box>
						<FormFieldRow
							idLabel="Tanggal"
							enLabel="Date"
							value={data.submissionDateLong}
							valueWidth="52mm"
							labelWidth="30mm"
						/>
						<Box />
						<FormFieldRow
							idLabel="Nama"
							enLabel="Name"
							value={data.employeeName}
							valueWidth="52mm"
							labelWidth="30mm"
						/>
						<Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.2 }}>
							<FormLabel idLabel="NIK" enLabel="" width="18mm" />
							<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '9pt', lineHeight: 1.4, pt: 0.15 }}>
								:
							</Typography>
							<TextLine value={data.employeeNo} width="24mm" />
						</Box>
					</Box>

					<Stack spacing={0.5}>
						<Typography
							sx={{ fontFamily: FONT_FAMILY, fontSize: '9.1pt', fontWeight: 700, lineHeight: 1.2 }}
						>
							Jenis Ijin / Cuti Tidak Masuk Kerja ( beri tanda silang pada kotak yang sesuai )
						</Typography>
						<Typography
							sx={{ fontFamily: FONT_FAMILY, fontSize: '8.8pt', fontStyle: 'italic', lineHeight: 1.1 }}
						>
							Type of Permission / Leave of Absence (put a cross in the appropriate box)
						</Typography>
					</Stack>

					<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', columnGap: 4, rowGap: 1.2 }}>
						{data.checkboxRows.map((row, rowIndex) => (
							<Stack
								key={`checkbox-row-${rowIndex}`}
								spacing={1.05}
								sx={{ gridColumn: row.length === 2 ? '1 / span 2' : 'auto' }}
							>
								{row.map((item) => (
									<CheckboxItem key={item.key} item={item} />
								))}
							</Stack>
						))}
					</Box>

					<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 4 }}>
						<Stack spacing={0.55}>
							<Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.1 }}>
								<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '8.9pt', lineHeight: 1.15 }}>
									* Cuti Tahunan yang tersedia
								</Typography>
								<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '8.9pt', lineHeight: 1.15 }}>
									:
								</Typography>
								<TextLine value={data.existingAnnualLeave} width="22mm" />
							</Box>
							<Typography
								sx={{
									fontFamily: FONT_FAMILY,
									fontSize: '8.7pt',
									fontStyle: 'italic',
									lineHeight: 1.05,
								}}
							>
								* Existing Annual Leave
							</Typography>
						</Stack>
						<Stack spacing={0.55}>
							<Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.1 }}>
								<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '8.9pt', lineHeight: 1.15 }}>
									* Cuti 10 Tahunan yang tersedia
								</Typography>
								<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '8.9pt', lineHeight: 1.15 }}>
									:
								</Typography>
								<TextLine value={data.existingTenYearLeave} width="22mm" />
							</Box>
							<Typography
								sx={{
									fontFamily: FONT_FAMILY,
									fontSize: '8.7pt',
									fontStyle: 'italic',
									lineHeight: 1.05,
								}}
							>
								*Existing Annual 10 th year leave
							</Typography>
						</Stack>
					</Box>

					<Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
						<FormLabel
							idLabel="Jumlah hari Tidak Masuk Kerja"
							enLabel="Number of day absent"
							width="44mm"
						/>
						<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '9pt', lineHeight: 1.55, pt: 0.2 }}>
							:
						</Typography>
						<TextLine value={data.leaveDaysLabel} width="28mm" align="center" />
						<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '9pt', lineHeight: 1.55, pt: 0.22 }}>
							hari / day
						</Typography>
					</Box>

					<Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
						<FormLabel idLabel="Dari Tanggal" enLabel="From" width="44mm" />
						<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '9pt', lineHeight: 1.55, pt: 0.2 }}>
							:
						</Typography>
						<TextLine value={data.periodStartShort} width="38mm" />
						<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '9pt', lineHeight: 1.55, pt: 0.2 }}>
							s/d
						</Typography>
						<TextLine value={data.periodEndShort} width="38mm" />
					</Box>

					<FormFieldRow
						idLabel="Alamat Selama Cuti"
						enLabel="Address during leave"
						value={data.leaveAddress}
						valueWidth="120mm"
						labelWidth="44mm"
					/>

					<FormFieldRow
						idLabel="Alasan Cuti"
						enLabel="Reason for leave"
						value={data.leaveReason}
						valueWidth="120mm"
						labelWidth="44mm"
					/>

					<Box sx={{ display: 'grid', gridTemplateColumns: '44mm 1fr', columnGap: 1.25 }}>
						<FormLabel idLabel="Pengganti Selama Cuti" enLabel="Replacement during leave" width="44mm" />
						<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 5.2, rowGap: 0.7 }}>
							{[0, 1, 2, 3].map((index) => {
								const item = data.replacementEmployees[index];
								return (
									<Box
										key={`replacement-${index}`}
										sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.8 }}
									>
										<Typography
											sx={{
												fontFamily: FONT_FAMILY,
												fontSize: '9pt',
												lineHeight: 1.45,
												pt: 0.15,
											}}
										>
											{`${index + 1}.`}
										</Typography>
										<TextLine
											value={item ? `${item.fullName} (${item.employeeNo})` : ''}
											width="100%"
										/>
									</Box>
								);
							})}
						</Box>
					</Box>

					<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 4 }}>
						<Stack spacing={0.55}>
							<Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.1 }}>
								<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '8.9pt', lineHeight: 1.15 }}>
									* Sisa cuti
								</Typography>
								<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '8.9pt', lineHeight: 1.15 }}>
									:
								</Typography>
								<TextLine value={data.remainingAnnualLeave} width="22mm" />
							</Box>
							<Typography
								sx={{
									fontFamily: FONT_FAMILY,
									fontSize: '8.7pt',
									fontStyle: 'italic',
									lineHeight: 1.05,
								}}
							>
								* Remaining annual leave
							</Typography>
						</Stack>
						<Stack spacing={0.55}>
							<Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.1 }}>
								<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '8.9pt', lineHeight: 1.15 }}>
									* Sisa Cuti 10 Tahunan
								</Typography>
								<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '8.9pt', lineHeight: 1.15 }}>
									:
								</Typography>
								<TextLine value={data.remainingTenYearLeave} width="22mm" />
							</Box>
							<Typography
								sx={{
									fontFamily: FONT_FAMILY,
									fontSize: '8.7pt',
									fontStyle: 'italic',
									lineHeight: 1.05,
								}}
							>
								* Remaining 10 th year leave
							</Typography>
						</Stack>
					</Box>

					<Stack spacing={0.5} sx={{ mt: 0.2 }}>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.9 }}>
							<Box
								sx={{
									width: '7.6mm',
									height: '7.6mm',
									border: '0.55mm solid #111',
									display: 'inline-flex',
									flexShrink: 0,
								}}
							/>
							<Typography
								sx={{ fontFamily: FONT_FAMILY, fontSize: '9.1pt', fontWeight: 700, lineHeight: 1.2 }}
							>
								Ijin Meninggalkan Kerja ( Terlambat / Keluar Sementara / Pulang Cepat )
							</Typography>
						</Box>
						<Typography
							sx={{
								fontFamily: FONT_FAMILY,
								fontSize: '8.8pt',
								fontStyle: 'italic',
								lineHeight: 1.1,
								ml: '8.6mm',
							}}
						>
							Permission to Leave Work (Late / Temporary Leave / Leave Early)
						</Typography>
					</Stack>

					<FormFieldRow idLabel="Tanggal" enLabel="Date" value="" valueWidth="52mm" labelWidth="44mm" />
					<Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
						<FormLabel idLabel="Dari Jam" enLabel="From" width="44mm" />
						<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '9pt', lineHeight: 1.55, pt: 0.2 }}>
							:
						</Typography>
						<TextLine value="" width="30mm" />
						<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '9pt', lineHeight: 1.55, pt: 0.2 }}>
							s/d
						</Typography>
						<TextLine value="" width="34mm" />
						<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '9pt', lineHeight: 1.55, pt: 0.2 }}>
							(.........Jam / hour )
						</Typography>
					</Box>
					<FormFieldRow
						idLabel="Alasan Ijin"
						enLabel="Permission Reason"
						value=""
						valueWidth="100mm"
						labelWidth="44mm"
					/>
					<FormFieldRow
						idLabel="No. Kendaraan"
						enLabel="Car Number"
						value=""
						valueWidth="56mm"
						labelWidth="44mm"
					/>

					<Box sx={{ mt: 'auto', borderLeft: '0.55mm solid #111', borderTop: '0.55mm solid #111' }}>
						<Box sx={{ display: 'grid', gridTemplateColumns: '36mm 1fr' }}>
							<Box sx={{ borderRight: '0.55mm solid #111', borderBottom: '0.55mm solid #111' }} />
							<Box
								sx={{
									borderRight: '0.55mm solid #111',
									borderBottom: '0.55mm solid #111',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									minHeight: '7mm',
								}}
							>
								<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '8.8pt', lineHeight: 1.15 }}>
									Menyetujui / Approved
								</Typography>
							</Box>
						</Box>
						<Box sx={{ display: 'grid', gridTemplateColumns: '36mm 24mm 42mm 42mm 42mm' }}>
							<ApprovalCell
								title="Pemohon / Applicant"
								date={data.applicantApproval.date}
								name={data.applicantApproval.name}
								width="36mm"
							/>
							<ApprovalCell
								title="FM/GF/SC"
								date={data.fmGroupApproval.date}
								name={data.fmGroupApproval.name}
								width="24mm"
							/>
							<ApprovalCell
								title="Deputy Manager / Dept Manager"
								date={data.deptManagerApproval.date}
								name={data.deptManagerApproval.name}
								width="42mm"
							/>
							<ApprovalCell
								title="Site / Division Manager"
								date={data.siteDivManagerApproval.date}
								name={data.siteDivManagerApproval.name}
								width="42mm"
							/>
							<ApprovalCell title="Branch Manager / GM" date="" name="" width="42mm" />
						</Box>
					</Box>
				</Stack>
			</Box>
		</Box>
	);
}

export default LeaveApplicationPrintDocument;
