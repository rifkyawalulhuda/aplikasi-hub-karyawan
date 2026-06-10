/* eslint-disable import/first */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import { useAuth } from '@/contexts/authContext';
import { useSnackbar } from 'notistack';
import { fetchConfigsBySite, saveConfigsBulk } from '@/services/siteApprovalConfigService';
import apiRequest from '@/services/api';

import SiteApprovalConfigPage from '../index';

// Mock dependencies
vi.mock('@/contexts/authContext', () => ({
	useAuth: vi.fn(),
}));

vi.mock('notistack', () => ({
	useSnackbar: vi.fn(),
}));

vi.mock('@/services/siteApprovalConfigService', () => ({
	fetchConfigsBySite: vi.fn(),
	saveConfigsBulk: vi.fn(),
}));

vi.mock('@/services/api', () => ({
	default: vi.fn(),
}));

vi.mock('@/components/cardHeader', () => ({
	default: ({ title, subtitle }) => (
		<div data-testid="card-header">
			<span>{title}</span>
			<span>{subtitle}</span>
		</div>
	),
}));

vi.mock('@/components/pageHeader', () => ({
	default: ({ title, children }) => (
		<div data-testid="page-header">
			<span>{title}</span>
			{children}
		</div>
	),
}));

const mockEnqueueSnackbar = vi.fn();

function renderPage() {
	return render(
		<MemoryRouter>
			<SiteApprovalConfigPage />
		</MemoryRouter>,
	);
}

describe('SiteApprovalConfigPage', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		useAuth.mockReturnValue({ user: { role: 'super_admin' } });
		useSnackbar.mockReturnValue({ enqueueSnackbar: mockEnqueueSnackbar });
		apiRequest.mockResolvedValue([]);
	});

	describe('Site selector renders and loads sites', () => {
		it('renders the site selector autocomplete', async () => {
			apiRequest.mockResolvedValue([
				{ id: 1, name: 'Site Alpha' },
				{ id: 2, name: 'Site Beta' },
			]);

			renderPage();

			const input = screen.getByLabelText('Pilih Site');
			expect(input).toBeInTheDocument();
		});

		it('fetches sites on mount via apiRequest', async () => {
			apiRequest.mockResolvedValue([{ id: 1, name: 'Site Alpha' }]);

			renderPage();

			await waitFor(() => {
				expect(apiRequest).toHaveBeenCalledWith('/master/sites');
			});
		});

		it('shows error snackbar when site fetch fails', async () => {
			apiRequest.mockRejectedValue(new Error('Network error'));

			renderPage();

			await waitFor(() => {
				expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Network error', { variant: 'error' });
			});
		});
	});

	describe('Table displays job levels with config values', () => {
		it('displays job levels table after selecting a site', async () => {
			apiRequest
				.mockResolvedValueOnce([{ id: 1, name: 'Site Alpha' }]) // fetchSites
				.mockResolvedValueOnce([
					{ id: 10, name: 'Staff' },
					{ id: 11, name: 'Foreman' },
				]); // fetchJobLevels

			fetchConfigsBySite.mockResolvedValue([
				{ jobLevelId: 10, approvalRank: null, maxApprovalRank: 5 },
				{ jobLevelId: 11, approvalRank: 1, maxApprovalRank: 5 },
			]);

			renderPage();

			// Wait for sites to load
			await waitFor(() => {
				expect(apiRequest).toHaveBeenCalledWith('/master/sites');
			});

			// Open autocomplete and select site
			const input = screen.getByLabelText('Pilih Site');
			fireEvent.mouseDown(input);

			await waitFor(() => {
				expect(screen.getByText('Site Alpha')).toBeInTheDocument();
			});

			fireEvent.click(screen.getByText('Site Alpha'));

			// Wait for job levels and configs to load
			await waitFor(() => {
				expect(apiRequest).toHaveBeenCalledWith('/master/job-levels');
				expect(fetchConfigsBySite).toHaveBeenCalledWith(1);
			});

			// Verify table shows job level names
			await waitFor(() => {
				expect(screen.getByText('Staff')).toBeInTheDocument();
				expect(screen.getByText('Foreman')).toBeInTheDocument();
			});
		});

		it('shows message when no job levels are available', async () => {
			apiRequest
				.mockResolvedValueOnce([{ id: 1, name: 'Site Alpha' }]) // fetchSites
				.mockResolvedValueOnce([]); // fetchJobLevels (empty)

			fetchConfigsBySite.mockResolvedValue([]);

			renderPage();

			await waitFor(() => {
				expect(apiRequest).toHaveBeenCalledWith('/master/sites');
			});

			const input = screen.getByLabelText('Pilih Site');
			fireEvent.mouseDown(input);

			await waitFor(() => {
				expect(screen.getByText('Site Alpha')).toBeInTheDocument();
			});

			fireEvent.click(screen.getByText('Site Alpha'));

			await waitFor(() => {
				expect(screen.getByText('Tidak ada data job level yang tersedia.')).toBeInTheDocument();
			});
		});
	});

	describe('Save button calls bulk API', () => {
		it('calls saveConfigsBulk with correct data when save is clicked', async () => {
			apiRequest
				.mockResolvedValueOnce([{ id: 1, name: 'Site Alpha' }]) // fetchSites
				.mockResolvedValueOnce([{ id: 10, name: 'Staff' }]); // fetchJobLevels

			fetchConfigsBySite.mockResolvedValue([{ jobLevelId: 10, approvalRank: null, maxApprovalRank: 5 }]);
			saveConfigsBulk.mockResolvedValue([]);

			renderPage();

			await waitFor(() => {
				expect(apiRequest).toHaveBeenCalledWith('/master/sites');
			});

			// Select site
			const input = screen.getByLabelText('Pilih Site');
			fireEvent.mouseDown(input);

			await waitFor(() => {
				expect(screen.getByText('Site Alpha')).toBeInTheDocument();
			});

			fireEvent.click(screen.getByText('Site Alpha'));

			// Wait for table to render
			await waitFor(() => {
				expect(screen.getByText('Staff')).toBeInTheDocument();
			});

			// Click save button
			const saveButton = screen.getByRole('button', { name: /simpan konfigurasi/i });
			fireEvent.click(saveButton);

			await waitFor(() => {
				expect(saveConfigsBulk).toHaveBeenCalledWith(1, [
					{ jobLevelId: 10, approvalRank: null, maxApprovalRank: 5 },
				]);
			});
		});

		it('shows success snackbar after successful save', async () => {
			apiRequest
				.mockResolvedValueOnce([{ id: 1, name: 'Site Alpha' }]) // fetchSites
				.mockResolvedValueOnce([{ id: 10, name: 'Staff' }]); // fetchJobLevels

			fetchConfigsBySite.mockResolvedValue([{ jobLevelId: 10, approvalRank: null, maxApprovalRank: 5 }]);
			saveConfigsBulk.mockResolvedValue([]);

			renderPage();

			await waitFor(() => {
				expect(apiRequest).toHaveBeenCalledWith('/master/sites');
			});

			const input = screen.getByLabelText('Pilih Site');
			fireEvent.mouseDown(input);

			await waitFor(() => {
				expect(screen.getByText('Site Alpha')).toBeInTheDocument();
			});

			fireEvent.click(screen.getByText('Site Alpha'));

			await waitFor(() => {
				expect(screen.getByText('Staff')).toBeInTheDocument();
			});

			const saveButton = screen.getByRole('button', { name: /simpan konfigurasi/i });
			fireEvent.click(saveButton);

			await waitFor(() => {
				expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Konfigurasi approval berhasil disimpan.', {
					variant: 'success',
				});
			});
		});
	});

	describe('Error display on validation failure', () => {
		it('shows error snackbar when save fails with validation error', async () => {
			apiRequest
				.mockResolvedValueOnce([{ id: 1, name: 'Site Alpha' }]) // fetchSites
				.mockResolvedValueOnce([{ id: 10, name: 'Staff' }]); // fetchJobLevels

			fetchConfigsBySite.mockResolvedValue([{ jobLevelId: 10, approvalRank: null, maxApprovalRank: 5 }]);
			saveConfigsBulk.mockRejectedValue(new Error('maxApprovalRank harus berupa bilangan bulat positif.'));

			renderPage();

			await waitFor(() => {
				expect(apiRequest).toHaveBeenCalledWith('/master/sites');
			});

			const input = screen.getByLabelText('Pilih Site');
			fireEvent.mouseDown(input);

			await waitFor(() => {
				expect(screen.getByText('Site Alpha')).toBeInTheDocument();
			});

			fireEvent.click(screen.getByText('Site Alpha'));

			await waitFor(() => {
				expect(screen.getByText('Staff')).toBeInTheDocument();
			});

			const saveButton = screen.getByRole('button', { name: /simpan konfigurasi/i });
			fireEvent.click(saveButton);

			await waitFor(() => {
				expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
					'maxApprovalRank harus berupa bilangan bulat positif.',
					{ variant: 'error' },
				);
			});
		});

		it('shows error snackbar when loading configs fails', async () => {
			apiRequest
				.mockResolvedValueOnce([{ id: 1, name: 'Site Alpha' }]) // fetchSites
				.mockResolvedValueOnce([{ id: 10, name: 'Staff' }]); // fetchJobLevels

			fetchConfigsBySite.mockRejectedValue(new Error('Server error'));

			renderPage();

			await waitFor(() => {
				expect(apiRequest).toHaveBeenCalledWith('/master/sites');
			});

			const input = screen.getByLabelText('Pilih Site');
			fireEvent.mouseDown(input);

			await waitFor(() => {
				expect(screen.getByText('Site Alpha')).toBeInTheDocument();
			});

			fireEvent.click(screen.getByText('Site Alpha'));

			await waitFor(() => {
				expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Server error', { variant: 'error' });
			});
		});
	});

	describe('Access restriction for non-super_admin', () => {
		it('redirects non-super_admin users', () => {
			useAuth.mockReturnValue({ user: { role: 'admin' } });

			renderPage();

			// The Navigate component should be rendered (redirect to /)
			// Since we're using MemoryRouter, we can check that the page content is NOT rendered
			expect(screen.queryByLabelText('Pilih Site')).not.toBeInTheDocument();
			expect(screen.queryByText('Konfigurasi Approval Site')).not.toBeInTheDocument();
		});

		it('redirects when user has no role', () => {
			useAuth.mockReturnValue({ user: { role: null } });

			renderPage();

			expect(screen.queryByLabelText('Pilih Site')).not.toBeInTheDocument();
		});

		it('renders page content for super_admin users', async () => {
			useAuth.mockReturnValue({ user: { role: 'super_admin' } });
			apiRequest.mockResolvedValue([]);

			renderPage();

			expect(screen.getByLabelText('Pilih Site')).toBeInTheDocument();
		});
	});
});
