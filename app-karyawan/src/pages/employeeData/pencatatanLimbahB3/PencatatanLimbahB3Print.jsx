import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import GlobalStyles from '@mui/material/GlobalStyles';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';

import CompanyLetterhead from '@/components/dokumen/companyLetterhead';
import { getPencatatanPrint } from '@/services/b3WasteService';

const PAGE_W_MM = 210;
const PAGE_H_MM = 297;
const MARGIN_SIDE_MM = 12;
const MARGIN_TOP_MM = 8;
const MARGIN_BOTTOM_MM = 10;
const ROWS_PER_PAGE = 48;
const FONT_FAMILY = '"Calibri", "Arial", "Helvetica", sans-serif';

const FORM_NO = 'SII-QSHE-035-03';
const TGL_EFEKTIF = '01 Agustus 2024';
const REVISI = '02';

const BORDER = '0.5pt solid #000';

// Lebar kolom mengikuti grid dokumen asli (10550 twips, 15 kolom)
const COL_WIDTHS = [
	'4.31%',
	'10.19%',
	'10.70%',
	'10.46%',
	'11.10%',
	'4.45%',
	'6.41%',
	'4.09%',
	'3.47%',
	'8.44%',
	'5.01%',
	'3.27%',
	'4.29%',
	'1.32%',
	'12.47%',
];

const cellSx = {
	border: BORDER,
	padding: '0.2mm 1mm',
	fontSize: '7pt',
	lineHeight: 1.15,
	textAlign: 'center',
	verticalAlign: 'middle',
	overflow: 'hidden',
};

const dataCellSx = {
	...cellSx,
	whiteSpace: 'nowrap',
	textOverflow: 'ellipsis',
};

const headerCellSx = {
	...cellSx,
	fontWeight: 700,
	fontSize: '6.6pt',
};

const dataRowHeight = '3.4mm';
const ROW_H_MM = 3.4;
const PX_PER_MM = 96 / 25.4;
const CONTENT_H_MM = PAGE_H_MM - MARGIN_TOP_MM - MARGIN_BOTTOM_MM;
// Blok tanda tangan dicetak selebar setengah kertas A4
const SIGNATURE_W_MM = PAGE_W_MM / 2;

function formatTon(value) {
	if (value == null || Number.isNaN(Number(value))) return '';
	return Number(value).toLocaleString('id-ID', {
		minimumFractionDigits: 3,
		maximumFractionDigits: 3,
	});
}

function formatTanggal(value) {
	if (!value) return '';
	const raw = String(value);
	const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
	if (match) {
		const [, year, month, day] = match;
		return `${day}.${month}.${year}`;
	}
	const parsed = new Date(raw);
	if (Number.isNaN(parsed.getTime())) return raw;
	const day = String(parsed.getDate()).padStart(2, '0');
	const month = String(parsed.getMonth() + 1).padStart(2, '0');
	return `${day}.${month}.${parsed.getFullYear()}`;
}

function fillLine(value) {
	return (
		<Box
			component="span"
			sx={{
				display: 'inline-block',
				minWidth: '22mm',
				borderBottom: '0.5pt solid #000',
				px: '1mm',
				textAlign: 'left',
			}}
		>
			{value || '\u00A0'}
		</Box>
	);
}

/**
 * Halaman terakhir memuat blok Keterangan/Catatan/tanda tangan, sehingga kapasitas
 * barisnya lebih kecil. Sisa baris digeser ke halaman baru agar tidak terpotong.
 */
function buildPages(rows, rowsPerPage, lastPageCapacity) {
	const capacity = Math.max(1, Math.min(rowsPerPage, lastPageCapacity));
	const total = rows.length;

	if (total === 0) {
		return [[]];
	}

	let pageCount = 1;
	while ((pageCount - 1) * rowsPerPage + capacity < total) {
		pageCount += 1;
	}

	const pages = [];
	let index = 0;

	for (let page = 0; page < pageCount; page += 1) {
		const remaining = total - index;
		const pagesLeft = pageCount - page;

		if (pagesLeft === 1) {
			pages.push(rows.slice(index));
			break;
		}

		let take = Math.min(rowsPerPage, Math.ceil(remaining / pagesLeft));

		// Pastikan sisa baris masih muat di halaman-halaman berikutnya (halaman terakhir kapasitasnya lebih kecil)
		const maxForLaterPages = (pagesLeft - 2) * rowsPerPage + capacity;
		if (remaining - take > maxForLaterPages) {
			take = remaining - maxForLaterPages;
		}

		pages.push(rows.slice(index, index + take));
		index += take;
	}

	return pages;
}

function MetaBlock({ periode, lokasiKerja, penanggungJawab }) {
	return (
		<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 40mm', alignItems: 'stretch' }}>
			<Box
				sx={{
					border: BORDER,
					borderRight: 0,
					px: '2mm',
					py: '1mm',
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
					gap: '1mm',
				}}
			>
				<Typography sx={{ fontSize: '8.5pt', fontWeight: 700, textAlign: 'center', lineHeight: 1.15 }}>
					CATATAN PENGELOLAAN LIMBAH
				</Typography>
				<Typography sx={{ fontSize: '6.4pt', fontWeight: 700, lineHeight: 1.3 }}>
					Periode: {fillLine(periode)}, Lokasi Kerja: {fillLine(lokasiKerja)}, Penanggung jawab:{' '}
					{fillLine(penanggungJawab)},
				</Typography>
			</Box>
			<Box sx={{ border: BORDER }}>
				{[
					['Tgl. Efektif', TGL_EFEKTIF],
					['Revisi', REVISI],
					['No. Form', FORM_NO],
				].map(([label, value], index) => (
					<Box
						key={label}
						sx={{
							display: 'grid',
							gridTemplateColumns: '16mm 1fr',
							borderBottom: index < 2 ? BORDER : 0,
							minHeight: '4.1mm',
						}}
					>
						<Box sx={{ borderRight: BORDER, px: '1mm', display: 'flex', alignItems: 'center' }}>
							<Typography sx={{ fontSize: '6.6pt', lineHeight: 1.1 }}>{label}</Typography>
						</Box>
						<Box sx={{ px: '1mm', display: 'flex', alignItems: 'center' }}>
							<Typography sx={{ fontSize: '6.6pt', lineHeight: 1.1 }}>{value}</Typography>
						</Box>
					</Box>
				))}
			</Box>
		</Box>
	);
}

function TableHeaderRows() {
	return (
		<Box component="thead">
			<Box component="tr">
				<Box component="th" rowSpan={2} sx={{ ...headerCellSx, width: COL_WIDTHS[0] }}>
					NO
				</Box>
				<Box component="th" colSpan={2} sx={headerCellSx}>
					TANGGAL
				</Box>
				<Box component="th" rowSpan={2} sx={headerCellSx}>
					PENGELOLA PIHAK KE-3
				</Box>
				<Box component="th" rowSpan={2} sx={headerCellSx}>
					NOPOL KENDARAAN
				</Box>
				<Box component="th" colSpan={2} rowSpan={2} sx={headerCellSx}>
					JUMLAH LIMBAH (Ton)
				</Box>
				<Box component="th" colSpan={2} rowSpan={2} sx={headerCellSx}>
					JENIS LIMBAH
				</Box>
				<Box component="th" colSpan={3} rowSpan={2} sx={headerCellSx}>
					DOKUMEN
					<Box component="div" sx={{ fontWeight: 400, mt: '0.4mm' }}>
						No. e-Manifest
					</Box>
				</Box>
				<Box component="th" colSpan={3} rowSpan={2} sx={headerCellSx}>
					SURAT JALAN
				</Box>
			</Box>
			<Box component="tr">
				<Box component="th" sx={{ ...headerCellSx, height: '4.2mm' }}>
					MASUK
				</Box>
				<Box component="th" sx={headerCellSx}>
					KELUAR
				</Box>
			</Box>
		</Box>
	);
}

function DataRow({ row, index }) {
	const isEmpty = !row;

	return (
		<Box component="tr" sx={{ height: dataRowHeight }}>
			<Box component="td" sx={dataCellSx}>
				{isEmpty ? '' : index + 1}
			</Box>
			<Box component="td" sx={dataCellSx}>
				{isEmpty ? '' : formatTanggal(row.tanggalMasuk)}
			</Box>
			<Box component="td" sx={dataCellSx}>
				{isEmpty ? '' : formatTanggal(row.tanggalKeluar)}
			</Box>
			<Box component="td" sx={dataCellSx}>
				{isEmpty ? '' : row.pengelola}
			</Box>
			<Box component="td" sx={dataCellSx}>
				{isEmpty ? '' : row.nopolKendaraan}
			</Box>
			<Box component="td" colSpan={2} sx={{ ...dataCellSx, textAlign: 'right' }}>
				{isEmpty ? '' : formatTon(row.jumlahTon)}
			</Box>
			<Box component="td" colSpan={2} sx={dataCellSx}>
				{isEmpty ? '' : row.jenisLimbahKode}
			</Box>
			<Box component="td" colSpan={3} sx={{ ...dataCellSx, textAlign: 'left' }}>
				{isEmpty ? '' : row.nomorEManifest}
			</Box>
			<Box component="td" colSpan={3} sx={{ ...dataCellSx, textAlign: 'left' }}>
				{isEmpty ? '' : row.nomorSuratJalan}
			</Box>
		</Box>
	);
}

function KeteranganBlock({ keterangan }) {
	return (
		<Box sx={{ mt: '1.2mm', fontSize: '6.4pt', lineHeight: 1.35 }}>
			<Typography sx={{ fontSize: '6.6pt', fontWeight: 700 }}>
				Keterangan (Jenis Limbah B3 – berdasarkan kode limbah):
			</Typography>
			{keterangan.length === 0 ? (
				<Typography sx={{ fontSize: '6.4pt' }}>-</Typography>
			) : (
				<Box component="ol" sx={{ m: 0, pl: '4.5mm' }}>
					{keterangan.map((item) => (
						<Box component="li" key={item.kode} sx={{ pl: '0.5mm' }}>
							{item.nama} = {item.kode}
						</Box>
					))}
				</Box>
			)}
		</Box>
	);
}

function CatatanBlock({ catatan }) {
	return (
		<Box sx={{ mt: '1.4mm', fontSize: '6.4pt', lineHeight: 1.35 }}>
			<Typography sx={{ fontSize: '6.6pt', fontWeight: 700 }}>Catatan:</Typography>
			<Typography sx={{ fontSize: '6.4pt', whiteSpace: 'pre-wrap', minHeight: '5mm' }}>
				{catatan || ''}
			</Typography>
		</Box>
	);
}

function SignatureBlock({ dibuatOleh, diperiksaOleh, diketahuiOleh }) {
	const columns = [
		{ label: 'Dibuat oleh', name: dibuatOleh },
		{ label: 'Diperiksa Oleh', name: diperiksaOleh },
		{ label: 'Diketahui Oleh', name: diketahuiOleh },
	];

	return (
		<Box
			component="table"
			sx={{
				width: `${SIGNATURE_W_MM}mm`,
				borderCollapse: 'collapse',
				tableLayout: 'fixed',
				justifySelf: 'end',
				alignSelf: 'start',
			}}
		>
			<Box component="tbody">
				<Box component="tr">
					<Box component="td" sx={{ ...cellSx, width: '18mm', height: '4.6mm', fontWeight: 700 }} />
					{columns.map((column) => (
						<Box component="td" key={column.label} sx={{ ...cellSx, fontWeight: 700 }}>
							{column.label}
						</Box>
					))}
				</Box>
				<Box component="tr" sx={{ height: '11mm' }}>
					<Box component="td" sx={{ ...cellSx, fontWeight: 700 }}>
						Tanda tangan
					</Box>
					{columns.map((column) => (
						<Box component="td" key={`ttd-${column.label}`} sx={cellSx} />
					))}
				</Box>
				<Box component="tr" sx={{ height: '4.6mm' }}>
					<Box component="td" sx={{ ...cellSx, fontWeight: 700 }}>
						Nama
					</Box>
					{columns.map((column) => (
						<Box component="td" key={`nama-${column.label}`} sx={cellSx}>
							{column.name || ''}
						</Box>
					))}
				</Box>
			</Box>
		</Box>
	);
}

/**
 * Footer halaman terakhir: Keterangan + Catatan di kiri, tanda tangan (setengah lebar A4)
 * rata kanan. Tinggi blok diukur dari kolom yang paling tinggi.
 */
function DocumentFooter({ keterangan, catatan, dibuatOleh, diperiksaOleh, diketahuiOleh }) {
	return (
		<Box sx={{ mt: '1.2mm' }}>
			<Box data-marker="footer-start" />
			<Box
				sx={{
					display: 'grid',
					gridTemplateColumns: `minmax(0, 1fr) ${SIGNATURE_W_MM}mm`,
					columnGap: '3mm',
					alignItems: 'start',
				}}
			>
				<Box sx={{ minWidth: 0 }}>
					<KeteranganBlock keterangan={keterangan} />
					<CatatanBlock catatan={catatan} />
				</Box>
				<SignatureBlock dibuatOleh={dibuatOleh} diperiksaOleh={diperiksaOleh} diketahuiOleh={diketahuiOleh} />
			</Box>
			<Box data-marker="footer-end" />
		</Box>
	);
}

function PageShell({ children, isLast, pageNumber, totalPages }) {
	return (
		<Box
			sx={{
				width: `${PAGE_W_MM}mm`,
				height: `${PAGE_H_MM}mm`,
				position: 'relative',
				mx: 'auto',
				bgcolor: '#fff',
				color: '#000',
				boxShadow: '0 12px 30px rgba(15, 23, 42, 0.12)',
				overflow: 'hidden',
				fontFamily: FONT_FAMILY,
				boxSizing: 'border-box',
				px: `${MARGIN_SIDE_MM}mm`,
				pt: `${MARGIN_TOP_MM}mm`,
				pb: `${MARGIN_BOTTOM_MM}mm`,
				'@media print': {
					boxShadow: 'none',
					m: 0,
					breakAfter: isLast ? 'auto' : 'page',
					pageBreakAfter: isLast ? 'auto' : 'always',
				},
			}}
		>
			{children}
			<Box
				sx={{
					position: 'absolute',
					left: `${MARGIN_SIDE_MM}mm`,
					right: `${MARGIN_SIDE_MM}mm`,
					bottom: '6mm',
					borderTop: '0.5pt solid #79a5ff',
				}}
			/>
			<Typography
				sx={{
					position: 'absolute',
					right: `${MARGIN_SIDE_MM}mm`,
					bottom: '2.4mm',
					fontFamily: FONT_FAMILY,
					fontSize: '8pt',
					fontWeight: 700,
				}}
			>
				{`Page ${pageNumber} of ${totalPages}`}
			</Typography>
		</Box>
	);
}

function PencatatanLimbahB3Print() {
	const [searchParams] = useSearchParams();
	const siteId = Number(searchParams.get('siteId'));
	const from = searchParams.get('from') || '';
	const to = searchParams.get('to') || '';
	const periodeText = searchParams.get('periode') || '';
	const lokasiKerja = searchParams.get('lokasiKerja') || '';
	const penanggungJawab = searchParams.get('penanggungJawab') || '';
	const dibuatOleh = searchParams.get('dibuatOleh') || '';
	const diperiksaOleh = searchParams.get('diperiksaOleh') || '';
	const diketahuiOleh = searchParams.get('diketahuiOleh') || '';
	const catatan = searchParams.get('catatan') || '';

	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [lastPageCapacity, setLastPageCapacity] = useState(ROWS_PER_PAGE);
	const measureRef = useRef(null);

	const fetchData = useCallback(async () => {
		if (!Number.isFinite(siteId) || !siteId) {
			setError('Parameter site tidak valid.');
			setLoading(false);
			return;
		}

		setLoading(true);
		try {
			const result = await getPencatatanPrint(siteId, { from, to });
			setData(result);
			setError('');
		} catch (err) {
			setError(err.message || 'Gagal memuat data pencatatan limbah B3.');
		} finally {
			setLoading(false);
		}
	}, [siteId, from, to]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const keterangan = data?.keterangan || [];

	useLayoutEffect(() => {
		let cancelled = false;

		const measure = async () => {
			if (document.fonts?.ready) {
				try {
					await document.fonts.ready;
				} catch {
					/* font loading is best-effort */
				}
			}

			if (cancelled || !measureRef.current) return;

			const root = measureRef.current;
			const chromeEnd = root.querySelector('[data-marker="chrome-end"]');
			const footerStart = root.querySelector('[data-marker="footer-start"]');
			const footerEnd = root.querySelector('[data-marker="footer-end"]');

			if (!chromeEnd || !footerStart || !footerEnd) return;

			const rootTop = root.getBoundingClientRect().top;
			const chromeH = chromeEnd.getBoundingClientRect().top - rootTop;
			const footerH = footerEnd.getBoundingClientRect().top - footerStart.getBoundingClientRect().top;
			const available = CONTENT_H_MM * PX_PER_MM - chromeH - footerH - 2 * PX_PER_MM;
			const capacity = Math.floor(available / (ROW_H_MM * PX_PER_MM));

			if (!Number.isFinite(capacity)) return;

			setLastPageCapacity(Math.max(0, Math.min(ROWS_PER_PAGE, capacity)));
		};

		measure();

		return () => {
			cancelled = true;
		};
	}, [keterangan, catatan, dibuatOleh, diperiksaOleh, diketahuiOleh]);

	const pages = useMemo(() => {
		const rows = data?.rows || [];
		return buildPages(rows, ROWS_PER_PAGE, lastPageCapacity);
	}, [data, lastPageCapacity]);

	const pageOffsets = useMemo(() => {
		const offsets = [];
		let running = 0;
		pages.forEach((pageRows) => {
			offsets.push(running);
			running += pageRows.length;
		});
		return offsets;
	}, [pages]);

	if (loading) {
		return (
			<Stack alignItems="center" justifyContent="center" sx={{ minHeight: '60vh' }}>
				<CircularProgress />
			</Stack>
		);
	}

	if (error) {
		return (
			<Stack alignItems="center" spacing={2} sx={{ py: 8 }}>
				<Typography color="error">{error}</Typography>
			</Stack>
		);
	}

	return (
		<>
			<GlobalStyles
				styles={{
					'@page': { size: 'A4', margin: 0 },
					'@media print': {
						html: { margin: 0, padding: 0 },
						body: { margin: 0, padding: 0, background: '#fff' },
					},
				}}
			/>
			<Box
				sx={{
					backgroundColor: '#f3f4f6',
					minHeight: '100vh',
					py: 3,
					'@media print': { bgcolor: '#fff', py: 0 },
				}}
			>
				<Stack
					direction="row"
					justifyContent="center"
					spacing={1}
					sx={{ mb: 2, '@media print': { display: 'none' } }}
				>
					<Button variant="contained" startIcon={<PrintOutlinedIcon />} onClick={() => window.print()}>
						Cetak
					</Button>
					<Button variant="outlined" onClick={() => window.close()}>
						Tutup
					</Button>
				</Stack>

				<Box
					ref={measureRef}
					aria-hidden
					sx={{
						position: 'absolute',
						left: '-9999px',
						top: 0,
						width: `${PAGE_W_MM - MARGIN_SIDE_MM * 2}mm`,
						fontFamily: FONT_FAMILY,
						color: '#000',
						visibility: 'hidden',
						pointerEvents: 'none',
						'@media print': { display: 'none' },
					}}
				>
					<CompanyLetterhead gap="1mm" />
					<MetaBlock periode={periodeText} lokasiKerja={lokasiKerja} penanggungJawab={penanggungJawab} />
					<Box
						component="table"
						sx={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', mt: '0.6mm' }}
					>
						<colgroup>
							{COL_WIDTHS.map((width) => (
								<col key={width} style={{ width }} />
							))}
						</colgroup>
						<TableHeaderRows />
					</Box>
					<Box data-marker="chrome-end" />
					<DocumentFooter
						keterangan={keterangan}
						catatan={catatan}
						dibuatOleh={dibuatOleh}
						diperiksaOleh={diperiksaOleh}
						diketahuiOleh={diketahuiOleh}
					/>
				</Box>

				{pages.map((pageRows, pageIndex) => {
					const isLast = pageIndex === pages.length - 1;
					const fillerTarget = isLast ? lastPageCapacity : ROWS_PER_PAGE;
					const filledRows = [...pageRows];
					while (filledRows.length < fillerTarget) filledRows.push(null);

					return (
						<PageShell
							key={`page-${pageIndex}`}
							isLast={isLast}
							pageNumber={pageIndex + 1}
							totalPages={pages.length}
						>
							<CompanyLetterhead gap="1mm" />
							<MetaBlock
								periode={periodeText}
								lokasiKerja={lokasiKerja}
								penanggungJawab={penanggungJawab}
							/>
							<Box
								component="table"
								sx={{
									width: '100%',
									borderCollapse: 'collapse',
									tableLayout: 'fixed',
									mt: '0.6mm',
								}}
							>
								<colgroup>
									{COL_WIDTHS.map((width) => (
										<col key={width} style={{ width }} />
									))}
								</colgroup>
								<TableHeaderRows />
								<Box component="tbody">
									{filledRows.map((row, rowIndex) => (
										<DataRow
											key={
												row
													? `row-${pageIndex}-${rowIndex}-${row.nomorSuratJalan}`
													: `empty-${pageIndex}-${rowIndex}`
											}
											row={row}
											index={pageOffsets[pageIndex] + rowIndex}
										/>
									))}
								</Box>
							</Box>

							{isLast ? (
								<DocumentFooter
									keterangan={keterangan}
									catatan={catatan}
									dibuatOleh={dibuatOleh}
									diperiksaOleh={diperiksaOleh}
									diketahuiOleh={diketahuiOleh}
								/>
							) : null}
						</PageShell>
					);
				})}
			</Box>
		</>
	);
}

export default PencatatanLimbahB3Print;
