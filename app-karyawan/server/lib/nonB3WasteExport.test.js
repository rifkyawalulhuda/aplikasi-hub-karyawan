import { describe, expect, it } from 'vitest';

import { generateNonB3WasteExcel } from './nonB3WasteExport.js';

describe('generateNonB3WasteExcel', () => {
	it('should write title, headers and data rows', async () => {
		const workbook = await generateNonB3WasteExcel([
			{
				jenisLimbah: { kode: 'N01', nama: 'Plastik bekas' },
				tanggalMasuk: new Date('2026-07-02'),
				tanggalKeluar: new Date('2026-07-05'),
				jumlahKg: 1250.5,
				vendor: { vendorName: 'PT Pengelola' },
				nopolKendaraan: 'B 9001 XYZ',
				nomorDokumen: 'DOK/001',
				nomorSuratJalan: 'SJ/001',
				petugasPenanggungJawab: 'Budi',
			},
		]);

		const worksheet = workbook.getWorksheet('Pencatatan Limbah Non-B3');
		expect(worksheet).toBeDefined();
		expect(worksheet.getCell('A1').value).toBe('CATATAN PENGELOLAAN LIMBAH NON-B3');

		const headerRow = worksheet.getRow(2);
		expect(headerRow.getCell(1).value).toBe('No');
		expect(headerRow.getCell(2).value).toBe('Jenis Limbah Non-B3');
		expect(headerRow.getCell(5).value).toBe('Jumlah (kg)');
		expect(headerRow.getCell(10).value).toBe('Petugas Penanggung Jawab');

		const dataRow = worksheet.getRow(3);
		expect(dataRow.getCell(1).value).toBe(1);
		expect(dataRow.getCell(2).value).toBe('N01 — Plastik bekas');
		expect(dataRow.getCell(3).value).toBe('02/07/2026');
		expect(dataRow.getCell(4).value).toBe('05/07/2026');
		expect(dataRow.getCell(5).value).toBe('1.250,50');
		expect(dataRow.getCell(6).value).toBe('PT Pengelola');
		expect(dataRow.getCell(7).value).toBe('B 9001 XYZ');
		expect(dataRow.getCell(8).value).toBe('DOK/001');
		expect(dataRow.getCell(9).value).toBe('SJ/001');
		expect(dataRow.getCell(10).value).toBe('Budi');
	});

	it('should write TOTAL row with summed jumlah', async () => {
		const workbook = await generateNonB3WasteExcel([
			{ jenisLimbah: { kode: 'N01', nama: 'A' }, jumlahKg: 100, tanggalMasuk: new Date('2026-07-01') },
			{ jenisLimbah: { kode: 'N02', nama: 'B' }, jumlahKg: 50.25, tanggalMasuk: new Date('2026-07-02') },
		]);

		const worksheet = workbook.getWorksheet('Pencatatan Limbah Non-B3');
		const totalRow = worksheet.getRow(5);

		expect(totalRow.getCell(1).value).toBe('TOTAL');
		expect(totalRow.getCell(5).value).toBe('150,25');
	});

	it('should leave optional columns empty when data is missing', async () => {
		const workbook = await generateNonB3WasteExcel([
			{ jenisLimbah: { kode: 'N01', nama: 'A' }, jumlahKg: 10, tanggalMasuk: new Date('2026-07-01') },
		]);

		const worksheet = workbook.getWorksheet('Pencatatan Limbah Non-B3');
		const dataRow = worksheet.getRow(3);

		expect(dataRow.getCell(4).value).toBe('');
		expect(dataRow.getCell(6).value).toBe('');
		expect(dataRow.getCell(7).value).toBe('');
		expect(dataRow.getCell(8).value).toBe('');
		expect(dataRow.getCell(9).value).toBe('');
		expect(dataRow.getCell(10).value).toBe('');
	});
});
