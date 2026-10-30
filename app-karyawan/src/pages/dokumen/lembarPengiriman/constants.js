export const FORM_TEMPLATE = {
	title: 'LEMBAR PENGIRIMAN',
	effectiveDate: '01 Agustus 2024',
	revision: '03',
	formNumber: 'SII-QSHE-050-02',
};

export const HEADER_COMPANY_LINES = [
	'PT SANKYU INDONESIA INTERNATIONAL',
	'QUALITY, SAFETY, HEALTH AND ENVIRONMENTAL DIVISION',
	'SISTEM MANAJEMEN TERINTEGRASI',
];

export const DEFAULT_SENDER_COMPANY = 'PT. Sankyu Indonesia International';

export const DEFAULT_SENDER_ADDRESS =
	'Jl. Kawasan Industri Terpadu Indonesia China (KITIC) Kav No. 20, Nagasari, Kec. Serang Baru, Kabupaten Bekasi, Jawa Barat 17330, Indonesia';

export const DEFAULT_CONFIRMATION_EMAIL = 'yadimulyadi@sankyu.co.id; rifki@sankyu.co.id';

export const SLIP_TYPE_OPTIONS = [
	{ value: 'ASLI', label: 'Asli' },
	{ value: 'COPY', label: 'Copy' },
	{ value: 'INISIAL', label: 'Inisial' },
	{ value: 'REVISI', label: 'Revisi' },
	{ value: 'LAINNYA', label: 'Lain-lain' },
];

export const DOCUMENT_CONFIDENTIALITY_OPTIONS = [
	{ value: 'RAHASIA', label: 'Rahasia' },
	{ value: 'UMUM', label: 'Umum' },
	{ value: 'LAINNYA', label: 'Lain-lain' },
];

export const GOODS_TYPE_OPTIONS = [
	{ value: 'ELEKTRONIK', label: 'Elektronik' },
	{ value: 'MESIN', label: 'Mesin' },
	{ value: 'LAINNYA', label: 'Lain-lain' },
];

export const HANDLING_TYPE_OPTIONS = [
	{ value: 'JANGAN_DIBANTING', label: 'Jangan dibanting' },
	{ value: 'JANGAN_DITUMPUK', label: 'Jangan ditumpuk' },
	{ value: 'HINDARI_AIR', label: 'Hindari terkena air' },
	{ value: 'LAINNYA', label: 'Lain-lain' },
];

export const PURPOSE_OPTIONS = [
	{ value: 'INFORMASI', label: 'Informasi' },
	{ value: 'KUTIPAN', label: 'Kutipan' },
	{ value: 'REKAMAN', label: 'Rekaman' },
	{ value: 'LAPORAN', label: 'Laporan' },
	{ value: 'REFERENSI', label: 'Referensi' },
	{ value: 'TINJAUAN', label: 'Tinjauan' },
	{ value: 'PERSETUJUAN', label: 'Persetujuan' },
	{ value: 'LAINNYA', label: 'Lain-lain' },
];

export const CONFIRMATION_MODE_OPTIONS = [
	{
		value: 'NO_RETURN',
		label: 'Tidak perlu mengirim kembali lembar pengiriman ini, setelah dokumen/barang diterima;',
	},
	{
		value: 'SIGN_AND_RETURN',
		label: 'Penerima dokumen/barang, harus menandatangani lembar ini, dan mengirimkan hasilnya. Melalui:',
	},
];

export const MIN_ITEM_ROWS = 5;

export const DELIVERY_SLIP_STATUS = {
	DRAFT: { label: 'Draft', color: 'default' },
	DITERIMA: { label: 'Diterima', color: 'success' },
};

export function getStatusConfig(status) {
	return DELIVERY_SLIP_STATUS[status] || DELIVERY_SLIP_STATUS.DRAFT;
}
