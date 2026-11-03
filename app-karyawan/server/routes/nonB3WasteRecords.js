import { Router } from 'express';
import * as yup from 'yup';

import prisma from '../lib/prisma.js';
import { generateNonB3WasteExcel } from '../lib/nonB3WasteExport.js';
import requireSiteIsolation from '../middleware/requireSiteIsolation.js';
import { parsePage, parsePageSize } from '../lib/pagination.js';

const router = Router();

router.use(requireSiteIsolation({ modelType: 'per-site' }));

const BULAN_INDONESIA = [
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

function toDateOnly(value) {
	if (!value) return null;

	if (typeof value === 'string') {
		const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
		if (match) {
			return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0));
		}
	}

	if (value instanceof Date) {
		return new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate(), 12, 0, 0));
	}

	const parsed = new Date(value);
	return new Date(Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 12, 0, 0));
}

function kgToTon(value) {
	return Number((Number(value || 0) / 1000).toFixed(4));
}

const baseSchema = {
	jenisLimbahId: yup.number().required('Jenis limbah wajib dipilih'),
	tanggalMasuk: yup
		.date()
		.required('Tanggal masuk wajib diisi')
		.min(new Date('2020-01-01'), 'Tanggal masuk minimal 1 Januari 2020')
		.max(new Date(), 'Tanggal masuk tidak boleh melebihi hari ini'),
	tanggalKeluar: yup
		.date()
		.required('Tanggal keluar wajib diisi')
		.min(yup.ref('tanggalMasuk'), 'Tanggal keluar tidak boleh sebelum tanggal masuk')
		.max(new Date(), 'Tanggal keluar tidak boleh melebihi hari ini'),
	jumlahKg: yup
		.number()
		.required('Jumlah limbah wajib diisi')
		.min(0.01, 'Jumlah limbah minimal 0.01')
		.max(999999.99, 'Jumlah limbah maksimal 999999.99'),
	nomorSuratJalan: yup
		.string()
		.trim()
		.required('Nomor surat jalan wajib diisi')
		.max(100, 'Nomor surat jalan maksimal 100 karakter'),
	nomorDokumen: yup.string().trim().max(100, 'Nomor dokumen maksimal 100 karakter').nullable().notRequired(),
	nopolKendaraan: yup.string().trim().max(20, 'Nopol kendaraan maksimal 20 karakter').nullable().notRequired(),
	vendorId: yup.number().nullable().notRequired(),
	petugasPenanggungJawab: yup
		.string()
		.trim()
		.max(100, 'Petugas penanggung jawab maksimal 100 karakter')
		.nullable()
		.notRequired(),
};

const createSchema = yup.object().shape(baseSchema);
const updateSchema = yup.object().shape(baseSchema);

async function assertWasteTypeInSite(jenisLimbahId, siteId) {
	const type = await prisma.nonB3WasteType.findFirst({
		where: { id: Number(jenisLimbahId), siteId },
		select: { id: true },
	});

	if (!type) {
		throw Object.assign(new Error('Jenis limbah tidak ditemukan untuk site ini'), { statusCode: 400 });
	}

	return type.id;
}

async function assertVendorInSite(vendorId, siteId) {
	if (vendorId === undefined || vendorId === null || vendorId === '') {
		return null;
	}

	const vendor = await prisma.masterVendor.findFirst({
		where: { id: Number(vendorId), siteId },
		select: { id: true },
	});

	if (!vendor) {
		throw Object.assign(new Error('Vendor tidak ditemukan untuk site ini'), { statusCode: 400 });
	}

	return vendor.id;
}

function validatePrecision(value, label) {
	const decimalPart = value.toString().split('.')[1];
	if (decimalPart && decimalPart.length > 2) {
		return `${label} maksimal 2 angka di belakang koma`;
	}
	return null;
}

const includeRelations = {
	jenisLimbah: { select: { id: true, kode: true, nama: true } },
	vendor: { select: { id: true, vendorName: true } },
};

router.get(
	'/',
	withAsync(async (req, res) => {
		const siteId = getSiteId(req);
		const page = parsePage(req.query.page);
		const pageSize = parsePageSize(req.query.pageSize);
		const sortField = req.query.sortField === 'tanggalKeluar' ? 'tanggalKeluar' : 'tanggalMasuk';
		const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';

		const [data, total] = await Promise.all([
			prisma.nonB3WasteRecord.findMany({
				where: { siteId },
				skip: page * pageSize,
				take: pageSize,
				orderBy: [{ [sortField]: sortOrder }, { id: sortOrder }],
				include: includeRelations,
			}),
			prisma.nonB3WasteRecord.count({ where: { siteId } }),
		]);

		res.json({ data, total, page, pageSize });
	}),
);

router.post(
	'/',
	withAsync(async (req, res) => {
		const siteId = getSiteId(req);

		if (!siteId) {
			return res.status(403).json({ message: 'Akses ditolak. Site belum dipilih.' });
		}

		let body;
		try {
			body = await createSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
		} catch (err) {
			return res.status(400).json({ message: err.errors?.[0] || 'Data tidak valid' });
		}

		const precisionError = validatePrecision(body.jumlahKg, 'Jumlah limbah');
		if (precisionError) {
			return res.status(400).json({ message: precisionError });
		}

		try {
			const jenisLimbahId = await assertWasteTypeInSite(body.jenisLimbahId, siteId);
			const vendorId = await assertVendorInSite(body.vendorId, siteId);

			const record = await prisma.nonB3WasteRecord.create({
				data: {
					siteId,
					jenisLimbahId,
					tanggalMasuk: toDateOnly(body.tanggalMasuk),
					tanggalKeluar: toDateOnly(body.tanggalKeluar),
					jumlahKg: body.jumlahKg,
					nomorSuratJalan: body.nomorSuratJalan,
					nomorDokumen: body.nomorDokumen || null,
					nopolKendaraan: body.nopolKendaraan || null,
					vendorId,
					petugasPenanggungJawab: body.petugasPenanggungJawab || null,
				},
				include: includeRelations,
			});

			return res.status(201).json(record);
		} catch (err) {
			if (err.statusCode === 400) {
				return res.status(400).json({ message: err.message });
			}
			throw err;
		}
	}),
);

router.put(
	'/:id',
	withAsync(async (req, res) => {
		const siteId = getSiteId(req);
		const id = parseInt(req.params.id);

		if (isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid' });
		}

		const existing = await prisma.nonB3WasteRecord.findFirst({ where: { id, siteId } });

		if (!existing) {
			return res.status(404).json({ message: 'Data tidak ditemukan' });
		}

		let body;
		try {
			body = await updateSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
		} catch (err) {
			return res.status(400).json({ message: err.errors?.[0] || 'Data tidak valid' });
		}

		const precisionError = validatePrecision(body.jumlahKg, 'Jumlah limbah');
		if (precisionError) {
			return res.status(400).json({ message: precisionError });
		}

		try {
			const jenisLimbahId = await assertWasteTypeInSite(body.jenisLimbahId, siteId);
			const vendorId = await assertVendorInSite(body.vendorId, siteId);

			const updated = await prisma.nonB3WasteRecord.update({
				where: { id },
				data: {
					jenisLimbahId,
					tanggalMasuk: toDateOnly(body.tanggalMasuk),
					tanggalKeluar: toDateOnly(body.tanggalKeluar),
					jumlahKg: body.jumlahKg,
					nomorSuratJalan: body.nomorSuratJalan,
					nomorDokumen: body.nomorDokumen || null,
					nopolKendaraan: body.nopolKendaraan || null,
					vendorId,
					petugasPenanggungJawab: body.petugasPenanggungJawab || null,
				},
				include: includeRelations,
			});

			return res.json(updated);
		} catch (err) {
			if (err.statusCode === 400) {
				return res.status(400).json({ message: err.message });
			}
			throw err;
		}
	}),
);

router.delete(
	'/:id',
	withAsync(async (req, res) => {
		const siteId = getSiteId(req);
		const id = parseInt(req.params.id);

		if (isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid' });
		}

		const existing = await prisma.nonB3WasteRecord.findFirst({ where: { id, siteId } });

		if (!existing) {
			return res.status(404).json({ message: 'Data tidak ditemukan' });
		}

		await prisma.nonB3WasteRecord.delete({ where: { id } });

		return res.status(204).send();
	}),
);

// GET /export/years — daftar tahun (dari tanggalMasuk) yang memiliki data
router.get(
	'/export/years',
	withAsync(async (req, res) => {
		const siteId = getSiteId(req);

		if (!siteId) {
			return res.status(403).json({ message: 'Akses ditolak. Site belum dipilih.' });
		}

		const records = await prisma.nonB3WasteRecord.findMany({
			where: { siteId },
			select: { tanggalMasuk: true },
		});

		const years = Array.from(new Set(records.map((record) => new Date(record.tanggalMasuk).getUTCFullYear())))
			.filter((year) => !Number.isNaN(year))
			.sort((left, right) => right - left);

		return res.json({ years });
	}),
);

// GET /export — ekspor data pencatatan limbah non-B3 ke Excel
router.get(
	'/export',
	withAsync(async (req, res) => {
		const siteId = getSiteId(req);

		if (!siteId) {
			return res.status(403).json({ message: 'Akses ditolak. Site belum dipilih.' });
		}

		const tahunParam = req.query.tahun;
		let tahun = null;

		if (tahunParam !== undefined && tahunParam !== '') {
			tahun = parseInt(tahunParam, 10);
			if (Number.isNaN(tahun)) {
				return res.status(400).json({ message: 'Parameter tahun tidak valid' });
			}
		}

		const where = { siteId };
		if (tahun) {
			where.tanggalMasuk = {
				gte: new Date(Date.UTC(tahun, 0, 1, 0, 0, 0)),
				lte: new Date(Date.UTC(tahun, 11, 31, 23, 59, 59)),
			};
		}

		const records = await prisma.nonB3WasteRecord.findMany({
			where,
			orderBy: [{ tanggalMasuk: 'desc' }, { id: 'desc' }],
			include: includeRelations,
		});

		const workbook = await generateNonB3WasteExcel(records);

		const dateStr = new Date().toISOString().split('T')[0];
		const filename = tahun
			? `Pencatatan_Limbah_Non_B3_${tahun}.xlsx`
			: `Pencatatan_Limbah_Non_B3_${dateStr}.xlsx`;

		res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
		res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

		await workbook.xlsx.write(res);
		res.end();
	}),
);

function resolvePeriodeBulan(tahun, bulan) {
	const bulanIndex = bulan - 1;
	const periodeStart = new Date(Date.UTC(tahun, bulanIndex, 1, 0, 0, 0));
	const periodeEnd = new Date(Date.UTC(tahun, bulanIndex + 1, 0, 23, 59, 59));
	const periodeLabel = `${BULAN_INDONESIA[bulanIndex]} ${tahun}`;

	return { periodeStart, periodeEnd, periodeLabel };
}

// GET /neraca — rekap masuk & keluar Non-B3 per bulan
router.get(
	'/neraca',
	withAsync(async (req, res) => {
		const siteId = getSiteId(req);
		const tahun = parseInt(req.query.tahun, 10);
		const bulan = parseInt(req.query.bulan, 10);

		if (!siteId) {
			return res.status(403).json({ message: 'Akses ditolak. Site belum dipilih.' });
		}
		if (!tahun || Number.isNaN(tahun)) {
			return res.status(400).json({ message: 'Parameter tahun wajib diisi' });
		}
		if (!bulan || Number.isNaN(bulan) || bulan < 1 || bulan > 12) {
			return res.status(400).json({ message: 'Parameter bulan wajib diisi (1-12)' });
		}

		const { periodeStart, periodeEnd, periodeLabel } = resolvePeriodeBulan(tahun, bulan);

		const [wasteTypes, records] = await Promise.all([
			prisma.nonB3WasteType.findMany({ where: { siteId }, orderBy: { kode: 'asc' } }),
			prisma.nonB3WasteRecord.findMany({
				where: { siteId },
				select: {
					jenisLimbahId: true,
					tanggalMasuk: true,
					tanggalKeluar: true,
					jumlahKg: true,
				},
			}),
		]);

		const perType = new Map(
			wasteTypes.map((type) => [type.id, { kode: type.kode, nama: type.nama, masukKg: 0, keluarKg: 0 }]),
		);

		records.forEach((record) => {
			const bucket = perType.get(record.jenisLimbahId);
			if (!bucket) return;

			const masuk = record.tanggalMasuk;
			const keluar = record.tanggalKeluar;

			if (masuk >= periodeStart && masuk <= periodeEnd) {
				bucket.masukKg += Number(record.jumlahKg);
			}
			if (keluar >= periodeStart && keluar <= periodeEnd) {
				bucket.keluarKg += Number(record.jumlahKg);
			}
		});

		const rows = Array.from(perType.values())
			.map((row) => ({
				...row,
				masukKg: Number(row.masukKg.toFixed(2)),
				keluarKg: Number(row.keluarKg.toFixed(2)),
				masukTon: kgToTon(row.masukKg),
				keluarTon: kgToTon(row.keluarKg),
			}))
			.filter((row) => row.masukKg !== 0 || row.keluarKg !== 0);

		const totalMasukKg = Number(rows.reduce((sum, row) => sum + row.masukKg, 0).toFixed(2));
		const totalKeluarKg = Number(rows.reduce((sum, row) => sum + row.keluarKg, 0).toFixed(2));

		return res.json({
			tahun,
			bulan,
			periodeLabel,
			rows,
			totalMasukKg,
			totalKeluarKg,
			totalMasukTon: kgToTon(totalMasukKg),
			totalKeluarTon: kgToTon(totalKeluarKg),
			saldoTon: Number((kgToTon(totalMasukKg) - kgToTon(totalKeluarKg)).toFixed(4)),
		});
	}),
);

// GET /pencatatan-print — data siap cetak Catatan Pengelolaan Limbah Non-B3
router.get(
	'/pencatatan-print',
	withAsync(async (req, res) => {
		const siteId = getSiteId(req);

		if (!siteId) {
			return res.status(403).json({ message: 'Akses ditolak. Site belum dipilih.' });
		}

		const parseDateParam = (value) => {
			if (!value) return null;
			const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
			if (!match) return null;
			return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 0, 0, 0));
		};

		const from = parseDateParam(req.query.from);
		const to = parseDateParam(req.query.to);

		if (req.query.from && !from) {
			return res.status(400).json({ message: 'Parameter from tidak valid' });
		}
		if (req.query.to && !to) {
			return res.status(400).json({ message: 'Parameter to tidak valid' });
		}
		if (from && to && from > to) {
			return res.status(400).json({ message: 'Rentang periode tidak valid' });
		}

		const tanggalMasukFilter = {};
		if (from) tanggalMasukFilter.gte = from;
		if (to) tanggalMasukFilter.lte = new Date(to.getTime() + 24 * 60 * 60 * 1000 - 1);

		const [site, profile, wasteTypes, records] = await Promise.all([
			prisma.masterSite.findUnique({ where: { id: siteId }, select: { name: true } }),
			prisma.siteProfile.findUnique({ where: { siteId } }),
			prisma.nonB3WasteType.findMany({ where: { siteId }, orderBy: { kode: 'asc' } }),
			prisma.nonB3WasteRecord.findMany({
				where: { siteId, ...(from || to ? { tanggalMasuk: tanggalMasukFilter } : {}) },
				orderBy: [{ tanggalMasuk: 'asc' }, { id: 'asc' }],
				include: {
					jenisLimbah: { select: { kode: true, nama: true } },
					vendor: { select: { vendorName: true } },
				},
			}),
		]);

		const rows = records.map((record) => ({
			tanggalMasuk: record.tanggalMasuk,
			tanggalKeluar: record.tanggalKeluar,
			jenisLimbahKode: record.jenisLimbah?.kode || '',
			jenisLimbahNama: record.jenisLimbah?.nama || '',
			jumlahTon: kgToTon(record.jumlahKg),
			pengelola: record.vendor?.vendorName || '',
			nopolKendaraan: record.nopolKendaraan || '',
			nomorDokumen: record.nomorDokumen || '',
			nomorSuratJalan: record.nomorSuratJalan || '',
			petugasPenanggungJawab: record.petugasPenanggungJawab || '',
		}));

		return res.json({
			profil: {
				companyName: profile?.companyName || '',
				address: profile?.address || '',
				responsibleName: profile?.responsibleName || '',
			},
			lokasiKerja: site?.name || '',
			periode: {
				from: from ? from.toISOString().slice(0, 10) : null,
				to: to ? to.toISOString().slice(0, 10) : null,
			},
			rows,
			keterangan: wasteTypes.map((type) => ({ kode: type.kode, nama: type.nama })),
			generatedAt: new Date().toISOString(),
		});
	}),
);

export default router;
