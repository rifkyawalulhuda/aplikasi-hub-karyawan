export function normalizePath(href = '') {
	return String(href).split('#')[0].replace(/\/+$/, '');
}

export function isPathActive(href, pathname = '') {
	const base = normalizePath(href);

	if (!base) {
		return false;
	}

	const current = normalizePath(pathname);

	return current === base || current.startsWith(`${base}/`);
}

export function isNavItemActive(item, pathname = '') {
	if (!item?.href) {
		return false;
	}

	if (isPathActive(item.href, pathname)) {
		return true;
	}

	return (item.matchPaths ?? []).some((path) => isPathActive(path, pathname));
}

export function isGroupActive(menuChildren = [], pathname = '') {
	return menuChildren.some((item) => {
		if (item.type === 'group') {
			return isGroupActive(item.menuChildren ?? [], pathname);
		}

		return isNavItemActive(item, pathname);
	});
}

export function findActiveItem(menuChildren = [], pathname = '') {
	return menuChildren.reduce((found, item) => {
		if (found) {
			return found;
		}

		if (item.type === 'group') {
			return findActiveItem(item.menuChildren ?? [], pathname);
		}

		return isNavItemActive(item, pathname) ? item : null;
	}, null);
}

export function flattenNavItems(items, trail = []) {
	return items.flatMap((item) => {
		const currentTrail = [...trail, item.title];

		if (item.menuChildren?.length) {
			return flattenNavItems(item.menuChildren, currentTrail);
		}

		if (item.type !== 'item' || !item.href) {
			return [];
		}

		return [
			{
				id: item.id,
				type: 'page',
				group: 'Halaman',
				title: item.title,
				subtitle: currentTrail.slice(0, -1).join(' / '),
				trail: currentTrail,
				Icon: item.Icon,
				href: item.href,
				matchPaths: item.matchPaths ?? [],
			},
		];
	});
}

export function findNavTrail(items, pathname = '', trail = []) {
	const candidates = items.map((item) => {
		const currentTrail = [...trail, { title: item.title, href: item.href }];

		if (item.menuChildren?.length) {
			return findNavTrail(item.menuChildren, pathname, currentTrail);
		}

		return item.href && isNavItemActive(item, pathname) ? currentTrail : null;
	});

	return candidates.find((entry) => entry !== null) ?? null;
}

export function countSegments(path = '') {
	const clean = normalizePath(path);

	if (!clean) {
		return 0;
	}

	return clean.split('/').filter(Boolean).length;
}

export function filterNavItemsByRole(items, role) {
	return items
		.filter((item) => {
			if (item.roles && !item.roles.includes(role)) {
				return false;
			}
			return true;
		})
		.map((item) => {
			if (item.menuChildren) {
				const filteredChildren = filterNavItemsByRole(item.menuChildren, role);
				return { ...item, menuChildren: filteredChildren };
			}
			return item;
		})
		.filter((item) => {
			if (item.type === 'group' && item.menuChildren && item.menuChildren.length === 0) {
				return false;
			}
			return true;
		});
}
