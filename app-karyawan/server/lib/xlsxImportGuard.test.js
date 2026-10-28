import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';

import {
	assertWorksheetWithinLimits,
	assertXlsxArchiveWithinLimits,
	MAX_IMPORT_ROWS,
	MAX_UNCOMPRESSED_BYTES,
} from './xlsxImportGuard.js';

async function buildWorkbookBuffer(rows) {
	const workbook = new ExcelJS.Workbook();
	const worksheet = workbook.addWorksheet('Data Import');

	worksheet.addRow(['Header']);
	rows.forEach((row) => worksheet.addRow(row));

	return Buffer.from(await workbook.xlsx.writeBuffer());
}

function buildCentralDirectoryBuffer(uncompressedSize, entryCount = 1) {
	const entries = Buffer.alloc(46 * entryCount);
	let cursor = 0;

	for (let index = 0; index < entryCount; index += 1) {
		entries.writeUInt32LE(0x02014b50, cursor);
		entries.writeUInt32LE(uncompressedSize, cursor + 24);
		cursor += 46;
	}

	const end = Buffer.alloc(22);
	end.writeUInt32LE(0x06054b50, 0);
	end.writeUInt16LE(entryCount, 10);
	end.writeUInt32LE(entries.length, 12);
	end.writeUInt32LE(0, 16);

	return Buffer.concat([entries, end]);
}

describe('xlsx import guard', () => {
	it('accepts a normal workbook', async () => {
		const buffer = await buildWorkbookBuffer([['A'], ['B']]);

		expect(() => assertXlsxArchiveWithinLimits(buffer)).not.toThrow();
	});

	it('rejects an archive whose declared uncompressed size exceeds the budget', () => {
		const buffer = buildCentralDirectoryBuffer(MAX_UNCOMPRESSED_BYTES + 1);

		expect(() => assertXlsxArchiveWithinLimits(buffer)).toThrow(/terlalu besar setelah diekstrak/i);
	});

	it('rejects a buffer that is not a zip archive', () => {
		expect(() => assertXlsxArchiveWithinLimits(Buffer.from('not a workbook'))).toThrow(/tidak valid/i);
	});

	it('rejects a worksheet with too many rows or columns', () => {
		expect(() => assertWorksheetWithinLimits({ rowCount: MAX_IMPORT_ROWS + 1, columnCount: 10 })).toThrow(/baris/i);
		expect(() => assertWorksheetWithinLimits({ rowCount: 10, columnCount: 101 })).toThrow(/kolom/i);
		expect(() => assertWorksheetWithinLimits({ rowCount: 10, columnCount: 10 })).not.toThrow();
	});
});
