import { describe, it, expect, vi, beforeEach } from 'vitest';

import prisma from '../../lib/prisma.js';

// Mock prisma
vi.mock('../../lib/prisma.js', () => ({
	default: {
		b3WasteType: {
			create: vi.fn(),
			findFirst: vi.fn(),
			findMany: vi.fn(),
			count: vi.fn(),
			delete: vi.fn(),
		},
		b3WasteRecord: {
			create: vi.fn(),
			findFirst: vi.fn(),
			findMany: vi.fn(),
			count: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		},
		b3WasteOutRecord: {
			create: vi.fn(),
			findFirst: vi.fn(),
			count: vi.fn(),
			delete: vi.fn(),
		},
	},
}));

// Mock exceljs with proper constructor
vi.mock('exceljs', () => {
	class MockWorkbook {
		constructor() {
			this.worksheets = [];
			this.xlsx = { write: vi.fn().mockResolvedValue(undefined) };
		}

		addWorksheet(name) {
			const cells = {};
			const rows = {};
			const worksheet = {
				name,
				mergeCells: vi.fn(),
				getCell: vi.fn((addr) => {
					if (!cells[addr]) cells[addr] = { value: null, font: {}, alignment: {}, border: {} };
					return cells[addr];
				}),
				getRow: vi.fn((rowNum) => {
					if (!rows[rowNum]) {
						const rowCells = {};
						rows[rowNum] = {
							getCell: vi.fn((col) => {
								if (!rowCells[col])
									rowCells[col] = { value: null, font: {}, alignment: {}, border: {} };
								return rowCells[col];
							}),
						};
					}
					return rows[rowNum];
				}),
				columns: [],
				_cells: cells,
				_rows: rows,
			};
			this.worksheets.push(worksheet);
			this._worksheet = worksheet;
			return worksheet;
		}
	}
	return { default: { Workbook: MockWorkbook } };
});

/**
 * Helper: create mock Express req/res objects
 */
function createMockReqRes(overrides = {}) {
	const req = {
		siteId: 1,
		query: {},
		params: {},
		body: {},
		...overrides,
	};
	const res = {
		status: vi.fn().mockReturnThis(),
		json: vi.fn().mockReturnThis(),
		send: vi.fn().mockReturnThis(),
		setHeader: vi.fn(),
		end: vi.fn(),
		headersSent: false,
	};
	const next = vi.fn();
	return { req, res, next };
}

/**
 * Helper: invoke a route handler through the Express router stack.
 * withAsync in the source code doesn't return the promise, so we need
 * to wait for microtasks to flush after calling the handler.
 */
async function invokeRoute(router, method, path, req, res) {
	let nextError = null;
	const next = vi.fn((err) => {
		if (err) nextError = err;
	});

	// Find matching layer in router stack
	for (const layer of router.stack) {
		if (!layer.route) continue;
		const routeMethod = Object.keys(layer.route.methods)[0];
		if (routeMethod !== method) continue;

		// Check if path matches the route pattern
		const routePath = layer.route.path;
		const paramNames = [];
		const regexStr = routePath.replace(/:(\w+)/g, (_, name) => {
			paramNames.push(name);
			return '([^/]+)';
		});
		const regex = new RegExp(`^${regexStr}$`);
		const match = path.match(regex);

		if (match) {
			// Extract params
			paramNames.forEach((name, i) => {
				req.params[name] = match[i + 1];
			});

			// Execute all handlers in the route stack
			for (const routeLayer of layer.route.stack) {
				const result = routeLayer.handle(req, res, next);
				// withAsync returns undefined but starts a promise chain internally
				// We need to flush microtasks to let the async handler complete
				if (result && typeof result.then === 'function') {
					await result;
				} else {
					// Flush all pending microtasks (for withAsync pattern)
					await new Promise((resolve) => setImmediate(resolve));
				}
				if (nextError) throw nextError;
			}
			return;
		}
	}

	throw new Error(`No route matched: ${method.toUpperCase()} ${path}`);
}

describe('B3 Waste Records Integration Tests', () => {
	let recordsRouter;
	let typesRouter;

	beforeEach(async () => {
		vi.clearAllMocks();
		const recordsModule = await import('../b3WasteRecords.js');
		const typesModule = await import('../b3WasteTypes.js');
		recordsRouter = recordsModule.default;
		typesRouter = typesModule.default;
	});

	describe('Full CRUD Lifecycle', () => {
		it('should complete full lifecycle: create type → create record → add out record → verify sisaLimbah → delete out → delete record', async () => {
			// Step 1: Create waste type → success (201)
			const mockType = {
				id: 1,
				siteId: 1,
				kode: 'A338-1',
				nama: 'Bahan kimia kedaluwarsa',
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			prisma.b3WasteType.create.mockResolvedValue(mockType);

			const { req: typeReq, res: typeRes } = createMockReqRes({
				body: { kode: 'A338-1', nama: 'Bahan kimia kedaluwarsa' },
			});
			await invokeRoute(typesRouter, 'post', '/', typeReq, typeRes);
			expect(typeRes.status).toHaveBeenCalledWith(201);
			expect(typeRes.json).toHaveBeenCalledWith(mockType);

			// Step 2: Create waste record → success (201)
			const mockRecord = {
				id: 1,
				siteId: 1,
				jenisLimbahId: 1,
				tanggalMasuk: new Date('2024-06-01'),
				sumberLimbah: 'Warehouse A',
				jumlahMasuk: 100.0,
				maksimalPenyimpanan: 90,
				tanggalBatas: new Date('2024-08-30'),
				petugasPenanggungJawab: 'Ahmad Fauzi',
				jenisLimbah: { id: 1, kode: 'A338-1', nama: 'Bahan kimia kedaluwarsa' },
				outRecords: [],
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			prisma.b3WasteRecord.create.mockResolvedValue(mockRecord);

			const { req: recordReq, res: recordRes } = createMockReqRes({
				body: {
					jenisLimbahId: 1,
					tanggalMasuk: '2024-06-01',
					sumberLimbah: 'Warehouse A',
					jumlahMasuk: 100.0,
					maksimalPenyimpanan: 90,
					petugasPenanggungJawab: 'Ahmad Fauzi',
				},
			});
			await invokeRoute(recordsRouter, 'post', '/', recordReq, recordRes);
			expect(recordRes.status).toHaveBeenCalledWith(201);
			expect(recordRes.json).toHaveBeenCalledWith(mockRecord);

			// Step 3: GET records → verify sisaLimbah equals jumlahMasuk (no out records)
			prisma.b3WasteRecord.findMany.mockResolvedValue([mockRecord]);
			prisma.b3WasteRecord.count.mockResolvedValue(1);

			const { req: getReq, res: getRes } = createMockReqRes({
				query: { page: '0', pageSize: '25' },
			});
			await invokeRoute(recordsRouter, 'get', '/', getReq, getRes);
			const getResponse = getRes.json.mock.calls[0][0];
			expect(getResponse.data[0].sisaLimbah).toBe(100.0);

			// Step 4: Add out record → success (201)
			prisma.b3WasteRecord.findFirst.mockResolvedValue({
				...mockRecord,
				outRecords: [],
			});

			const mockOutRecord = {
				id: 1,
				siteId: 1,
				wasteRecordId: 1,
				tanggalKeluar: new Date('2024-06-15'),
				jumlahKeluar: 30.0,
				tujuanPenyerahan: 'Pengolahan',
				nomorDokumen: 'MNF/2024/001',
				petugasPenanggungJawab: 'Ahmad Fauzi',
			};
			prisma.b3WasteOutRecord.create.mockResolvedValue(mockOutRecord);

			const { req: outReq, res: outRes } = createMockReqRes({
				body: {
					tanggalKeluar: '2024-06-15',
					jumlahKeluar: 30.0,
					tujuanPenyerahan: 'Pengolahan',
					nomorDokumen: 'MNF/2024/001',
					petugasPenanggungJawab: 'Ahmad Fauzi',
				},
			});
			await invokeRoute(recordsRouter, 'post', '/1/out', outReq, outRes);
			expect(outRes.status).toHaveBeenCalledWith(201);
			expect(outRes.json).toHaveBeenCalledWith(mockOutRecord);

			// Step 5: GET records → verify sisaLimbah decreased
			const recordWithOut = {
				...mockRecord,
				outRecords: [{ jumlahKeluar: 30.0 }],
			};
			prisma.b3WasteRecord.findMany.mockResolvedValue([recordWithOut]);
			prisma.b3WasteRecord.count.mockResolvedValue(1);

			const { req: getReq2, res: getRes2 } = createMockReqRes({
				query: { page: '0', pageSize: '25' },
			});
			await invokeRoute(recordsRouter, 'get', '/', getReq2, getRes2);
			const getResponse2 = getRes2.json.mock.calls[0][0];
			expect(getResponse2.data[0].sisaLimbah).toBe(70.0);

			// Step 6: Delete out record → success (204)
			prisma.b3WasteOutRecord.findFirst.mockResolvedValue(mockOutRecord);
			prisma.b3WasteOutRecord.delete.mockResolvedValue(mockOutRecord);

			const { req: delOutReq, res: delOutRes } = createMockReqRes();
			await invokeRoute(recordsRouter, 'delete', '/out-records/1', delOutReq, delOutRes);
			expect(delOutRes.status).toHaveBeenCalledWith(204);

			// Step 7: Delete waste record → success (204)
			prisma.b3WasteRecord.findFirst.mockResolvedValue(mockRecord);
			prisma.b3WasteOutRecord.count.mockResolvedValue(0);
			prisma.b3WasteRecord.delete.mockResolvedValue(mockRecord);

			const { req: delReq, res: delRes } = createMockReqRes();
			await invokeRoute(recordsRouter, 'delete', '/1', delReq, delRes);
			expect(delRes.status).toHaveBeenCalledWith(204);
		});
	});

	describe('Cross-Site Access Returns 404', () => {
		it('should return empty data when querying records from a different site', async () => {
			prisma.b3WasteRecord.findMany.mockResolvedValue([]);
			prisma.b3WasteRecord.count.mockResolvedValue(0);

			const { req, res } = createMockReqRes({
				siteId: 2,
				query: { page: '0', pageSize: '25' },
			});
			await invokeRoute(recordsRouter, 'get', '/', req, res);
			const response = res.json.mock.calls[0][0];
			expect(response.data).toEqual([]);
			expect(response.total).toBe(0);
		});

		it('should return 404 when trying to PUT a record from a different site', async () => {
			prisma.b3WasteRecord.findFirst.mockResolvedValue(null);

			const { req, res } = createMockReqRes({
				siteId: 2,
				body: {
					jenisLimbahId: 1,
					tanggalMasuk: '2024-06-01',
					sumberLimbah: 'Updated',
					jumlahMasuk: 50.0,
					maksimalPenyimpanan: 90,
				},
			});
			await invokeRoute(recordsRouter, 'put', '/1', req, res);
			expect(res.status).toHaveBeenCalledWith(404);
			expect(res.json).toHaveBeenCalledWith({ message: 'Data tidak ditemukan' });
		});

		it('should return 404 when trying to DELETE a record from a different site', async () => {
			prisma.b3WasteRecord.findFirst.mockResolvedValue(null);

			const { req, res } = createMockReqRes({ siteId: 2 });
			await invokeRoute(recordsRouter, 'delete', '/1', req, res);
			expect(res.status).toHaveBeenCalledWith(404);
			expect(res.json).toHaveBeenCalledWith({ message: 'Data tidak ditemukan' });
		});

		it('should return 404 when trying to add out record to a record from a different site', async () => {
			prisma.b3WasteRecord.findFirst.mockResolvedValue(null);

			const { req, res } = createMockReqRes({
				siteId: 2,
				body: {
					tanggalKeluar: '2024-06-15',
					jumlahKeluar: 10.0,
					tujuanPenyerahan: 'Pengolahan',
					nomorDokumen: 'DOC/001',
					petugasPenanggungJawab: 'Test User',
				},
			});
			await invokeRoute(recordsRouter, 'post', '/1/out', req, res);
			expect(res.status).toHaveBeenCalledWith(404);
			expect(res.json).toHaveBeenCalledWith({ message: 'Data tidak ditemukan' });
		});
	});

	describe('Delete Blocked by Referential Integrity', () => {
		it('should return 409 when trying to delete waste record that has out records', async () => {
			prisma.b3WasteRecord.findFirst.mockResolvedValue({
				id: 1,
				siteId: 1,
				jenisLimbahId: 1,
				tanggalMasuk: new Date('2024-06-01'),
				jumlahMasuk: 100.0,
			});
			prisma.b3WasteOutRecord.count.mockResolvedValue(2);

			const { req, res } = createMockReqRes();
			await invokeRoute(recordsRouter, 'delete', '/1', req, res);
			expect(res.status).toHaveBeenCalledWith(409);
			expect(res.json).toHaveBeenCalledWith({
				message: 'Data tidak dapat dihapus karena masih memiliki catatan limbah keluar',
			});
		});

		it('should return 409 when trying to delete waste type that has records', async () => {
			prisma.b3WasteType.findFirst.mockResolvedValue({
				id: 1,
				siteId: 1,
				kode: 'A338-1',
				nama: 'Bahan kimia kedaluwarsa',
			});
			prisma.b3WasteRecord.count.mockResolvedValue(3);

			const { req, res } = createMockReqRes();
			await invokeRoute(typesRouter, 'delete', '/1', req, res);
			expect(res.status).toHaveBeenCalledWith(409);
			expect(res.json).toHaveBeenCalledWith({
				message: 'Data tidak dapat dihapus karena masih digunakan',
			});
		});
	});

	describe('Export Generates Workbook', () => {
		it('should generate Excel workbook with correct worksheet name and structure', async () => {
			const { generateB3WasteExcel } = await import('../../lib/b3WasteExport.js');

			const mockRecords = [
				{
					id: 1,
					jenisLimbah: { id: 1, kode: 'A338-1', nama: 'Bahan kimia kedaluwarsa' },
					tanggalMasuk: new Date('2024-06-01'),
					sumberLimbah: 'Warehouse A',
					jumlahMasuk: 1250.5,
					maksimalPenyimpanan: 90,
					tanggalBatas: new Date('2024-08-30'),
					sisaLimbah: 1000.5,
					sisaHari: 45,
					outRecords: [
						{
							id: 1,
							tanggalKeluar: new Date('2024-06-15'),
							jumlahKeluar: 250.0,
							tujuanPenyerahan: 'Pengolahan Limbah',
							nomorDokumen: 'MNF/2024/001',
							petugasPenanggungJawab: 'Ahmad Fauzi',
						},
					],
				},
				{
					id: 2,
					jenisLimbah: { id: 2, kode: 'B106-1', nama: 'Oli bekas' },
					tanggalMasuk: new Date('2024-07-01'),
					sumberLimbah: 'Workshop',
					jumlahMasuk: 500.0,
					maksimalPenyimpanan: 180,
					tanggalBatas: new Date('2024-12-28'),
					sisaLimbah: 500.0,
					sisaHari: 120,
					outRecords: [],
				},
			];

			const workbook = await generateB3WasteExcel(mockRecords);

			// Verify workbook was created with correct worksheet
			expect(workbook).toBeDefined();
			expect(workbook.worksheets).toHaveLength(1);
			expect(workbook.worksheets[0].name).toBe('Pencatatan Limbah B3');
		});

		it('should call export endpoint and set correct response headers', async () => {
			const mockRecords = [
				{
					id: 1,
					siteId: 1,
					jenisLimbahId: 1,
					tanggalMasuk: new Date('2024-06-01'),
					sumberLimbah: 'Warehouse A',
					jumlahMasuk: 100.0,
					maksimalPenyimpanan: 90,
					tanggalBatas: new Date('2024-08-30'),
					jenisLimbah: { id: 1, kode: 'A338-1', nama: 'Bahan kimia' },
					outRecords: [{ jumlahKeluar: 20.0 }],
				},
			];
			prisma.b3WasteRecord.findMany.mockResolvedValue(mockRecords);

			const { req, res } = createMockReqRes();
			await invokeRoute(recordsRouter, 'get', '/export', req, res);

			expect(res.setHeader).toHaveBeenCalledWith(
				'Content-Type',
				'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			);
			expect(res.setHeader).toHaveBeenCalledWith(
				'Content-Disposition',
				expect.stringContaining('attachment; filename="Pencatatan_Limbah_B3_'),
			);
			expect(res.end).toHaveBeenCalled();
		});

		it('should return 400 when no data to export', async () => {
			prisma.b3WasteRecord.findMany.mockResolvedValue([]);

			const { req, res } = createMockReqRes();
			await invokeRoute(recordsRouter, 'get', '/export', req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({ message: 'Tidak ada data untuk diekspor' });
		});
	});
});
