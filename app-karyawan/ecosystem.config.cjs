module.exports = {
	apps: [
		{
			name: 'hub-karyawan-api',
			script: 'server/index.js',
			instances: 4,
			exec_mode: 'cluster',
			node_args: '--experimental-vm-modules',
			env: {
				NODE_ENV: 'production',
				PORT: 4000,
			},
			max_memory_restart: '512M',
			error_file: './logs/pm2-error.log',
			out_file: './logs/pm2-out.log',
			merge_logs: true,
			log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
			watch: false,
			autorestart: true,
			max_restarts: 10,
			restart_delay: 3000,
		},
	],

	deploy: {
		production: {
			user: 'rifky',
			host: '100.100.220.113',
			ref: 'origin/master',
			repo: 'https://github.com/rifkyawalulhuda/aplikasi-hub-karyawan.git',
			path: '/home/rifky/deployments/hub-karyawan',
			'pre-deploy-local': '',
			'post-deploy':
				'cd app-karyawan && ' +
				'npm install --no-audit --no-fund && ' +
				'npm run build:prod && ' +
				'npx prisma generate && ' +
				'pm2 reload ecosystem.config.cjs --env production && ' +
				'pm2 save',
			'pre-setup': 'mkdir -p /home/rifky/deployments/hub-karyawan',
			env: {
				NODE_ENV: 'production',
			},
		},
	},
};
