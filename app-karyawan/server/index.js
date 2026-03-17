import 'dotenv/config';
import cors from 'cors';
import express from 'express';

import prisma from './lib/prisma.js';
import adminsRouter from './routes/admins.js';
import guidanceRecordsRouter from './routes/guidanceRecords.js';
import employeesRouter from './routes/employees.js';
import masterDataRouter from './routes/masterData.js';
import warningLettersRouter from './routes/warningLetters.js';

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(
	cors({
		origin: true,
		credentials: true,
	}),
);
app.use(express.json());

app.get('/api/health', async (req, res) => {
	try {
		await prisma.$queryRaw`SELECT 1`;
		return res.json({ status: 'ok' });
	} catch (error) {
		return res.status(500).json({
			status: 'error',
			message: 'Database connection failed.',
		});
	}
});

app.use('/api/master/employees', employeesRouter);
app.use('/api/master/admins', adminsRouter);
app.use('/api/master', masterDataRouter);
app.use('/api/data-karyawan/guidance-records', guidanceRecordsRouter);
app.use('/api/data-karyawan/warning-letters', warningLettersRouter);

app.use((error, req, res) => {
	console.error(error);

	if (error?.code === 'P2002') {
		return res.status(409).json({
			message: 'Data sudah ada.',
		});
	}

	if (error?.code === 'P2003') {
		return res.status(409).json({
			message: 'Data tidak bisa dihapus karena masih digunakan oleh data lain.',
		});
	}

	if (error?.statusCode) {
		return res.status(error.statusCode).json({
			message: error.message,
		});
	}

	return res.status(500).json({
		message: 'Terjadi kesalahan pada server.',
	});
});

app.listen(port, () => {
	console.log(`API server running on http://localhost:${port}`);
});
