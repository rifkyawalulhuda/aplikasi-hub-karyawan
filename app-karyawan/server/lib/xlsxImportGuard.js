const ZIP_END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;
const ZIP_CENTRAL_DIRECTORY_ENTRY_SIGNATURE = 0x02014b50;

const MAX_UNCOMPRESSED_BYTES = 64 * 1024 * 1024;
const MAX_ARCHIVE_ENTRIES = 1024;
const MAX_IMPORT_ROWS = 5000;
const MAX_IMPORT_COLUMNS = 100;

function invalidFile(message) {
	return Object.assign(new Error(message), { statusCode: 400 });
}

function findEndOfCentralDirectory(buffer) {
	const minimumOffset = Math.max(0, buffer.length - 22 - 0xffff);

	for (let offset = buffer.length - 22; offset >= minimumOffset; offset -= 1) {
		if (buffer.readUInt32LE(offset) === ZIP_END_OF_CENTRAL_DIRECTORY_SIGNATURE) {
			return offset;
		}
	}

	return -1;
}

/**
 * Reject an XLSX whose declared uncompressed size or entry count exceeds the
 * import budget. Must run before the archive is handed to a zip parser, because
 * multer's byte limit only bounds the compressed representation.
 */
function assertXlsxArchiveWithinLimits(buffer) {
	if (!Buffer.isBuffer(buffer) || buffer.length < 22) {
		throw invalidFile('File Excel tidak valid.');
	}

	const endOffset = findEndOfCentralDirectory(buffer);

	if (endOffset < 0) {
		throw invalidFile('File Excel tidak valid.');
	}

	const entryCount = buffer.readUInt16LE(endOffset + 10);
	const centralDirectoryOffset = buffer.readUInt32LE(endOffset + 16);

	if (entryCount > MAX_ARCHIVE_ENTRIES) {
		throw invalidFile('File Excel memiliki terlalu banyak bagian. Pecah file menjadi beberapa import.');
	}

	let cursor = centralDirectoryOffset;
	let totalUncompressedBytes = 0;

	for (let index = 0; index < entryCount; index += 1) {
		if (cursor + 46 > buffer.length || buffer.readUInt32LE(cursor) !== ZIP_CENTRAL_DIRECTORY_ENTRY_SIGNATURE) {
			throw invalidFile('File Excel tidak valid.');
		}

		const uncompressedSize = buffer.readUInt32LE(cursor + 24);
		const nameLength = buffer.readUInt16LE(cursor + 28);
		const extraLength = buffer.readUInt16LE(cursor + 30);
		const commentLength = buffer.readUInt16LE(cursor + 32);

		totalUncompressedBytes += uncompressedSize;

		if (totalUncompressedBytes > MAX_UNCOMPRESSED_BYTES) {
			throw invalidFile('File Excel terlalu besar setelah diekstrak. Kurangi jumlah baris atau gambar.');
		}

		cursor += 46 + nameLength + extraLength + commentLength;
	}
}

function assertWorksheetWithinLimits(worksheet) {
	if (!worksheet) {
		throw invalidFile('Sheet Excel tidak ditemukan.');
	}

	if (worksheet.rowCount > MAX_IMPORT_ROWS) {
		throw invalidFile(`Jumlah baris melebihi batas ${MAX_IMPORT_ROWS}. Pecah file menjadi beberapa import.`);
	}

	if (worksheet.columnCount > MAX_IMPORT_COLUMNS) {
		throw invalidFile(`Jumlah kolom melebihi batas ${MAX_IMPORT_COLUMNS}.`);
	}
}

export {
	assertWorksheetWithinLimits,
	assertXlsxArchiveWithinLimits,
	MAX_ARCHIVE_ENTRIES,
	MAX_IMPORT_COLUMNS,
	MAX_IMPORT_ROWS,
	MAX_UNCOMPRESSED_BYTES,
};
