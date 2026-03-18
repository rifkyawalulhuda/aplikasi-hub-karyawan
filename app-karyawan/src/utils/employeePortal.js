function formatLongDate(value) {
	if (!value) {
		return '-';
	}

	try {
		return new Intl.DateTimeFormat('id-ID', {
			day: '2-digit',
			month: 'long',
			year: 'numeric',
		}).format(new Date(`${value}T12:00:00`));
	} catch {
		return value;
	}
}

function getEmployeePortalErrorMessage(error) {
	if (error?.status === 401) {
		return 'Sesi login berakhir. Silakan login kembali.';
	}

	if (typeof navigator !== 'undefined' && !navigator.onLine) {
		return 'Butuh koneksi internet untuk memuat data karyawan.';
	}

	return error?.message || 'Terjadi kesalahan saat memuat data.';
}

function handleEmployeeUnauthorized({ error, logout, navigate, enqueueSnackbar, redirectTo = '/karyawan/login' }) {
	if (error?.status !== 401) {
		return false;
	}

	logout();
	enqueueSnackbar('Sesi login karyawan berakhir. Silakan login kembali.', {
		variant: 'warning',
	});
	navigate(redirectTo, { replace: true });
	return true;
}

export { formatLongDate, getEmployeePortalErrorMessage, handleEmployeeUnauthorized };
