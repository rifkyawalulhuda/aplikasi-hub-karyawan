import { useLayoutEffect, useRef, useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

import {
	CONFIRMATION_MODE_OPTIONS,
	DOCUMENT_CONFIDENTIALITY_OPTIONS,
	FORM_TEMPLATE,
	GOODS_TYPE_OPTIONS,
	HANDLING_TYPE_OPTIONS,
	HEADER_COMPANY_LINES,
	PURPOSE_OPTIONS,
	SLIP_TYPE_OPTIONS,
} from '@/pages/dokumen/lembarPengiriman/constants';
import { formatDateId } from '@/pages/dokumen/lembarPengiriman/utils';

import logoUrl from '@/assets/images/logo/png/logo_sankyu.png';

const FONT_FAMILY = 'Calibri, Carlito, "Segoe UI", Arial, sans-serif';
const TEXT_COLOR = '#000000';

const PX_PER_MM = 96 / 25.4;
const PAGE_W_MM = 210;
const PAGE_H_MM = 297;
const BOX_H_MM = 296;
const MARGIN_TOP_MM = 20;
const MARGIN_BOTTOM_MM = 10;
const MARGIN_SIDE_MM = 20;
const CONTENT_W_MM = PAGE_W_MM - MARGIN_SIDE_MM * 2;
const CONTENT_H_MM = PAGE_H_MM - MARGIN_TOP_MM - MARGIN_BOTTOM_MM;
const SAFETY_MM = 10;
const PAGE_BUDGET_MM = CONTENT_H_MM - SAFETY_MM;

const solidBorder = '0.5pt solid #000';
const dottedBorder = '0.5pt dotted #000';

const cellBase = {
	border: solidBorder,
	padding: '0.6mm 1.4mm',
	fontSize: '10pt',
	lineHeight: 1.1,
	color: TEXT_COLOR,
	verticalAlign: 'top',
};

function toMm(px) {
	return px / PX_PER_MM;
}

function PageBox({ pageNumber, totalPages, children }) {
	return (
		<Box
			data-page
			sx={{
				width: `${PAGE_W_MM}mm`,
				height: `${BOX_H_MM}mm`,
				boxSizing: 'border-box',
				pt: `${MARGIN_TOP_MM}mm`,
				pr: `${MARGIN_SIDE_MM}mm`,
				pb: `${MARGIN_BOTTOM_MM}mm`,
				pl: `${MARGIN_SIDE_MM}mm`,
				backgroundColor: '#fff',
				color: TEXT_COLOR,
				fontFamily: FONT_FAMILY,
				fontSize: '11pt',
				position: 'relative',
				overflow: 'hidden',
				'@media print': {
					breakAfter: 'page',
					pageBreakAfter: 'always',
					boxShadow: 'none',
					margin: 0,
				},
				'&:last-of-type': {
					'@media print': {
						breakAfter: 'auto',
						pageBreakAfter: 'auto',
					},
				},
			}}
		>
			{children}
			<Box
				sx={{
					position: 'absolute',
					left: `${MARGIN_SIDE_MM}mm`,
					right: `${MARGIN_SIDE_MM}mm`,
					bottom: '4mm',
					textAlign: 'center',
					fontSize: '9pt',
					color: TEXT_COLOR,
				}}
			>
				Page {pageNumber} of {totalPages}
			</Box>
		</Box>
	);
}

function Letterhead() {
	return (
		<Box sx={{ mb: '1.2mm' }}>
			<Stack direction="row" spacing="3mm" alignItems="center">
				<Box
					component="img"
					src={logoUrl}
					alt="Logo Sankyu"
					sx={{ height: '10mm', width: 'auto', objectFit: 'contain', flexShrink: 0 }}
				/>
				<Box sx={{ flex: 1 }}>
					<Box sx={{ fontSize: '12pt', fontWeight: 700, letterSpacing: '0.02em', lineHeight: 1.1 }}>
						{HEADER_COMPANY_LINES[0]}
					</Box>
					<Box sx={{ fontSize: '9.5pt', lineHeight: 1.12, mt: '0.3mm' }}>{HEADER_COMPANY_LINES[1]}</Box>
					<Box sx={{ fontSize: '9.5pt', lineHeight: 1.12 }}>{HEADER_COMPANY_LINES[2]}</Box>
				</Box>
			</Stack>
			<Box sx={{ borderBottom: '0.8pt solid #000', mt: '1.2mm' }} />
		</Box>
	);
}

function IdentityTable() {
	return (
		<Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', mb: '2mm' }}>
			<Box component="tbody">
				<Box component="tr">
					<Box
						component="td"
						rowSpan={3}
						sx={{ ...cellBase, width: '45%', fontWeight: 700, fontSize: '13pt', verticalAlign: 'middle' }}
					>
						{FORM_TEMPLATE.title}
					</Box>
					<Box component="td" sx={{ ...cellBase, width: '25%' }}>
						Tgl. Efektif
					</Box>
					<Box component="td" sx={{ ...cellBase, width: '30%' }}>
						{FORM_TEMPLATE.effectiveDate}
					</Box>
				</Box>
				<Box component="tr">
					<Box component="td" sx={cellBase}>
						Revisi
					</Box>
					<Box component="td" sx={cellBase}>
						{FORM_TEMPLATE.revision}
					</Box>
				</Box>
				<Box component="tr">
					<Box component="td" sx={cellBase}>
						No. Form
					</Box>
					<Box component="td" sx={cellBase}>
						{FORM_TEMPLATE.formNumber}
					</Box>
				</Box>
			</Box>
		</Box>
	);
}

function PartyTable({ slip }) {
	const isLastColumn = (index) => index === 3;
	const isLastRow = (index) => index === 3;
	const cell = (index, rowIndex, extra = {}) => ({
		...cellBase,
		borderTop: 'none',
		borderLeft: 'none',
		borderRight: isLastColumn(index) ? 'none' : dottedBorder,
		borderBottom: isLastRow(rowIndex) ? 'none' : dottedBorder,
		...extra,
	});

	return (
		<Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', border: solidBorder }}>
			<Box component="tbody">
				<Box component="tr">
					<Box component="td" sx={cell(0, 0, { width: '14%', verticalAlign: 'middle' })}>
						Untuk
					</Box>
					<Box component="td" sx={cell(1, 0, { width: '36%' })}>
						{slip.recipientName || '-'}
					</Box>
					<Box component="td" sx={cell(2, 0, { width: '14%', verticalAlign: 'middle' })}>
						Dari
					</Box>
					<Box component="td" sx={cell(3, 0, { width: '36%' })}>
						{slip.senderCompany || '-'}
					</Box>
				</Box>
				<Box component="tr">
					<Box component="td" sx={cell(0, 1, { verticalAlign: 'middle' })}>
						Alamat
					</Box>
					<Box component="td" sx={cell(1, 1)}>
						{slip.recipientAddress || '-'}
					</Box>
					<Box component="td" sx={cell(2, 1, { verticalAlign: 'middle' })}>
						Alamat
					</Box>
					<Box component="td" sx={cell(3, 1)}>
						{slip.senderAddress || '-'}
					</Box>
				</Box>
				<Box component="tr">
					<Box component="td" sx={cell(0, 2, { verticalAlign: 'middle' })}>
						Atensi
					</Box>
					<Box component="td" sx={cell(1, 2)}>
						{slip.recipientAttention || '-'}
					</Box>
					<Box component="td" sx={cell(2, 2, { verticalAlign: 'middle' })}>
						Pengirim
					</Box>
					<Box component="td" sx={cell(3, 2)}>
						{slip.senderName || '-'}
					</Box>
				</Box>
				<Box component="tr">
					<Box component="td" sx={cell(0, 3, { verticalAlign: 'middle' })}>
						Posisi
					</Box>
					<Box component="td" sx={cell(1, 3)}>
						{slip.recipientPosition || '-'}
					</Box>
					<Box component="td" sx={cell(2, 3, { verticalAlign: 'middle' })}>
						Posisi
					</Box>
					<Box component="td" sx={cell(3, 3)}>
						{slip.senderPosition || '-'}
					</Box>
				</Box>
			</Box>
		</Box>
	);
}

function Checkbox({ checked }) {
	return (
		<Box
			component="span"
			sx={{
				display: 'inline-flex',
				alignItems: 'center',
				justifyContent: 'center',
				width: '3.2mm',
				height: '3.2mm',
				border: '0.6pt solid #000',
				mr: '1mm',
				flexShrink: 0,
				fontSize: '9pt',
				fontWeight: 700,
				lineHeight: 1,
				verticalAlign: 'middle',
			}}
		>
			{checked ? 'X' : ''}
		</Box>
	);
}

function CheckboxGroup({ options, selected, otherValue, otherLabel = 'Lain-lain' }) {
	let selectedList = [];

	if (Array.isArray(selected)) {
		selectedList = selected;
	} else if (selected) {
		selectedList = [selected];
	}

	return (
		<Box
			sx={{
				display: 'flex',
				flexWrap: 'wrap',
				columnGap: '5mm',
				rowGap: '0.6mm',
				pl: '4mm',
				lineHeight: 1.2,
			}}
		>
			{options.map((option) => (
				<Box key={option.value} sx={{ display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
					<Checkbox checked={selectedList.includes(option.value)} />
					{option.value === 'LAINNYA' ? `${otherLabel} (${otherValue || '_______________'})` : option.label}
				</Box>
			))}
		</Box>
	);
}

function SectionTitle({ children }) {
	return <Box sx={{ fontWeight: 700, mt: '0.9mm', mb: '0.2mm', lineHeight: 1.15 }}>{children}</Box>;
}

function TitleBlock({ slip }) {
	return (
		<>
			<Box sx={{ textAlign: 'center', fontWeight: 700, mt: '0.6mm', lineHeight: 1.2 }}>NO. LEMBAR PENGIRIMAN</Box>
			<Box sx={{ textAlign: 'center', fontWeight: 700, mb: '1.2mm', lineHeight: 1.2 }}>({slip.slipNumber})</Box>
		</>
	);
}

function SectionsOneToFive({ slip }) {
	return (
		<>
			<SectionTitle>1. Jenis lembar pengiriman:</SectionTitle>
			<CheckboxGroup options={SLIP_TYPE_OPTIONS} selected={slip.slipTypes} otherValue={slip.slipTypeOther} />

			<SectionTitle>2. Jenis dokumen:</SectionTitle>
			<CheckboxGroup
				options={DOCUMENT_CONFIDENTIALITY_OPTIONS}
				selected={slip.documentConfidentiality}
				otherValue={slip.documentConfidentialityOther}
			/>

			<SectionTitle>3. Jenis Barang:</SectionTitle>
			<CheckboxGroup options={GOODS_TYPE_OPTIONS} selected={slip.goodsTypes} otherValue={slip.goodsTypeOther} />

			<SectionTitle>4. Informasi Penanganan Selama Pengiriman:</SectionTitle>
			<CheckboxGroup
				options={HANDLING_TYPE_OPTIONS}
				selected={slip.handlingTypes}
				otherValue={slip.handlingTypeOther}
			/>

			<SectionTitle>5. Dikirimkan Untuk:</SectionTitle>
			<CheckboxGroup options={PURPOSE_OPTIONS} selected={slip.purposes} otherValue={slip.purposeOther} />
		</>
	);
}

function ItemsTable({ items, from = 0, to = null }) {
	const end = to == null ? items.length : to;
	const slice = items.slice(from, end);

	return (
		<Box sx={{ mt: '1.2mm' }}>
			<ItemsTableHeaderLabel />
			<Box component="table" data-items sx={{ width: '100%', borderCollapse: 'collapse' }}>
				<Box component="thead">
					<Box component="tr">
						<Box component="th" sx={{ ...cellBase, width: '9%', fontWeight: 700, textAlign: 'center' }}>
							No
						</Box>
						<Box component="th" sx={{ ...cellBase, width: '58%', fontWeight: 700 }}>
							Deskripsi
						</Box>
						<Box component="th" sx={{ ...cellBase, fontWeight: 700 }}>
							Catatan (jika ada)
						</Box>
					</Box>
				</Box>
				<Box component="tbody">
					{slice.map((item, index) => (
						<Box component="tr" key={item.id ?? `row-${from + index}`} data-item-row>
							<Box component="td" sx={{ ...cellBase, textAlign: 'center', height: '4.4mm' }}>
								{from + index + 1}
							</Box>
							<Box component="td" sx={cellBase}>
								{item.description || ''}
							</Box>
							<Box component="td" sx={cellBase}>
								{item.note || ''}
							</Box>
						</Box>
					))}
				</Box>
			</Box>
		</Box>
	);
}

function ItemsTableHeaderLabel() {
	return <Box sx={{ fontWeight: 700, mt: '0.9mm', mb: '0.2mm', lineHeight: 1.15 }}>6. Keterangan/Detail</Box>;
}

function InfoSection({ slip }) {
	return (
		<>
			<SectionTitle>7. Informasi</SectionTitle>
			<Box sx={{ pl: '4mm', lineHeight: 1.2 }}>
				Konfirmasi pengiriman dokumen/barang, dapat dipilih sesuai kebutuhan:
			</Box>
			<Box sx={{ pl: '4mm', mt: '0.3mm', lineHeight: 1.2 }}>
				{CONFIRMATION_MODE_OPTIONS.map((option) => (
					<Box key={option.value} sx={{ display: 'flex', alignItems: 'flex-start', mb: '0.3mm' }}>
						<Box sx={{ mt: '0.2mm' }}>
							<Checkbox checked={slip.confirmationMode === option.value} />
						</Box>
						<Box>{option.label}</Box>
					</Box>
				))}
				<Box sx={{ pl: '4mm', whiteSpace: 'pre-line' }}>e-mail: {slip.confirmationEmail}</Box>
				<Box sx={{ pl: '4mm', whiteSpace: 'pre-line' }}>/Alamat: {slip.returnAddress}</Box>
			</Box>
		</>
	);
}

function SignatureBlock({ title, name, position, date }) {
	return (
		<Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', border: solidBorder }}>
			<Box component="tbody">
				<Box component="tr">
					<Box component="td" colSpan={2} sx={{ ...cellBase, fontWeight: 700, borderBottom: dottedBorder }}>
						{title}
					</Box>
				</Box>
				<Box component="tr">
					<Box component="td" sx={{ ...cellBase, width: '38%', borderTop: 'none', borderLeft: 'none' }}>
						Nama
					</Box>
					<Box
						component="td"
						sx={{ ...cellBase, borderTop: 'none', borderRight: 'none', borderLeft: dottedBorder }}
					>
						{name || ''}
					</Box>
				</Box>
				<Box component="tr">
					<Box
						component="td"
						sx={{ ...cellBase, borderTop: 'none', borderLeft: 'none', borderBottom: 'none' }}
					>
						Posisi
					</Box>
					<Box
						component="td"
						sx={{
							...cellBase,
							borderTop: 'none',
							borderRight: 'none',
							borderBottom: 'none',
							borderLeft: dottedBorder,
						}}
					>
						{position || ''}
					</Box>
				</Box>
				<Box component="tr">
					<Box component="td" sx={{ ...cellBase, borderTop: 'none', borderLeft: 'none' }}>
						Tanggal
					</Box>
					<Box
						component="td"
						sx={{ ...cellBase, borderTop: 'none', borderRight: 'none', borderLeft: dottedBorder }}
					>
						{date ? formatDateId(date) : ''}
					</Box>
				</Box>
				<Box component="tr">
					<Box
						component="td"
						sx={{
							...cellBase,
							height: '15mm',
							verticalAlign: 'top',
							borderTop: 'none',
							borderLeft: 'none',
							borderBottom: 'none',
						}}
					>
						Tanda tangan (Stamp)
					</Box>
					<Box
						component="td"
						sx={{
							...cellBase,
							height: '15mm',
							borderTop: 'none',
							borderRight: 'none',
							borderBottom: 'none',
							borderLeft: dottedBorder,
						}}
					/>
				</Box>
			</Box>
		</Box>
	);
}

function SignatureRow({ slip }) {
	return (
		<Box sx={{ display: 'flex', gap: '5mm', mt: '3mm', alignItems: 'flex-start' }}>
			<Box sx={{ flex: 1 }}>
				<SignatureBlock
					title="Dikirimkan Oleh;"
					name={slip.senderName}
					position={slip.senderPosition}
					date={slip.senderDate}
				/>
			</Box>
			<Box sx={{ flex: 1 }}>
				<SignatureBlock
					title="Diterima Oleh;"
					name={slip.receiverName}
					position={slip.receiverPosition}
					date={slip.receiverDate}
				/>
			</Box>
		</Box>
	);
}

function HeaderBlock({ slip }) {
	return (
		<>
			<Letterhead />
			<IdentityTable />
			<TitleBlock slip={slip} />
			<PartyTable slip={slip} />
			<SectionsOneToFive slip={slip} />
		</>
	);
}

function FooterBlock({ slip }) {
	return (
		<>
			<InfoSection slip={slip} />
			<SignatureRow slip={slip} />
		</>
	);
}

function buildLayout(measureRoot, rowHeights) {
	const headerMarker = measureRoot.querySelector('[data-marker="header-end"]');
	const itemsEndMarker = measureRoot.querySelector('[data-marker="items-end"]');
	const pageEndMarker = measureRoot.querySelector('[data-marker="page-end"]');
	const rootTop = measureRoot.getBoundingClientRect().top;

	const headerHeight = headerMarker ? toMm(headerMarker.getBoundingClientRect().top - rootTop) : 0;
	const itemsEnd = itemsEndMarker ? toMm(itemsEndMarker.getBoundingClientRect().top - rootTop) : 0;
	const pageEnd = pageEndMarker ? toMm(pageEndMarker.getBoundingClientRect().top - rootTop) : 0;

	const rowsTotal = rowHeights.reduce((total, value) => total + value, 0);
	const itemsChrome = Math.max(itemsEnd - headerHeight - rowsTotal, 0);
	const footerHeight = Math.max(pageEnd - itemsEnd, 0);
	const singlePageTotal = headerHeight + itemsChrome + rowsTotal + footerHeight;

	if (singlePageTotal <= PAGE_BUDGET_MM) {
		return {
			pages: [{ header: true, from: 0, to: rowHeights.length, footer: true }],
			totals: { singlePageTotal, headerHeight, itemsChrome, rowsTotal, footerHeight },
		};
	}

	const pages = [];
	let index = 0;
	let isFirst = true;

	while (index < rowHeights.length) {
		const available = PAGE_BUDGET_MM - (isFirst ? headerHeight : 0) - itemsChrome;
		let accumulated = 0;
		let count = 0;

		while (index + count < rowHeights.length && accumulated + rowHeights[index + count] <= available) {
			accumulated += rowHeights[index + count];
			count += 1;
		}

		if (count === 0) {
			count = 1;
		}

		pages.push({ header: isFirst, from: index, to: index + count, footer: false });
		index += count;
		isFirst = false;
	}

	const lastPage = pages[pages.length - 1];
	const rowsOnLast = rowHeights.slice(lastPage.from, lastPage.to).reduce((total, value) => total + value, 0);
	const usedOnLast = (lastPage.header ? headerHeight : 0) + itemsChrome + rowsOnLast;

	if (usedOnLast + footerHeight <= PAGE_BUDGET_MM) {
		lastPage.footer = true;
	} else {
		pages.push({ header: false, from: lastPage.to, to: lastPage.to, footer: true });
	}

	return {
		pages,
		totals: { singlePageTotal, headerHeight, itemsChrome, rowsTotal, footerHeight },
	};
}

function DeliverySlipPrintDocument({ slip, onReady }) {
	const measureRef = useRef(null);
	const [layout, setLayout] = useState(null);

	const items = slip?.items || [];
	const itemsKey = items.map((item) => `${item.id ?? ''}:${item.description ?? ''}:${item.note ?? ''}`).join('|');

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
			const rowElements = [...root.querySelectorAll('[data-item-row]')];
			const rowHeights = rowElements.map((row) => toMm(row.getBoundingClientRect().height));

			const nextLayout = buildLayout(root, rowHeights);
			setLayout(nextLayout);

			if (typeof onReady === 'function') {
				onReady(nextLayout);
			}
		};

		compute();

		return () => {
			cancelled = true;
		};
	}, [itemsKey, slip, onReady]);

	const totalPages = layout?.pages?.length || 1;

	return (
		<>
			<Box
				ref={measureRef}
				aria-hidden
				sx={{
					position: 'absolute',
					left: '-10000px',
					top: 0,
					width: `${CONTENT_W_MM}mm`,
					fontFamily: FONT_FAMILY,
					fontSize: '11pt',
					color: TEXT_COLOR,
					visibility: 'hidden',
					pointerEvents: 'none',
				}}
			>
				<HeaderBlock slip={slip} />
				<Box data-marker="header-end" />
				<ItemsTable items={items} />
				<Box data-marker="items-end" />
				<FooterBlock slip={slip} />
				<Box data-marker="page-end" />
			</Box>

			{(layout?.pages || [{ header: true, from: 0, to: items.length, footer: true }]).map((page, index) => (
				<PageBox key={`page-${index}`} pageNumber={index + 1} totalPages={totalPages}>
					{page.header ? <HeaderBlock slip={slip} /> : null}
					{page.to > page.from || !page.footer ? (
						<ItemsTable items={items} from={page.from} to={page.to} />
					) : null}
					{page.footer ? <FooterBlock slip={slip} /> : null}
				</PageBox>
			))}
		</>
	);
}

export default DeliverySlipPrintDocument;
