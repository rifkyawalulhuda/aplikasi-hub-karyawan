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

function formatLongDate(value) {
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

function InfoRow({ label, value }) {
	return (
		<Box sx={{ display: 'grid', gridTemplateColumns: '102px 10px 1fr', columnGap: 1 }}>
			<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '10pt', lineHeight: 1.35 }}>{label}</Typography>
			<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '10pt', lineHeight: 1.35 }}>:</Typography>
			<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '10pt', lineHeight: 1.35 }}>{value || '-'}</Typography>
		</Box>
	);
}

function ReprimandPrintDocument({ record }) {
	return (
		<Box
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

				<Box sx={{ borderTop: '1px solid #8e8e8e', mt: 0.7, mb: 4.2 }} />

				<Stack spacing={0.25} alignItems="center" sx={{ mb: 3.5 }}>
					<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '14pt', fontWeight: 700 }}>
						SURAT TEGURAN
					</Typography>
					<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '11pt', fontWeight: 700 }}>
						{`Nomor : ${record.letterNumber}`}
					</Typography>
				</Stack>

				<Stack spacing={1.5} sx={{ flex: 1 }}>
					<Box>
						<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '10pt', lineHeight: 1.4, mb: 0.7 }}>
							Kepada,
						</Typography>
						<Stack spacing={0.15}>
							<InfoRow label="Saudara" value={record.employeeName} />
							<InfoRow label="NIK" value={record.employeeNo} />
							<InfoRow label="Departemen" value={record.departmentName} />
							<InfoRow label="Jabatan" value={record.jobLevelName} />
						</Stack>
					</Box>

					<Stack spacing={1.25}>
						<Typography
							sx={{
								fontFamily: FONT_FAMILY,
								fontSize: '10pt',
								lineHeight: 1.55,
								textAlign: 'justify',
								textIndent: '10mm',
							}}
						>
							{`Sehubungan dengan tindakan saudara yang tidak mengikuti peraturan yang telah ditetapkan Perusahaan terkait dengan pekerjaan sebagai ${
								record.jobLevelName || '-'
							} di PT. Sankyu Indonesia International - Cikarang Logistic Center. ${
								record.violation
							}. Perusahaan menganggap bahwa saudara telah melakukan tindakan yang merugikan perusahaan, oleh karena itu perusahaan memberikan "Surat Teguran" kepada saudara sebagai kompensasi atas tindakan yang saudara lakukan. Diharapkan dengan adanya teguran ini, saudara dapat merubah perilaku dan cara kerja saudara menjadi lebih baik lagi.`}
						</Typography>
						<Typography
							sx={{
								fontFamily: FONT_FAMILY,
								fontSize: '10pt',
								lineHeight: 1.55,
								textAlign: 'justify',
								textIndent: '10mm',
							}}
						>
							Apabila saudara masih berbuat hal-hal yang merugikan Perusahaan, saudara akan ditindak
							sesuai peraturan yang berlaku.
						</Typography>
						<Typography
							sx={{
								fontFamily: FONT_FAMILY,
								fontSize: '10pt',
								lineHeight: 1.55,
								textAlign: 'justify',
								textIndent: '10mm',
							}}
						>
							Demikian surat teguran ini kami berikan untuk saudara maklumi dan perhatikan.
						</Typography>
					</Stack>

					<Box sx={{ mt: 2 }}>
						<Stack spacing={0.3}>
							<InfoRow label="Tanggal" value={formatLongDate(record.letterDate)} />
							<InfoRow label="Dikeluarkan di" value="Cikarang" />
							<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '10pt', lineHeight: 1.35 }}>
								Mengetahui
							</Typography>
						</Stack>
					</Box>
				</Stack>

				<Box sx={{ mt: '18mm', display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: '34mm' }}>
					<Stack alignItems="flex-start">
						<Box sx={{ width: '58mm', borderTop: '2px dotted #111', mb: 0.8 }} />
						<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '10pt', lineHeight: 1.2 }}>
							{record.superiorName}
						</Typography>
						<Typography
							sx={{ fontFamily: FONT_FAMILY, fontSize: '9.5pt', fontStyle: 'italic', lineHeight: 1.2 }}
						>
							Dept. Manager
						</Typography>
					</Stack>
				</Box>

				<Box sx={{ mt: '18mm', maxWidth: '55mm' }}>
					<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '10pt', lineHeight: 1.4 }}>
						Surat Keputusan ini disampaikan kepada :
					</Typography>
					<Box component="ol" sx={{ m: 0, pl: '22px' }}>
						{['Karyawan yang bersangkutan', 'Kepala Departemen yang bersangkutan', 'Arsip'].map((item) => (
							<Box component="li" key={item} sx={{ pl: 0.5 }}>
								<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '10pt', lineHeight: 1.35 }}>
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

export default ReprimandPrintDocument;
