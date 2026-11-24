import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import CommandPalette from '../index';

// jsdom does not implement scrolling; the palette scrolls the active row into view.
beforeEach(() => {
	Element.prototype.scrollIntoView = vi.fn();
});

vi.mock('@/contexts/authContext', () => ({
	useAuth: () => ({ logout: vi.fn() }),
}));

vi.mock('@/store', () => ({
	useDispatch: () => vi.fn(),
	useSelector: () => 'light',
}));

vi.mock('@/store/theme', () => ({
	setConfigKey: vi.fn((payload) => ({ type: 'theme/setConfigKey', payload })),
}));

vi.mock('@/store/theme/selectors', () => ({
	selectThemeMode: () => 'light',
}));

vi.mock('@/services/api', () => ({
	default: vi.fn(() => Promise.resolve({ items: [] })),
}));

const navItems = [
	{
		id: 'group-data-karyawan',
		type: 'group',
		title: 'Data Karyawan',
		menuChildren: [
			{
				id: 'page-detail-karyawan',
				type: 'item',
				title: 'Detail Karyawan',
				href: '/data-karyawan/detail-karyawan',
			},
		],
	},
];

const recent = [
	{
		href: '/data-karyawan/detail-karyawan',
		title: 'Detail Karyawan',
		subtitle: 'Data Karyawan',
	},
];

function renderPalette(props = {}) {
	return render(
		<MemoryRouter>
			<CommandPalette
				open
				onClose={vi.fn()}
				navItems={navItems}
				recent={recent}
				{...props}
			/>
		</MemoryRouter>,
	);
}

describe('CommandPalette', () => {
	it('renders recent pages whose href contains slashes without crashing', async () => {
		renderPalette();

		const input = screen.getByLabelText('Cari halaman, data, atau aksi');
		fireEvent.change(input, { target: { value: 'detail' } });

		await waitFor(() => {
			expect(screen.getAllByRole('option')).toHaveLength(2);
		});

		// Option ids stay valid selectors, so the scroll-into-view effect can
		// resolve the active row instead of throwing on `recent-/some/href`.
		expect(document.getElementById('palette-option-0')).not.toBeNull();
		expect(document.getElementById('palette-option-1')).not.toBeNull();
	});

	it('marks the active row through the index based id', async () => {
		renderPalette();

		const input = screen.getByLabelText('Cari halaman, data, atau aksi');
		fireEvent.change(input, { target: { value: 'detail' } });

		await waitFor(() => {
			expect(screen.getAllByRole('option')).toHaveLength(2);
		});

		fireEvent.keyDown(input, { key: 'ArrowDown' });

		await waitFor(() => {
			expect(screen.getAllByRole('option')[1]).toHaveAttribute('aria-selected', 'true');
		});
	});
});
