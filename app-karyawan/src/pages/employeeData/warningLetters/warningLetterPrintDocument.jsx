import { useLayoutEffect, useRef, useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import CompanyLetterhead from '@/components/dokumen/companyLetterhead';

import { getDisciplinePrintConfig } from './utils';

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
const CHECKBOX_ITEMS = [
	{ key: 'SP_1', label: 'SP 1' },
	{ key: 'SP_2', label: 'SP 2' },
	{ key: 'SP_3', label: 'SP 3' },
	{ key: 'SUSPENSION', label: 'Skorsing' },
];

const PX_PER_MM = 96 / 25.4;
const PAGE_H_MM = 297;
const MARGIN_TOP_MM = 10;
const MARGIN_BOTTOM_MM = 12;
const MARGIN_SIDE_MM = 16;
const CONTENT_W_MM = 210 - MARGIN_SIDE_MM * 2;
const CONTENT_H_MM = PAGE_H_MM - MARGIN_TOP_MM - MARGIN_BOTTOM_MM;
const MIN_SCALE = 0.85;

const BODY_SX = {
	fontFamily: FONT_FAMILY,
	fontSize: '10pt',
	lineHeight: 1.3,
};

const BODY_JUSTIFY_SX = {
	...BODY_SX,
	textAlign: 'justify',
};

const SECTION_TITLE_SX = {
	fontFamily: FONT_FAMILY,
	fontSize: '11pt',
	fontWeight: 700,
	lineHeight: 1.2,
	mb: 0.25,
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

function toMm(px) {
	return px / PX_PER_MM;
}

function PageShell({ children, pageNumber, totalPages }) {
	return (
		<Box
			data-warning-page
			sx={{
				width: PAGE_WIDTH,
				height: PAGE_HEIGHT,
				position: 'relative',
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
					breakAfter: 'page',
					pageBreakAfter: 'always',
				},
				'&:last-of-type': {
					'@media print': {
						breakAfter: 'auto',
						pageBreakAfter: 'auto',
					},
				},
			}}
		>
			<Box
				sx={{
					position: 'relative',
					width: '100%',
					height: '100%',
					px: `${MARGIN_SIDE_MM}mm`,
					pt: `${MARGIN_TOP_MM}mm`,
					pb: `${MARGIN_BOTTOM_MM}mm`,
					display: 'flex',
					flexDirection: 'column',
				}}
			>
				{children}
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
					{`Page ${pageNumber} of ${totalPages}`}
				</Typography>
			</Box>
		</Box>
	);
}

function DecisionRow({ label, children, contentSx }) {
	return (
		<Box sx={{ display: 'grid', gridTemplateColumns: '92px 8px 1fr', columnGap: 2 }}>
			<Typography sx={BODY_SX}>{label}</Typography>
			<Typography sx={BODY_SX}>:</Typography>
			<Box sx={{ textAlign: 'justify', ...contentSx }}>{children}</Box>
		</Box>
	);
}

function CheckboxMark({ checked, label }) {
	return (
		<Stack direction="row" alignItems="center" spacing={0.7}>
			<Box
				sx={{
					width: '4.4mm',
					height: '4.4mm',
					border: '1.4px solid #222',
					display: 'inline-flex',
					alignItems: 'center',
					justifyContent: 'center',
					fontFamily: FONT_FAMILY,
					fontSize: '9.5pt',
					fontWeight: 700,
					lineHeight: 1,
				}}
			>
				{checked ? 'X' : ''}
			</Box>
			<Typography sx={{ ...BODY_SX, lineHeight: 1.2, fontWeight: 700 }}>{label}</Typography>
		</Stack>
	);
}

function LetterMetaGrid({ record, titleVisibleWord, titleStrikeWord }) {
	return (
		<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 58mm', alignItems: 'stretch' }}>
			<Box
				sx={{
					border: '1px solid #222',
					borderRight: 0,
					minHeight: '14mm',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					flexDirection: 'column',
					px: 2,
					py: 0.3,
				}}
			>
				<Typography
					sx={{
						fontFamily: FONT_FAMILY,
						fontSize: '12pt',
						fontWeight: 700,
						lineHeight: 1.05,
						whiteSpace: 'nowrap',
					}}
				>
					<Box component="span">FORM SURAT </Box>
					<Box component="span">{titleVisibleWord}</Box>
					<Box component="span">/</Box>
					<Box
						component="span"
						sx={{
							textDecoration: 'line-through',
							textDecorationThickness: '1.4px',
							textDecorationSkipInk: 'none',
						}}
					>
						{titleStrikeWord}
					</Box>
				</Typography>
				<Typography
					sx={{
						fontFamily: FONT_FAMILY,
						fontSize: '10.7pt',
						fontWeight: 700,
						lineHeight: 1.1,
						mt: 0.35,
					}}
				>
					{`Nomor: ${record.letterNumber}`}
				</Typography>
			</Box>
			<Box sx={{ border: '1px solid #222' }}>
				{[
					['Tgl Efektif', '22 April 2026'],
					['Rev', '03'],
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
						<Box sx={{ borderRight: '1px solid #222', px: 1, py: 0.05 }}>
							<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '9pt', lineHeight: 1.2 }}>
								{label}
							</Typography>
						</Box>
						<Box sx={{ px: 1, py: 0.05 }}>
							<Typography sx={{ fontFamily: FONT_FAMILY, fontSize: '9pt', lineHeight: 1.2 }}>
								{value}
							</Typography>
						</Box>
					</Box>
				))}
			</Box>
		</Box>
	);
}

function MenimbangBlock({ record }) {
	return (
		<Box>
			<Typography sx={SECTION_TITLE_SX}>Menimbang</Typography>
			<Box component="ol" sx={{ m: 0, pl: '22px' }}>
				{[
					'Perlunya untuk menjaga kedisiplinan dari setiap karyawan dalam rangka menjaga kelancaran kerja dan mempertahankan sikap kerja yang baik.',
					'Perlunya pembinaan kepada karyawan yang telah melakukan pelanggaran agar dapat memperbaiki kesalahan yang sudah dilakukan.',
					record.violation,
				].map((item) => (
					<Box component="li" key={item} sx={{ pl: 0.75, mb: 0.2 }}>
						<Typography sx={BODY_JUSTIFY_SX}>{item}</Typography>
					</Box>
				))}
			</Box>
		</Box>
	);
}

function MengingatBlock({ record }) {
	return (
		<Box>
			<Typography sx={SECTION_TITLE_SX}>Mengingat</Typography>
			<Box component="ol" start={4} sx={{ m: 0, pl: '22px' }}>
				<Box component="li" sx={{ pl: 0.75, mb: 0.35 }}>
					<Typography sx={BODY_JUSTIFY_SX}>Perjanjian Kerja Bersama (PKB)</Typography>
					{record.articleLabel ? (
						<Typography sx={{ ...BODY_SX, lineHeight: 1.25, textAlign: 'justify' }}>
							{record.articleLabel}
						</Typography>
					) : null}
					{record.articleContent ? (
						<Typography
							sx={{
								...BODY_SX,
								fontWeight: 700,
								fontStyle: 'italic',
								ml: 0.2,
								textAlign: 'justify',
							}}
						>
							{record.articleContent}
						</Typography>
					) : null}
				</Box>
				<Box component="li" sx={{ pl: 0.75 }}>
					<Typography sx={BODY_JUSTIFY_SX}>
						Bahwa setiap karyawan harus melakukan pekerjaan sesuai dengan ketentuan yang ada.
					</Typography>
				</Box>
			</Box>
		</Box>
	);
}

function DecisionBlock({ record, printConfig }) {
	return (
		<Box>
			<Typography
				sx={{
					fontFamily: FONT_FAMILY,
					fontSize: '12.5pt',
					fontWeight: 700,
					letterSpacing: '3.5pt',
					textAlign: 'center',
					lineHeight: 1.2,
					mb: 0.9,
				}}
			>
				MEMUTUSKAN
			</Typography>

			<Stack spacing={0.6}>
				<DecisionRow label="Menetapkan" />
				<DecisionRow label="Pertama" contentSx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
					<Typography sx={BODY_JUSTIFY_SX}>Perusahaan memberikan</Typography>
					<Box
						sx={{
							display: 'grid',
							gridTemplateColumns: 'repeat(4, max-content) 1fr',
							columnGap: 3,
							rowGap: 0.5,
							alignItems: 'center',
							mt: 0.1,
							mb: 0.15,
						}}
					>
						{CHECKBOX_ITEMS.map((item) => (
							<CheckboxMark
								key={item.key}
								label={item.label}
								checked={printConfig.checkedType === item.key}
							/>
						))}
						<Typography sx={{ ...BODY_SX, lineHeight: 1.2, justifySelf: 'start' }}>kepada;</Typography>
					</Box>
					<Box sx={{ display: 'grid', gridTemplateColumns: '78px 8px 1fr', columnGap: 2 }}>
						<Typography sx={{ ...BODY_SX, lineHeight: 1.25 }}>Nama</Typography>
						<Typography sx={{ ...BODY_SX, lineHeight: 1.25 }}>:</Typography>
						<Typography sx={{ ...BODY_SX, lineHeight: 1.25 }}>{record.employeeName}</Typography>
					</Box>
					<Box sx={{ display: 'grid', gridTemplateColumns: '78px 8px 1fr', columnGap: 2 }}>
						<Typography sx={{ ...BODY_SX, lineHeight: 1.25 }}>NIK</Typography>
						<Typography sx={{ ...BODY_SX, lineHeight: 1.25 }}>:</Typography>
						<Typography sx={{ ...BODY_SX, lineHeight: 1.25 }}>{record.employeeNo}</Typography>
					</Box>
				</DecisionRow>
				{printConfig.decisionRows.map((item) => (
					<DecisionRow key={item.label} label={item.label}>
						<Typography sx={BODY_JUSTIFY_SX}>{item.content}</Typography>
					</DecisionRow>
				))}
			</Stack>
		</Box>
	);
}

function IssueMetaBlock({ record }) {
	return (
		<Box sx={{ mt: 0.2 }}>
			<Stack spacing={0.15}>
				<Box sx={{ display: 'grid', gridTemplateColumns: '118px 8px 1fr', columnGap: 1 }}>
					<Typography sx={{ ...BODY_SX, lineHeight: 1.25 }}>Tanggal</Typography>
					<Typography sx={{ ...BODY_SX, lineHeight: 1.25 }}>:</Typography>
					<Typography sx={{ ...BODY_SX, lineHeight: 1.25 }}>
						{formatLongWarningDate(record.letterDate)}
					</Typography>
				</Box>
				<Box sx={{ display: 'grid', gridTemplateColumns: '118px 8px 1fr', columnGap: 1 }}>
					<Typography sx={{ ...BODY_SX, lineHeight: 1.25 }}>Dikeluarkan di</Typography>
					<Typography sx={{ ...BODY_SX, lineHeight: 1.25 }}>:</Typography>
					<Typography sx={{ ...BODY_SX, lineHeight: 1.25 }}>Cikarang</Typography>
				</Box>
				<Box sx={{ display: 'grid', gridTemplateColumns: '118px 8px 1fr', columnGap: 1 }}>
					<Typography sx={{ ...BODY_SX, lineHeight: 1.25 }}>Mengetahui</Typography>
				</Box>
			</Stack>
		</Box>
	);
}

function SignatureBlock({ record }) {
	return (
		<Box sx={{ mt: '8mm', display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: '34mm' }}>
			<Stack alignItems="flex-start">
				<Box sx={{ width: '58mm', borderTop: '2px dotted #111', mb: 0.7 }} />
				<Typography sx={{ ...BODY_SX, lineHeight: 1.2 }}>{record.superiorName}</Typography>
				<Typography sx={{ ...BODY_SX, fontSize: '9.5pt', fontStyle: 'italic', lineHeight: 1.2 }}>
					{record.superiorJobLevelName || '-'}
				</Typography>
			</Stack>
			<Stack alignItems="flex-start" sx={{ justifySelf: 'end' }}>
				<Box sx={{ width: '58mm', borderTop: '2px dotted #111', mb: 0.7 }} />
				<Typography sx={{ ...BODY_SX, lineHeight: 1.2 }}>{record.employeeName}</Typography>
				<Typography sx={{ ...BODY_SX, fontSize: '9.5pt', lineHeight: 1.2 }}>Karyawan</Typography>
			</Stack>
		</Box>
	);
}

function DistributionBlock() {
	return (
		<Box sx={{ mt: '6mm' }}>
			<Typography sx={BODY_SX}>Surat Keputusan ini disampaikan kepada:</Typography>
			<Box component="ol" sx={{ m: 0, pl: '22px' }}>
				{['Karyawan yang bersangkutan', 'Kepala Departemen yang bersangkutan', 'Arsip'].map((item) => (
					<Box component="li" key={item} sx={{ pl: 0.75 }}>
						<Typography sx={{ ...BODY_JUSTIFY_SX, lineHeight: 1.25 }}>{item}</Typography>
					</Box>
				))}
			</Box>
		</Box>
	);
}

function DocumentBody({ record, printConfig }) {
	const isSuspension = record.category === 'SUSPENSION';
	const titleVisibleWord = isSuspension ? 'SKORSING' : 'PERINGATAN';
	const titleStrikeWord = isSuspension ? 'PERINGATAN' : 'SKORSING';

	return (
		<>
			<CompanyLetterhead gap="1.2mm" />
			<LetterMetaGrid record={record} titleVisibleWord={titleVisibleWord} titleStrikeWord={titleStrikeWord} />
			<Stack spacing={1.6} sx={{ mt: 1.5, flex: 1 }}>
				<MenimbangBlock record={record} />
				<MengingatBlock record={record} />
				<DecisionBlock record={record} printConfig={printConfig} />
				<IssueMetaBlock record={record} />
			</Stack>
		</>
	);
}

function DocumentFooter({ record }) {
	return (
		<>
			<SignatureBlock record={record} />
			<DistributionBlock />
		</>
	);
}

function WarningLetterPrintDocument({ record }) {
	const measureRef = useRef(null);
	const [layout, setLayout] = useState({ scale: 1, pageCount: 1 });

	const printConfig = getDisciplinePrintConfig(record);

	useLayoutEffect(() => {
		let cancelled = false;

		const compute = async () => {
			if (document.fonts && document.fonts.ready) {
				try {
					await document.fonts.ready;
				} catch {
					/* font loading is best-effort */
				}
			}

			if (cancelled || !measureRef.current) {
				return;
			}

			const root = measureRef.current;
			const bodyEnd = root.querySelector('[data-marker="body-end"]');
			const pageEnd = root.querySelector('[data-marker="doc-end"]');
			const rootTop = root.getBoundingClientRect().top;

			const bodyMm = bodyEnd ? toMm(bodyEnd.getBoundingClientRect().top - rootTop) : 0;
			const totalMm = pageEnd ? toMm(pageEnd.getBoundingClientRect().top - rootTop) : 0;

			const singlePageScale = totalMm > 0 ? CONTENT_H_MM / totalMm : 1;

			if (singlePageScale >= MIN_SCALE) {
				setLayout({ scale: Math.min(1, singlePageScale), pageCount: 1 });

				return;
			}

			const bodyScale = bodyMm > 0 ? CONTENT_H_MM / bodyMm : 1;
			const scale = Math.min(1, bodyScale);

			setLayout({ scale: Math.max(MIN_SCALE, scale), pageCount: 2 });
		};

		compute();

		return () => {
			cancelled = true;
		};
	}, [record]);

	const needsSecondPage = layout.pageCount > 1;
	const totalPages = needsSecondPage ? 2 : 1;

	return (
		<>
			<Box
				ref={measureRef}
				aria-hidden
				sx={{
					position: 'absolute',
					left: '-9999px',
					top: 0,
					width: `${CONTENT_W_MM}mm`,
					fontFamily: FONT_FAMILY,
					fontSize: '10pt',
					color: '#000',
					visibility: 'hidden',
					pointerEvents: 'none',
					'@media print': {
						display: 'none',
					},
				}}
			>
				<DocumentBody record={record} printConfig={printConfig} />
				<Box data-marker="body-end" />
				<DocumentFooter record={record} />
				<Box data-marker="doc-end" />
			</Box>

			<PageShell pageNumber={1} totalPages={totalPages}>
				<Box sx={{ transform: `scale(${layout.scale})`, transformOrigin: 'top center' }}>
					<DocumentBody record={record} printConfig={printConfig} />
					{needsSecondPage ? null : <DocumentFooter record={record} />}
				</Box>
			</PageShell>

			{needsSecondPage ? (
				<PageShell pageNumber={2} totalPages={totalPages}>
					<Box sx={{ transform: `scale(${layout.scale})`, transformOrigin: 'top center' }}>
						<DocumentFooter record={record} />
					</Box>
				</PageShell>
			) : null}
		</>
	);
}

export default WarningLetterPrintDocument;
