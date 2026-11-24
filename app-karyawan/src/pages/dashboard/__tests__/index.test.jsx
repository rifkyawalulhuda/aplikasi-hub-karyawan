import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import apiRequest from '@/services/api';

import DashboardPage from '../index';

vi.mock('react-apexcharts', () => ({
	default: () => <div data-testid="apex-chart" />,
}));

vi.mock('notistack', () => ({
	useSnackbar: () => ({ enqueueSnackbar: vi.fn() }),
}));

vi.mock('@/contexts/siteContext', () => ({
	useSite: () => ({ isSuperAdmin: true, selectedSiteId: null, siteName: null }),
}));

vi.mock('@/components/mainHeader/SiteSelector', () => ({
	default: () => <div data-testid="site-selector" />,
}));

vi.mock('@/services/api', () => ({ default: vi.fn() }));

// Keep the assertions deterministic: skip the count-up and entrance animations.
vi.mock('../motion', () => ({
	useCountUp: (target) => target,
	useReducedMotion: () => true,
	entranceSx: () => ({}),
	REDUCED_MOTION_QUERY: '(prefers-reduced-motion: reduce)',
}));

const payload = {
	summary: {
		totalEmployees: 134,
		activeLeaveRequests: 2,
		expiringLicenses: 43,
		expiredLicenses: 17,
		expiringSoonLicenses: 26,
		expiredEmployeeLicenses: 9,
		expiredUnitLicenses: 8,
		expiringSoonEmployeeLicenses: 0,
		expiringSoonUnitLicenses: 26,
		siteCount: 2,
		newHires90d: 4,
		newHiresInPeriod: 3,
		permanentCount: 97,
		contractCount: 37,
		submittedLeaveRequests: 1,
		inApprovalLeaveRequests: 1,
		leaveRequestsInPeriod: 5,
	},
	charts: {
		byDepartment: [
			{ name: 'Operational', count: 113 },
			{ name: 'Transportation', count: 21 },
		],
		byJobLevel: [{ name: 'Staff', count: 100 }],
		byEmploymentType: [
			{ name: 'Permanent', count: 97 },
			{ name: 'Contract', count: 37 },
		],
		bySite: [
			{ name: 'CLC', count: 100 },
			{ name: 'JKT', count: 34 },
		],
		monthlyLeaveTrend: [
			{ month: 5, year: 2026, label: 'Jun', count: 0 },
			{ month: 6, year: 2026, label: 'Jul', count: 5 },
		],
		hiresTrend: [
			{ key: '2026-6', label: 'Jun', count: 2 },
			{ key: '2026-7', label: 'Jul', count: 1 },
		],
	},
	tables: {
		expiringLicenses: [],
		licenseAlerts: [
			{
				id: 'UNIT-13',
				kind: 'UNIT',
				subjectName: 'Forklift Reach Toyota',
				subjectNo: 'CLC-C-46',
				documentName: 'Sertifikat unit',
				documentNumber: '566.4/27642',
				validUntil: '2026-10-27',
				daysRemaining: -28,
				status: 'Expired',
			},
			{
				id: 'KARYAWAN-4',
				kind: 'KARYAWAN',
				subjectName: 'Budi Santoso',
				subjectNo: 'CLC-004',
				documentName: 'SIO Operator',
				documentNumber: 'SIO-4',
				validUntil: '2026-12-05',
				daysRemaining: 11,
				status: 'Akan Expired',
			},
		],
		recentLeaves: [
			{
				id: 1,
				requestNumber: 'CUTI-1',
				employeeName: 'Siti',
				employeeNo: 'CLC-010',
				leaveType: 'Cuti Tahunan',
				leaveDays: 3,
				status: 'APPROVED',
				createdAt: '2026-11-10',
			},
		],
		pendingLeaves: [
			{
				id: 2,
				requestNumber: 'CUTI-2',
				employeeName: 'Andi',
				employeeNo: 'CLC-011',
				leaveType: 'Cuti Tahunan',
				leaveDays: 2,
				status: 'SUBMITTED',
				createdAt: '2026-11-12',
			},
		],
	},
	b3Waste: {
		totalMasuk: 4546.55,
		totalKeluar: 4000,
		sisaDiTps: 546.55,
		overdueCount: 1,
		warningCount: 2,
		trendBulanan: [
			{ bulan: 'Jun', masuk: 3152, keluar: 3152 },
			{ bulan: 'Jul', masuk: 0, keluar: 0 },
		],
	},
	meta: {
		generatedAt: '2026-11-24T04:35:26.413Z',
		year: 2026,
		licenseSoonDays: 25,
		period: { key: '6m', label: '6 bulan terakhir', months: 6 },
		scope: { siteId: null, siteName: null, isAllSites: true },
	},
};

function renderPage() {
	return render(
		<MemoryRouter>
			<DashboardPage />
		</MemoryRouter>,
	);
}

describe('DashboardPage', () => {
	beforeEach(() => {
		vi.mocked(apiRequest).mockReset();
		vi.mocked(apiRequest).mockResolvedValue(payload);
	});

	it('shows a layout-matched skeleton while the first payload loads', () => {
		vi.mocked(apiRequest).mockReturnValue(new Promise(() => {}));

		renderPage();

		expect(screen.getByLabelText('Memuat dashboard')).toBeInTheDocument();
	});

	it('renders the KPI tiles from the summary', async () => {
		renderPage();

		expect(await screen.findByText('Total karyawan')).toBeInTheDocument();
		expect(screen.getByText('Cuti menunggu')).toBeInTheDocument();
		expect(screen.getByText('Lisensi expired')).toBeInTheDocument();
		expect(screen.getByText('Sisa limbah B3')).toBeInTheDocument();
		expect(screen.getByText('Site aktif')).toBeInTheDocument();

		// KPI values are formatted for Indonesian readers.
		expect(screen.getByText('134')).toBeInTheDocument();
		expect(screen.getByText('+3 masuk 6 bulan terakhir')).toBeInTheDocument();
	});

	it('surfaces the scope and freshness of the numbers', async () => {
		renderPage();

		expect(await screen.findByText('Semua site')).toBeInTheDocument();
		expect(screen.getByText('6 bulan terakhir')).toBeInTheDocument();
	});

	it('lists license alerts with the expired rows first', async () => {
		renderPage();

		expect(await screen.findByText('Lisensi & sertifikasi perlu tindakan')).toBeInTheDocument();
		expect(screen.getByText('17 sudah expired · 26 berakhir dalam 25 hari')).toBeInTheDocument();

		// The employee tab is the default view.
		expect(screen.getByText('Budi Santoso')).toBeInTheDocument();
	});

	it('shows the approval queue and the B3 section when data exists', async () => {
		renderPage();

		expect(await screen.findByText('Andi')).toBeInTheDocument();
		expect(screen.getByText('1 melewati batas simpan')).toBeInTheDocument();
	});

	it('falls back to the latest decisions when nothing is waiting for approval', async () => {
		vi.mocked(apiRequest).mockResolvedValue({
			...payload,
			summary: {
				...payload.summary,
				activeLeaveRequests: 0,
				submittedLeaveRequests: 0,
				inApprovalLeaveRequests: 0,
			},
			tables: { ...payload.tables, pendingLeaves: [] },
		});

		renderPage();

		expect(await screen.findByText('Tidak ada pengajuan yang menunggu')).toBeInTheDocument();
		expect(screen.getByText('Terakhir diproses')).toBeInTheDocument();
		// Once in the queue card, once in the "recent requests" table.
		expect(screen.getAllByText('Siti').length).toBeGreaterThanOrEqual(2);
	});

	it('shows the closest B3 storage deadline', async () => {
		vi.mocked(apiRequest).mockResolvedValue({
			...payload,
			b3Waste: {
				...payload.b3Waste,
				overdueCount: 0,
				warningCount: 1,
				nearestDeadline: {
					sisaHari: 5,
					tanggalBatas: '2026-11-29',
					jenisLimbah: 'Oli bekas',
					sisaKg: 120.5,
				},
			},
		});

		renderPage();

		expect(await screen.findByText('Batas penyimpanan terdekat')).toBeInTheDocument();
		expect(screen.getByText(/Oli bekas/)).toBeInTheDocument();
		expect(screen.getByText('5 hari lagi')).toBeInTheDocument();
	});

	it('drills down from a KPI tile to its module', async () => {
		renderPage();

		const tile = await screen.findByRole('link', { name: /^Total karyawan/i });

		expect(tile).toHaveAttribute('href', '/data-karyawan/detail-karyawan');
	});

	it('renders an error state with a retry action when the request fails', async () => {
		vi.mocked(apiRequest).mockRejectedValue(new Error('Jaringan bermasalah'));

		renderPage();

		await waitFor(() => {
			expect(screen.getByText(/Data dashboard tidak dapat dimuat/i)).toBeInTheDocument();
		});
		expect(screen.getByRole('button', { name: 'Coba lagi' })).toBeInTheDocument();
	});
});
