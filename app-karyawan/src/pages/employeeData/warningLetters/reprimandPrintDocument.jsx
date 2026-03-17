import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import sankyuLogo from '@/assets/images/logo/png/Color_logotext2_nobg.png';

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
					<Box
						component="img"
						src={sankyuLogo}
						alt="Sankyu"
						sx={{ width: '60mm', height: 'auto', objectFit: 'contain', mt: 0.4 }}
					/>
					<Stack spacing={0.1} sx={{ textAlign: 'right', pt: 0.5 }}>
						<Typography
							sx={{
								fontFamily: FONT_FAMILY,
								fontSize: '8.7pt',
								fontWeight: 900,
								letterSpacing: '0.15pt',
							}}
						>
							PT SANKYU INDONESIA INTERNATIONAL
						</Typography>
						<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '6.7pt', fontWeight: 500 }}>
							Plant Engineering, Logistics Solution &amp; Business Solution
						</Typography>
						<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '6.6pt', fontWeight: 700, mt: 0.4 }}>
							HEAD OFFICE
						</Typography>
						<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '5.8pt', lineHeight: 1.18 }}>
							Kawasan Industri Terpadu Indonesia China (KITIC), Kav. 20
						</Typography>
						<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '5.8pt', lineHeight: 1.18 }}>
							Desa Nagasari, Kec. Serang Baru, Kab. Bekasi - Jawa Barat 17330
						</Typography>
						<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '5.8pt', lineHeight: 1.18 }}>
							Phone : (+62 21) 50555340 Facsimile: (+62 21) 50555341
						</Typography>
					</Stack>
				</Stack>

				<Box sx={{ borderTop: '1px solid #8e8e8e', mt: 1.2, mb: 4.2 }} />

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
								textIndent: '0mm',
							}}
						>
							Demikian surat teguran ini kami berikan untuk saudara maklumi dan perhatikan.
						</Typography>
					</Stack>

					<Box sx={{ mt: '11mm' }}>
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

				<Box sx={{ mt: '-10mm', ml: 'auto', maxWidth: '58mm' }}>
					<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '10pt', lineHeight: 2.4 }}>
						Surat Keputusan ini disampaikan kepada :
					</Typography>
					<Box component="ol" sx={{ mb: 8, pl: '22px' }}>
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
						bottom: '7mm',
						height: '28mm',
						overflow: 'hidden',
					}}
				>
					<Typography
						sx={{
							position: 'absolute',
							left: '4mm',
							top: '-2mm',
							fontFamily: FONT_FAMILY,
							fontSize: '34mm',
							fontWeight: 800,
							letterSpacing: '1.2mm',
							color: 'rgba(86, 120, 196, 0.10)',
							lineHeight: 1,
							userSelect: 'none',
						}}
					>
						SANKYU
					</Typography>
					<Box
						sx={{
							position: 'absolute',
							left: 0,
							right: 0,
							top: '11mm',
							display: 'grid',
							gridTemplateColumns: '1fr 1fr',
							columnGap: '14mm',
						}}
					>
						<Box>
							<Typography
								sx={{ fontFamily: FONT_FAMILY, fontSize: '5.7pt', fontWeight: 700, lineHeight: 1.15 }}
							>
								JAKARTA OFFICE
							</Typography>
							<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '4.8pt', lineHeight: 1.15 }}>
								Summitmas I, 6th Floor, Jl. Jenderal Sudirman Kav. 61-62, Jakarta 12190
							</Typography>
							<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '4.8pt', lineHeight: 1.15 }}>
								Phone : (+62 21) 5201255 Facsimile : (+62 21) 5200741
							</Typography>
						</Box>
						<Box sx={{ textAlign: 'right' }}>
							<Typography
								sx={{ fontFamily: FONT_FAMILY, fontSize: '5.7pt', fontWeight: 700, lineHeight: 1.15 }}
							>
								CILEGON OFFICE
							</Typography>
							<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '4.8pt', lineHeight: 1.15 }}>
								Jl. Brigjen Katamso Km.121, Ciwandan, Cilegon - Banten 42447
							</Typography>
							<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '4.8pt', lineHeight: 1.15 }}>
								Phone : (+62 254) 601071 Facsimile : (+62 254) 601070
							</Typography>
						</Box>
					</Box>
					<Box
						sx={{
							position: 'absolute',
							left: 0,
							right: 0,
							bottom: '1.6mm',
							height: '2.1mm',
							display: 'grid',
							gridTemplateColumns: '1fr 0.9fr',
						}}
					>
						<Box sx={{ bgcolor: '#232d63' }} />
						<Box sx={{ bgcolor: '#be5050' }} />
					</Box>
				</Box>
			</Box>
		</Box>
	);
}

export default ReprimandPrintDocument;
