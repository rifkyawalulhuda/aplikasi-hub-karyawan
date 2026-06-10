module.exports = {
	apps: [
		{
			name: 'hub-karyawan-api',
			script: 'server/index.js',
			instances: 'max',
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
};
