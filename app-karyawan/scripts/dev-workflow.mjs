import { spawn, spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function runPowerShell(command) {
	return spawnSync('powershell.exe', ['-NoProfile', '-Command', command], {
		encoding: 'utf8',
		windowsHide: true,
	});
}

function parseProcessList(stdout = '') {
	const trimmed = String(stdout || '').trim();

	if (!trimmed) {
		return [];
	}

	const parsed = JSON.parse(trimmed);
	return Array.isArray(parsed) ? parsed : [parsed];
}

function getBackendProcesses() {
	const command = `
$pattern = '(?:cmd\\.exe.*npm run dev:server(?:\\s|$)|npm-cli\\.js.*run dev:server(?:\\s|$)|nodemon\\.js.*server[\\\\/]+index\\.js|node\\.exe.*server[\\\\/]+index\\.js)'
$items = Get-CimInstance Win32_Process |
	Where-Object { $_.CommandLine -and $_.CommandLine -match $pattern } |
	Select-Object ProcessId, CommandLine
if ($null -eq $items) {
	''
} else {
	$items | ConvertTo-Json -Compress -Depth 2
}
`;
	const result = runPowerShell(command);

	if (result.status !== 0) {
		throw new Error(result.stderr || result.stdout || 'Gagal membaca proses backend.');
	}

	return parseProcessList(result.stdout);
}

function stopBackendProcesses() {
	const processes = getBackendProcesses();

	if (!processes.length) {
		console.log('Tidak ada proses backend dev yang aktif.');
		return [];
	}

	processes.forEach((item) => {
		console.log(`Menghentikan backend dev PID ${item.ProcessId}...`);
		const killResult = spawnSync('taskkill', ['/PID', String(item.ProcessId), '/T', '/F'], {
			encoding: 'utf8',
			windowsHide: true,
		});

		if (killResult.status !== 0) {
			console.warn(killResult.stderr || killResult.stdout || `Gagal menghentikan PID ${item.ProcessId}.`);
		}
	});

	return processes;
}

function restartBackend() {
	const child = spawn(npmCommand, ['run', 'dev:server'], {
		cwd: projectRoot,
		detached: true,
		stdio: 'ignore',
		windowsHide: true,
		shell: process.platform === 'win32',
	});

	child.unref();
	console.log('Backend dev dijalankan ulang di proses terpisah.');
}

function runPrismaGenerateSafe() {
	const stoppedProcesses = stopBackendProcesses();
	const result = spawnSync(npmCommand, ['run', 'prisma:generate'], {
		cwd: projectRoot,
		stdio: 'inherit',
		windowsHide: true,
		shell: process.platform === 'win32',
	});

	if (result.status !== 0) {
		process.exit(result.status || 1);
	}

	if (stoppedProcesses.length) {
		restartBackend();
	}
}

function printStatus() {
	const processes = getBackendProcesses();

	if (!processes.length) {
		console.log('Backend dev tidak sedang berjalan.');
		return;
	}

	console.log('Backend dev yang aktif:');
	processes.forEach((item) => {
		console.log(`- PID ${item.ProcessId}: ${item.CommandLine}`);
	});
}

function printHelp() {
	console.log([
		'Dev workflow helper',
		'',
		'Perintah:',
		'  status          Lihat proses backend dev yang aktif',
		'  stop-backend    Hentikan hanya backend dev tanpa menyentuh frontend',
		'  prisma-generate Generate Prisma Client dengan aman lalu restart backend bila perlu',
	].join('\n'));
}

const command = process.argv[2] || '';

try {
	switch (command) {
		case 'status':
			printStatus();
			break;
		case 'stop-backend':
			stopBackendProcesses();
			break;
		case 'prisma-generate':
			runPrismaGenerateSafe();
			break;
		case 'help':
		case '--help':
		case '-h':
		case '':
			printHelp();
			break;
		default:
			console.error(`Perintah tidak dikenal: ${command}`);
			printHelp();
			process.exitCode = 1;
	}
} catch (error) {
	console.error(error.message || error);
	process.exitCode = 1;
}
