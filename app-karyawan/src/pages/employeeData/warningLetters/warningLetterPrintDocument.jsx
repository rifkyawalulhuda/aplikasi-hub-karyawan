import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

const PAGE_WIDTH = '210mm';
const PAGE_HEIGHT = '297mm';
const FONT_FAMILY = '"Arial", "Helvetica", sans-serif';
const MONTH_LABELS = [
	'Januari',
	'Februari',
	'Maret',
	'April',
	'Mei',
	'Juni',
	'Juli',
	'Agustus',
	'September',
	'Oktober',
	'November',
	'Desember',
];
const WARNING_LEVEL_LABELS = {
	1: 'Pertama',
	2: 'Kedua',
	3: 'Ketiga',
};

function formatLongWarningDate(value) {
	if (!value) {
		return '';
	}

	const raw = String(value).trim();
	const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);

	if (isoMatch) {
		const [, year, month, day] = isoMatch;
		return `${Number(day)} ${MONTH_LABELS[Number(month) - 1]} ${year}`;
	}

	const parsed = new Date(raw);

	if (Number.isNaN(parsed.getTime())) {
		return raw;
	}

	return `${parsed.getDate()} ${MONTH_LABELS[parsed.getMonth()]} ${parsed.getFullYear()}`;
}

function DecisionRow({ label, children, contentSx }) {
	return (
		<Box sx={{ display: 'grid', gridTemplateColumns: '92px 8px 1fr', columnGap: 2 }}>
			<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '10pt', lineHeight: 1.45 }}>{label}</Typography>
			<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '10pt', lineHeight: 1.45 }}>:</Typography>
			<Box sx={{ textAlign: 'justify', ...contentSx }}>{children}</Box>
		</Box>
	);
}

function WarningLetterPrintDocument({ record }) {
	const warningLevelLabel = WARNING_LEVEL_LABELS[record.warningLevel] || `${record.warningLevel}`;

	return (
		<Box
			className="warning-letter-print-page"
			sx={{
				width: PAGE_WIDTH,
				height: PAGE_HEIGHT,
				mx: 'auto',
				bgcolor: 'common.white',
				color: 'common.black',
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
					position: 'relative',
					width: '100%',
					height: '100%',
					px: '18mm',
					pt: '14mm',
					pb: '18mm',
					display: 'flex',
					flexDirection: 'column',
				}}
			>
				<Stack direction="row" justifyContent="space-between" alignItems="flex-start">
					<Stack spacing={0.15}>
						<Typography
							sx={{ fontFamily: FONT_FAMILY, fontSize: '9.4pt', fontWeight: 700, color: '#0837d7' }}
						>
							PT SANKYU INDONESIA INTERNATIONAL
						</Typography>
						<Typography
							sx={{ fontFamily: FONT_FAMILY, fontSize: '9.4pt', fontWeight: 700, color: '#0837d7' }}
						>
							QUALITY, SAFETY, HEALTH, AND ENVIRONMENTAL DIVISION
						</Typography>
						<Typography
							sx={{ fontFamily: FONT_FAMILY, fontSize: '9.4pt', fontWeight: 700, color: '#0837d7' }}
						>
							SISTEM MANAJEMEN TERINTEGRASI
						</Typography>
					</Stack>
					<Box
						component="img"
						src="/forms/warning-letter-logos.png"
						alt="Certification logos"
						sx={{ width: '44mm', height: 'auto', objectFit: 'contain' }}
					/>
				</Stack>

				<Box sx={{ borderTop: '1px solid #8e8e8e', mt: 0.7, mb: 3.2 }} />

				<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 58mm', alignItems: 'stretch' }}>
					<Box
						sx={{
							border: '1px solid #222',
							borderRight: 0,
							minHeight: '16.5mm',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							flexDirection: 'column',
							px: 2,
							py: 0.4,
						}}
					>
						<Typography
							sx={{ fontFamily: FONT_FAMILY, fontSize: '14.2pt', fontWeight: 700, lineHeight: 1.08 }}
						>
							FORM SURAT PERINGATAN
						</Typography>
						<Typography
							sx={{
								fontFamily: FONT_FAMILY,
								fontSize: '10.7pt',
								fontWeight: 700,
								lineHeight: 1.15,
								mt: 0.45,
							}}
						>
							{`Nomor: ${record.letterNumber}`}
						</Typography>
					</Box>
					<Box sx={{ border: '1px solid #222' }}>
						{[
							['Tgl Efektif', '01 Agustus 2024'],
							['Rev', '02'],
							['Form No', 'SII-QSHE-085-01'],
						].map(([label, value], index) => (
							<Box
								key={label}
								sx={{
									display: 'grid',
									gridTemplateColumns: '23mm 1fr',
									borderBottom: index < 2 ? '1px solid #222' : 0,
								}}
							>
								<Box sx={{ borderRight: '1px solid #222', px: 1, py: 0.1 }}>
									<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '9pt', lineHeight: 1.25 }}>
										{label}
									</Typography>
								</Box>
								<Box sx={{ px: 1, py: 0.1 }}>
									<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '9pt', lineHeight: 1.25 }}>
										{value}
									</Typography>
								</Box>
							</Box>
						))}
					</Box>
				</Box>

				<Stack spacing={3.2} sx={{ mt: 3.2, flex: 1 }}>
					<Box>
						<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '12pt', fontWeight: 700, mb: 0.4 }}>
							Menimbang
						</Typography>
						<Box component="ol" sx={{ m: 0, pl: '24px' }}>
							{[
								'Perlunya untuk menjaga kedisiplinan dari setiap karyawan dalam rangka menjaga kelancaran kerja dan mempertahankan sikap kerja yang baik.',
								'Perlunya pembinaan kepada karyawan yang telah melakukan pelanggaran agar dapat memperbaiki kesalahan yang sudah dilakukan.',
								record.violation,
							].map((item) => (
								<Box component="li" key={item} sx={{ pl: 1, mb: 0.35 }}>
									<Typography
										sx={{
											fontFamily: FONT_FAMILY,
											fontSize: '10pt',
											lineHeight: 1.45,
											textAlign: 'justify',
										}}
									>
										{item}
									</Typography>
								</Box>
							))}
						</Box>
					</Box>

					<Box>
						<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '12pt', fontWeight: 700, mb: 0.4 }}>
							Mengingat
						</Typography>
						<Box component="ol" start={4} sx={{ m: 0, pl: '24px' }}>
							<Box component="li" sx={{ pl: 1, mb: 0.65 }}>
								<Typography
									sx={{
										fontFamily: FONT_FAMILY,
										fontSize: '10pt',
										lineHeight: 1.45,
										textAlign: 'justify',
									}}
								>
									{`Perjanjian Kerja Bersama (PKB) ${record.articleLabel}`}
								</Typography>
								<Typography
									sx={{
										fontFamily: FONT_FAMILY,
										fontSize: '10pt',
										lineHeight: 1.4,
										fontWeight: 700,
										fontStyle: 'italic',
										ml: 0.2,
										textAlign: 'justify',
									}}
								>
									{`"${record.articleContent}"`}
								</Typography>
							</Box>
							<Box component="li" sx={{ pl: 1 }}>
								<Typography
									sx={{
										fontFamily: FONT_FAMILY,
										fontSize: '10pt',
										lineHeight: 1.45,
										textAlign: 'justify',
									}}
								>
									Bahwa setiap karyawan harus melakukan pekerjaan sesuai dengan ketentuan yang ada.
								</Typography>
							</Box>
						</Box>
					</Box>

					<Box>
						<Typography
							sx={{
								fontFamily: FONT_FAMILY,
								fontSize: '13pt',
								fontWeight: 700,
								letterSpacing: '4pt',
								textAlign: 'center',
								mb: 1.5,
							}}
						>
							MEMUTUSKAN
						</Typography>

						<Stack spacing={0.9}>
							<DecisionRow label="Menetapkan" />
							<DecisionRow
								label="Pertama"
								contentSx={{ display: 'flex', flexDirection: 'column', gap: 0.1 }}
							>
								<Typography
									sx={{
										fontFamily: FONT_FAMILY,
										fontSize: '10pt',
										lineHeight: 1.45,
										textAlign: 'justify',
									}}
								>
									{`Perusahaan memberikan Surat Peringatan ${warningLevelLabel} (${record.warningLevel}), kepada;`}
								</Typography>
								<Box
									sx={{
										display: 'grid',
										gridTemplateColumns: '78px 8px 1fr',
										mt: 0.25,
										columnGap: 2,
									}}
								>
									<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '10pt', lineHeight: 1.35 }}>
										Nama
									</Typography>
									<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '10pt', lineHeight: 1.35 }}>
										:
									</Typography>
									<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '10pt', lineHeight: 1.35 }}>
										{record.employeeName}
									</Typography>
								</Box>
								<Box sx={{ display: 'grid', gridTemplateColumns: '78px 8px 1fr', columnGap: 2 }}>
									<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '10pt', lineHeight: 1.35 }}>
										Nik
									</Typography>
									<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '10pt', lineHeight: 1.35 }}>
										:
									</Typography>
									<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '10pt', lineHeight: 1.35 }}>
										{record.employeeNo}
									</Typography>
								</Box>
							</DecisionRow>
							<DecisionRow label="Kedua">
								<Typography
									sx={{
										fontFamily: FONT_FAMILY,
										fontSize: '10pt',
										lineHeight: 1.45,
										textAlign: 'justify',
									}}
								>
									Keputusan ini berlaku sejak surat ini dikeluarkan sampai dengan 6 bulan kedepan.
								</Typography>
							</DecisionRow>
							<DecisionRow label="Ketiga">
								<Typography
									sx={{
										fontFamily: FONT_FAMILY,
										fontSize: '10pt',
										lineHeight: 1.45,
										textAlign: 'justify',
									}}
								>
									Apabila dikemudian hari yang bersangkutan melanggar kembali peraturan / PKB, maka
									Perusahaan akan mengeluarkan sanksi berikutnya sesuai dengan peraturan / PKB yang
									berlaku.
								</Typography>
							</DecisionRow>
						</Stack>
					</Box>

					<Box sx={{ mt: 1 }}>
						<Stack spacing={0.3}>
							<Box sx={{ display: 'grid', gridTemplateColumns: '118px 8px 1fr', columnGap: 1 }}>
								<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '10pt', lineHeight: 1.35 }}>
									Tanggal
								</Typography>
								<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '10pt', lineHeight: 1.35 }}>
									:
								</Typography>
								<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '10pt', lineHeight: 1.35 }}>
									{formatLongWarningDate(record.letterDate)}
								</Typography>
							</Box>
							<Box sx={{ display: 'grid', gridTemplateColumns: '118px 8px 1fr', columnGap: 1 }}>
								<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '10pt', lineHeight: 1.35 }}>
									Dikeluarkan di
								</Typography>
								<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '10pt', lineHeight: 1.35 }}>
									:
								</Typography>
								<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '10pt', lineHeight: 1.35 }}>
									Cikarang
								</Typography>
							</Box>
							<Box sx={{ display: 'grid', gridTemplateColumns: '118px 8px 1fr', columnGap: 1 }}>
								<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '10pt', lineHeight: 1.35 }}>
									Mengetahui
								</Typography>
							</Box>
						</Stack>
					</Box>
				</Stack>

				<Box sx={{ mt: '14mm', display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: '34mm' }}>
					<Stack alignItems="flex-start">
						<Box sx={{ width: '58mm', borderTop: '2px dotted #111', mb: 0.8 }} />
						<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '10pt', lineHeight: 1.2 }}>
							{record.superiorName}
						</Typography>
						<Typography
							sx={{ fontFamily: FONT_FAMILY, fontSize: '9.5pt', fontStyle: 'italic', lineHeight: 1.2 }}
						>
							{record.superiorJobLevelName || '-'}
						</Typography>
					</Stack>
					<Stack alignItems="flex-start" sx={{ justifySelf: 'end' }}>
						<Box sx={{ width: '58mm', borderTop: '2px dotted #111', mb: 0.8 }} />
						<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '10pt', lineHeight: 1.2 }}>
							{record.employeeName}
						</Typography>
					</Stack>
				</Box>

				<Box sx={{ mt: '12mm' }}>
					<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '10pt', lineHeight: 1.45 }}>
						Surat Keputusan ini disampaikan kepada:
					</Typography>
					<Box component="ol" sx={{ m: 0, pl: '24px' }}>
						{['Karyawan yang bersangkutan', 'Kepala Departemen yang bersangkutan', 'Arsip'].map((item) => (
							<Box component="li" key={item} sx={{ pl: 1 }}>
								<Typography
									sx={{
										fontFamily: FONT_FAMILY,
										fontSize: '10pt',
										lineHeight: 1.35,
										textAlign: 'justify',
									}}
								>
									{item}
								</Typography>
							</Box>
						))}
					</Box>
				</Box>

				<Box
					sx={{
						position: 'absolute',
						left: '15mm',
						right: '15mm',
						bottom: '8mm',
						borderTop: '1px solid #79a5ff',
					}}
				/>
				<Typography
					sx={{
						position: 'absolute',
						right: '15mm',
						bottom: '3.6mm',
						fontFamily: FONT_FAMILY,
						fontSize: '9pt',
						fontWeight: 700,
					}}
				>
					Page 1 of 1
				</Typography>
			</Box>
		</Box>
	);
}

export default WarningLetterPrintDocument;
