import { Router } from 'express';
import * as yup from 'yup';

import prisma from '../lib/prisma.js';
import { generateB3WasteExcel } from '../lib/b3WasteExport.js';
import requireSiteIsolation from '../middleware/requireSiteIsolation.js';

const router = Router();

router.use(requireSiteIsolation({ modelType: 'per-site' }));

function getSiteId(req) {
	if (req.isSuperAdmin) {
		const querySiteId = parseInt(req.query.siteId);
		return isNaN(querySiteId) ? null : querySiteId;
	}
	return req.admin?.siteId || null;
}

function withAsync(handler) {
	return (req, res, next) => {
		Promise.resolve(handler(req, res, next)).catch(next);
	};
}

const createWasteRecordSchema = yup.object().shape({
	jenisLimbahId: yup.number().required('Jenis limbah wajib dipilih'),
	tanggalMasuk: yup
		.date()
		.required('Tanggal masuk wajib diisi')
		.min(new Date('2020-01-01'), 'Tanggal masuk minimal 1 Januari 2020')
		.max(new Date(), 'Tanggal masuk tidak boleh melebihi hari ini'),
	sumberLimbah: yup
		.string()
		.trim()
		.required('Sumber limbah wajib diisi')
		.max(200, 'Sumber limbah maksimal 200 karakter'),
	jumlahMasuk: yup
		.number()
		.required('Jumlah masuk wajib diisi')
		.min(0.01, 'Jumlah masuk minimal 0.01')
		.max(999999.99, 'Jumlah masuk maksimal 999999.99'),
	maksimalPenyimpanan: yup
		.number()
		.required('Maksimal penyimpanan wajib dipilih')
		.oneOf([90, 180], 'Maksimal penyimpanan harus 90 atau 180 hari'),
	petugasPenanggungJawab: yup
		.string()
		.trim()
		.required('Petugas penanggung jawab wajib diisi')
		.max(100, 'Petugas penanggung jawab maksimal 100 karakter'),
});

const updateWasteRecordSchema = yup.object().shape({
	jenisLimbahId: yup.number().required('Jenis limbah wajib dipilih'),
	tanggalMasuk: yup
		.date()
		.required('Tanggal masuk wajib diisi')
		.min(new Date('2020-01-01'), 'Tanggal masuk minimal 1 Januari 2020')
		.max(new Date(), 'Tanggal masuk tidak boleh melebihi hari ini'),
	sumberLimbah: yup
		.string()
		.trim()
		.required('Sumber limbah wajib diisi')
		.max(200, 'Sumber limbah maksimal 200 karakter'),
	jumlahMasuk: yup
		.number()
		.required('Jumlah masuk wajib diisi')
		.min(0.01, 'Jumlah masuk minimal 0.01')
		.max(999999.99, 'Jumlah masuk maksimal 999999.99'),
	maksimalPenyimpanan: yup
		.number()
		.required('Maksimal penyimpanan wajib dipilih')
		.oneOf([90, 180], 'Maksimal penyimpanan harus 90 atau 180 hari'),
});

/**
 * Normalize date string ke UTC noon untuk mencegah timezone shift
 * Input: '2026-06-20' → Output: Date('2026-06-20T12:00:00.000Z')
 */
function toDateOnly(value) {
	if (!value) return null;

	// Jika string format YYYY-MM-DD, parse langsung tanpa timezone ambiguity
	if (typeof value === 'string') {
		const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
		if (match) {
			return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0));
		}
	}

	// Jika Date object (dari Yup transform), ambil local date components
	if (value instanceof Date) {
		return new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate(), 12, 0, 0));
	}

	// Fallback
	const d = new Date(value);
	return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0));
}

/**
 * Hitung tanggalBatas = tanggalMasuk + maksimalPenyimpanan hari
 */
function computeTanggalBatas(tanggalMasuk, maksimalPenyimpanan) {
	const date = new Date(tanggalMasuk);
	date.setUTCDate(date.getUTCDate() + maksimalPenyimpanan);
	return date;
}

/**
 * Hitung computed fields untuk setiap waste record
 */
function computeFields(record) {
	const jumlahMasuk = parseFloat(record.jumlahMasuk);
	const totalKeluar = record.outRecords.reduce((sum, out) => sum + parseFloat(out.jumlahKeluar), 0);

	const sisaLimbah = parseFloat((jumlahMasuk - totalKeluar).toFixed(2));

	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const tanggalBatas = new Date(record.tanggalBatas);
	tanggalBatas.setHours(0, 0, 0, 0);
	const diffMs = tanggalBatas.getTime() - today.getTime();
	const sisaHari = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

	let statusPenyimpanan;
	if (sisaLimbah <= 0) {
		statusPenyimpanan = 'normal';
	} else if (sisaHari > 14) {
		statusPenyimpanan = 'normal';
	} else if (sisaHari >= 1 && sisaHari <= 14) {
		statusPenyimpanan = 'warning';
	} else {
		statusPenyimpanan = 'overdue';
	}

	return { sisaLimbah, sisaHari, statusPenyimpanan };
}

// GET / — daftar pencatatan limbah masuk dengan pagination, sorting, computed fields
router.get(
	'/',
	withAsync(async (req, res) => {
		const siteId = getSiteId(req);
		const page = parseInt(req.query.page) || 0;
		const pageSize = parseInt(req.query.pageSize) || 25;
		const sortField = req.query.sortField || 'tanggalMasuk';
		const sortOrder = req.query.sortOrder || 'desc';

		// Validasi sortField
		const allowedSortFields = ['tanggalMasuk', 'tanggalBatas'];
		const validSortField = allowedSortFields.includes(sortField) ? sortField : 'tanggalMasuk';
		const validSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

		const [data, total] = await Promise.all([
			prisma.b3WasteRecord.findMany({
				where: { siteId },
				skip: page * pageSize,
				take: pageSize,
				orderBy: { [validSortField]: validSortOrder },
				include: {
					jenisLimbah: {
						select: { id: true, kode: true, nama: true },
					},
					outRecords: {
						select: {
							id: true,
							tanggalKeluar: true,
							jumlahKeluar: true,
							tujuanPenyerahan: true,
							nomorDokumen: true,
							petugasPenanggungJawab: true,
							vendor: { select: { id: true, vendorName: true } },
						},
					},
				},
			}),
			prisma.b3WasteRecord.count({ where: { siteId } }),
		]);

		const records = data.map((record) => {
			const { sisaLimbah, sisaHari, statusPenyimpanan } = computeFields(record);
			return {
				...record,
				sisaLimbah,
				sisaHari,
				statusPenyimpanan,
			};
		});

		res.json({ data: records, total, page, pageSize });
	}),
);

// POST / — tambah limbah masuk
router.post(
	'/',
	withAsync(async (req, res) => {
		const siteId = getSiteId(req);

		let body;
		try {
			body = await createWasteRecordSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
		} catch (err) {
			return res.status(400).json({ message: err.errors?.[0] || 'Data tidak valid' });
		}

		// Validasi precision jumlahMasuk (max 2 decimal places)
		const jumlahStr = body.jumlahMasuk.toString();
		const decimalPart = jumlahStr.split('.')[1];
		if (decimalPart && decimalPart.length > 2) {
			return res.status(400).json({ message: 'Jumlah masuk maksimal 2 angka di belakang koma' });
		}

		const normalizedTanggalMasuk = toDateOnly(body.tanggalMasuk);
const tanggalBatas = computeTanggalBatas(normalizedTanggalMasuk, body.maksimalPenyimpanan);

		const record = await prisma.b3WasteRecord.create({
			data: {
				siteId,
				jenisLimbahId: body.jenisLimbahId,
				tanggalMasuk: normalizedTanggalMasuk,
				sumberLimbah: body.sumberLimbah,
				jumlahMasuk: body.jumlahMasuk,
				maksimalPenyimpanan: body.maksimalPenyimpanan,
				tanggalBatas,
				petugasPenanggungJawab: body.petugasPenanggungJawab,
			},
			include: {
				jenisLimbah: {
					select: { id: true, kode: true, nama: true },
				},
				outRecords: true,
			},
		});

		res.status(201).json(record);
	}),
);

// PUT /:id — edit limbah masuk (petugasPenanggungJawab immutable)
router.put(
	'/:id',
	withAsync(async (req, res) => {
		const siteId = getSiteId(req);
		const id = parseInt(req.params.id);

		if (isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid' });
		}

		const existing = await prisma.b3WasteRecord.findFirst({
			where: { id, siteId },
		});

		if (!existing) {
			return res.status(404).json({ message: 'Data tidak ditemukan' });
		}

		let body;
		try {
			body = await updateWasteRecordSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
		} catch (err) {
			return res.status(400).json({ message: err.errors?.[0] || 'Data tidak valid' });
		}

		// Validasi precision jumlahMasuk (max 2 decimal places)
		const jumlahStr = body.jumlahMasuk.toString();
		const decimalPart = jumlahStr.split('.')[1];
		if (decimalPart && decimalPart.length > 2) {
			return res.status(400).json({ message: 'Jumlah masuk maksimal 2 angka di belakang koma' });
		}

		const normalizedTanggalMasuk = toDateOnly(body.tanggalMasuk);
const tanggalBatas = computeTanggalBatas(normalizedTanggalMasuk, body.maksimalPenyimpanan);

		const updated = await prisma.b3WasteRecord.update({
			where: { id },
			data: {
				jenisLimbahId: body.jenisLimbahId,
				tanggalMasuk: normalizedTanggalMasuk,
				sumberLimbah: body.sumberLimbah,
				jumlahMasuk: body.jumlahMasuk,
				maksimalPenyimpanan: body.maksimalPenyimpanan,
				tanggalBatas,
				// petugasPenanggungJawab di-strip (immutable)
			},
			include: {
				jenisLimbah: {
					select: { id: true, kode: true, nama: true },
				},
				outRecords: true,
			},
		});

		res.json(updated);
	}),
);

// DELETE /:id — hapus limbah masuk (tolak jika memiliki outRecords)
router.delete(
	'/:id',
	withAsync(async (req, res) => {
		const siteId = getSiteId(req);
		const id = parseInt(req.params.id);

		if (isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid' });
		}

		const existing = await prisma.b3WasteRecord.findFirst({
			where: { id, siteId },
		});

		if (!existing) {
			return res.status(404).json({ message: 'Data tidak ditemukan' });
		}

		// Pre-check: apakah masih memiliki outRecords terkait
		const outRecordCount = await prisma.b3WasteOutRecord.count({
			where: { wasteRecordId: id },
		});

		if (outRecordCount > 0) {
			return res
				.status(409)
				.json({ message: 'Data tidak dapat dihapus karena masih memiliki catatan limbah keluar' });
		}

		await prisma.b3WasteRecord.delete({ where: { id } });

		res.status(204).send();
	}),
);

// --- Out Records ---

const createOutRecordSchema = yup.object().shape({
	tanggalKeluar: yup.date().required('Tanggal keluar wajib diisi'),
	jumlahKeluar: yup.number().required('Jumlah keluar wajib diisi').min(0.01, 'Jumlah keluar minimal 0.01'),
	tujuanPenyerahan: yup
		.string()
		.trim()
		.required('Tujuan penyerahan wajib diisi')
		.max(200, 'Tujuan penyerahan maksimal 200 karakter'),
	nomorDokumen: yup
		.string()
		.trim()
		.required('Nomor dokumen wajib diisi')
		.max(100, 'Nomor dokumen maksimal 100 karakter'),
	vendorId: yup.number().nullable().notRequired(),
	petugasPenanggungJawab: yup
		.string()
		.trim()
		.required('Petugas penanggung jawab wajib diisi')
		.max(100, 'Petugas penanggung jawab maksimal 100 karakter'),
});

const updateOutRecordSchema = yup.object().shape({
	tanggalKeluar: yup.date().required('Tanggal keluar wajib diisi'),
	jumlahKeluar: yup.number().required('Jumlah keluar wajib diisi').min(0.01, 'Jumlah keluar minimal 0.01'),
	tujuanPenyerahan: yup
		.string()
		.trim()
		.required('Tujuan penyerahan wajib diisi')
		.max(200, 'Tujuan penyerahan maksimal 200 karakter'),
	nomorDokumen: yup
		.string()
		.trim()
		.required('Nomor dokumen wajib diisi')
		.max(100, 'Nomor dokumen maksimal 100 karakter'),
	vendorId: yup.number().nullable().notRequired(),
});

// POST /:id/out — tambah limbah keluar
router.post(
	'/:id/out',
	withAsync(async (req, res) => {
		const siteId = getSiteId(req);
		const wasteRecordId = parseInt(req.params.id);

		if (isNaN(wasteRecordId)) {
			return res.status(400).json({ message: 'ID tidak valid' });
		}

		// Find parent waste record
		const parentRecord = await prisma.b3WasteRecord.findFirst({
			where: { id: wasteRecordId, siteId },
			include: { outRecords: { select: { jumlahKeluar: true } } },
		});

		if (!parentRecord) {
			return res.status(404).json({ message: 'Data tidak ditemukan' });
		}

		let body;
		try {
			body = await createOutRecordSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
		} catch (err) {
			return res.status(400).json({ message: err.errors?.[0] || 'Data tidak valid' });
		}

		// Validasi precision jumlahKeluar (max 2 decimal places)
		const jumlahStr = body.jumlahKeluar.toString();
		const decimalPart = jumlahStr.split('.')[1];
		if (decimalPart && decimalPart.length > 2) {
			return res.status(400).json({ message: 'Jumlah keluar maksimal 2 angka di belakang koma' });
		}

		// Validasi tanggalKeluar >= tanggalMasuk parent
		const tanggalKeluar = new Date(body.tanggalKeluar);
		tanggalKeluar.setHours(0, 0, 0, 0);
		const tanggalMasuk = new Date(parentRecord.tanggalMasuk);
		tanggalMasuk.setHours(0, 0, 0, 0);

		if (tanggalKeluar < tanggalMasuk) {
			return res.status(400).json({ message: 'Tanggal keluar tidak boleh sebelum tanggal masuk' });
		}

		// Validasi tanggalKeluar <= today
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		if (tanggalKeluar > today) {
			return res.status(400).json({ message: 'Tanggal keluar tidak boleh melebihi hari ini' });
		}

		// Calculate sisaLimbah
		const jumlahMasuk = parseFloat(parentRecord.jumlahMasuk);
		const totalKeluar = parentRecord.outRecords.reduce((sum, out) => sum + parseFloat(out.jumlahKeluar), 0);
		const sisaLimbah = parseFloat((jumlahMasuk - totalKeluar).toFixed(2));

		// Validasi jumlahKeluar <= sisaLimbah
		if (body.jumlahKeluar > sisaLimbah) {
			return res.status(400).json({ message: 'Jumlah limbah keluar tidak boleh melebihi sisa limbah di TPS' });
		}

		const outRecord = await prisma.b3WasteOutRecord.create({
			data: {
				siteId,
				wasteRecordId,
				tanggalKeluar: toDateOnly(body.tanggalKeluar),
				jumlahKeluar: body.jumlahKeluar,
				tujuanPenyerahan: body.tujuanPenyerahan,
				nomorDokumen: body.nomorDokumen,
				vendorId: body.vendorId || null,
				petugasPenanggungJawab: body.petugasPenanggungJawab,
			},
			include: { vendor: { select: { id: true, vendorName: true } } },
		});

		res.status(201).json(outRecord);
	}),
);

// PUT /out-records/:id — edit limbah keluar (petugasPenanggungJawab immutable)
router.put(
	'/out-records/:id',
	withAsync(async (req, res) => {
		const siteId = getSiteId(req);
		const id = parseInt(req.params.id);

		if (isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid' });
		}

		// Find existing out-record
		const existing = await prisma.b3WasteOutRecord.findFirst({
			where: { id, siteId },
		});

		if (!existing) {
			return res.status(404).json({ message: 'Data tidak ditemukan' });
		}

		// Find parent waste record
		const parentRecord = await prisma.b3WasteRecord.findFirst({
			where: { id: existing.wasteRecordId, siteId },
			include: { outRecords: { select: { id: true, jumlahKeluar: true } } },
		});

		let body;
		try {
			body = await updateOutRecordSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
		} catch (err) {
			return res.status(400).json({ message: err.errors?.[0] || 'Data tidak valid' });
		}

		// Validasi precision jumlahKeluar (max 2 decimal places)
		const jumlahStr = body.jumlahKeluar.toString();
		const decimalPart = jumlahStr.split('.')[1];
		if (decimalPart && decimalPart.length > 2) {
			return res.status(400).json({ message: 'Jumlah keluar maksimal 2 angka di belakang koma' });
		}

		// Validasi tanggalKeluar >= tanggalMasuk parent
		const tanggalKeluar = new Date(body.tanggalKeluar);
		tanggalKeluar.setHours(0, 0, 0, 0);
		const tanggalMasuk = new Date(parentRecord.tanggalMasuk);
		tanggalMasuk.setHours(0, 0, 0, 0);

		if (tanggalKeluar < tanggalMasuk) {
			return res.status(400).json({ message: 'Tanggal keluar tidak boleh sebelum tanggal masuk' });
		}

		// Validasi tanggalKeluar <= today
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		if (tanggalKeluar > today) {
			return res.status(400).json({ message: 'Tanggal keluar tidak boleh melebihi hari ini' });
		}

		// Calculate sisaLimbah excluding current out-record
		const jumlahMasuk = parseFloat(parentRecord.jumlahMasuk);
		const totalKeluarExcludingCurrent = parentRecord.outRecords
			.filter((out) => out.id !== id)
			.reduce((sum, out) => sum + parseFloat(out.jumlahKeluar), 0);
		const sisaLimbah = parseFloat((jumlahMasuk - totalKeluarExcludingCurrent).toFixed(2));

		// Validasi jumlahKeluar <= sisaLimbah
		if (body.jumlahKeluar > sisaLimbah) {
			return res.status(400).json({ message: 'Jumlah limbah keluar tidak boleh melebihi sisa limbah di TPS' });
		}

		const updated = await prisma.b3WasteOutRecord.update({
			where: { id },
			data: {
				tanggalKeluar: toDateOnly(body.tanggalKeluar),
				jumlahKeluar: body.jumlahKeluar,
				tujuanPenyerahan: body.tujuanPenyerahan,
				nomorDokumen: body.nomorDokumen,
				vendorId: body.vendorId || null,
				// petugasPenanggungJawab di-strip (immutable)
			},
			include: { vendor: { select: { id: true, vendorName: true } } },
		});

		res.json(updated);
	}),
);

// DELETE /out-records/:id — hapus limbah keluar
router.delete(
	'/out-records/:id',
	withAsync(async (req, res) => {
		const siteId = getSiteId(req);
		const id = parseInt(req.params.id);

		if (isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid' });
		}

		const existing = await prisma.b3WasteOutRecord.findFirst({
			where: { id, siteId },
		});

		if (!existing) {
			return res.status(404).json({ message: 'Data tidak ditemukan' });
		}

		await prisma.b3WasteOutRecord.delete({ where: { id } });

		res.status(204).send();
	}),
);

// GET /export — ekspor data pencatatan ke Excel
router.get(
	'/export',
	withAsync(async (req, res) => {
		const siteId = getSiteId(req);

		const records = await prisma.b3WasteRecord.findMany({
			where: { siteId },
			orderBy: { tanggalMasuk: 'desc' },
			include: {
				jenisLimbah: { select: { id: true, kode: true, nama: true } },
				outRecords: {
					select: {
						id: true,
						tanggalKeluar: true,
						jumlahKeluar: true,
						tujuanPenyerahan: true,
						nomorDokumen: true,
						petugasPenanggungJawab: true,
						vendor: { select: { id: true, vendorName: true } },
					},
				},
			},
		});

		if (records.length === 0) {
			return res.status(400).json({ message: 'Tidak ada data untuk diekspor' });
		}

		const recordsWithComputed = records.map((record) => {
			const { sisaLimbah, sisaHari, statusPenyimpanan } = computeFields(record);
			return { ...record, sisaLimbah, sisaHari, statusPenyimpanan };
		});

		const workbook = await generateB3WasteExcel(recordsWithComputed);

		const today = new Date();
		const dateStr = today.toISOString().split('T')[0];
		const filename = `Pencatatan_Limbah_B3_${dateStr}.xlsx`;

		res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
		res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

		await workbook.xlsx.write(res);
		res.end();
	}),
);

export default router;
