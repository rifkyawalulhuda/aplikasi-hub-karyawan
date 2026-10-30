import { v4 as uuid } from 'uuid';

import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import FeedOutlinedIcon from '@mui/icons-material/FeedOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import ReportGmailerrorredOutlinedIcon from '@mui/icons-material/ReportGmailerrorredOutlined';
import SettingsApplicationsOutlinedIcon from '@mui/icons-material/SettingsApplicationsOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import CastForEducationOutlinedIcon from '@mui/icons-material/CastForEducationOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';

import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';

/**
 * @example
 * {
 *	id: number,
 *	type: "group" | "item",
 *	title: string,
 *	Icon: NodeElement,
 *	menuChildren?: {title: string, href: string, section?: string, description?: string}[]
 * }
 *
 * Every destination lives at depth 2 (tab -> page). `section` groups
 * children into columns inside the mega-menu.
 */

const NAV_LINKS_CONFIG = [
	{
		id: uuid(),
		type: 'item',
		title: 'Dashboard',
		Icon: DashboardOutlinedIcon,
		href: '/dashboard',
	},
	{
		id: uuid(),
		type: 'group',
		title: 'Data Master',
		Icon: SettingsApplicationsOutlinedIcon,
		menuChildren: [
			{
				id: uuid(),
				type: 'item',
				title: 'Master Data Karyawan',
				section: 'Karyawan & Akses',
				description: 'Data induk seluruh karyawan',
				Icon: BadgeOutlinedIcon,
				href: '/data-master/master-data-karyawan/employees',
			},
			{
				id: uuid(),
				type: 'item',
				title: 'Master Admin',
				section: 'Karyawan & Akses',
				description: 'Akun dan hak akses admin',
				Icon: BadgeOutlinedIcon,
				href: '/data-master/master-data-karyawan/admins',
			},
			{
				id: uuid(),
				type: 'item',
				title: 'Site Approval Config',
				section: 'Karyawan & Akses',
				description: 'Alur persetujuan per site',
				Icon: SettingsApplicationsOutlinedIcon,
				href: '/data-master/master-data-karyawan/site-approval-config',
				roles: ['super_admin'],
			},
			{
				id: uuid(),
				type: 'item',
				title: 'Master Unit',
				section: 'Unit & Vendor',
				description: 'Data unit dan armada',
				Icon: LocalShippingOutlinedIcon,
				href: '/data-master/master-data-unit/master-unit',
			},
			{
				id: uuid(),
				type: 'item',
				title: 'Master Vendor',
				section: 'Unit & Vendor',
				description: 'Data vendor rekanan',
				Icon: BusinessOutlinedIcon,
				href: '/data-master/master-data-unit/master-vendor',
			},
			{
				id: uuid(),
				type: 'item',
				title: 'Master Data Dokumen',
				section: 'Dokumen',
				description: 'Master dokumen PKB',
				Icon: DescriptionOutlinedIcon,
				href: '/data-master/master-data-dokumen/master-dok-pkb',
			},
		],
	},
	{
		id: uuid(),
		type: 'group',
		title: 'Data Karyawan',
		Icon: PeopleAltOutlinedIcon,
		menuChildren: [
			{
				id: uuid(),
				type: 'item',
				title: 'Detail Karyawan',
				section: 'Profil',
				description: 'Profil dan riwayat karyawan',
				Icon: PeopleAltOutlinedIcon,
				href: '/data-karyawan/detail-karyawan',
			},
			{
				id: uuid(),
				type: 'item',
				title: 'Bimbingan & Pengarahan',
				section: 'Pembinaan',
				description: 'Catatan bimbingan atasan',
				Icon: FeedOutlinedIcon,
				href: '/data-karyawan/bimbingan-pengarahan',
			},
			{
				id: uuid(),
				type: 'item',
				title: 'Data Surat Peringatan',
				section: 'Pembinaan',
				description: 'SP1 sampai SP3',
				Icon: ReportGmailerrorredOutlinedIcon,
				href: '/data-karyawan/data-surat-peringatan',
			},
			{
				id: uuid(),
				type: 'item',
				title: 'Lisensi & Sertifikasi',
				section: 'Kompetensi',
				description: 'Lisensi dan sertifikat karyawan',
				Icon: DescriptionOutlinedIcon,
				href: '/data-karyawan/lisensi-sertifikasi',
			},
			{
				id: uuid(),
				type: 'item',
				title: 'Pelatihan Karyawan',
				section: 'Kompetensi',
				description: 'Riwayat pelatihan',
				Icon: CastForEducationOutlinedIcon,
				href: '/data-karyawan/pelatihan-karyawan',
			},
			{
				id: uuid(),
				type: 'item',
				title: 'Cuti Karyawan',
				section: 'Kehadiran',
				description: 'Pengajuan dan riwayat cuti',
				Icon: DescriptionOutlinedIcon,
				href: '/data-karyawan/cuti-karyawan',
			},
		],
	},
	{
		id: uuid(),
		type: 'group',
		title: 'Operasional',
		Icon: LocalShippingOutlinedIcon,
		menuChildren: [
			{
				id: uuid(),
				type: 'item',
				title: 'Lisensi & Sertifikasi Unit',
				section: 'Unit',
				description: 'Legalitas unit dan armada',
				Icon: DescriptionOutlinedIcon,
				href: '/data-unit/lisensi-sertifikasi-unit',
			},
			{
				id: uuid(),
				type: 'item',
				title: 'Limbah B3',
				section: 'Limbah B3',
				description: 'Pencatatan dan neraca limbah B3',
				Icon: ScienceOutlinedIcon,
				href: '/limbah-b3/pencatatan',
				matchPaths: ['/limbah-b3/neraca'],
			},
		],
	},
	{
		id: uuid(),
		type: 'group',
		title: 'Dokumen',
		fullTitle: 'Dokumen & Pengaturan',
		Icon: DescriptionOutlinedIcon,
		menuChildren: [
			{
				id: uuid(),
				type: 'item',
				title: 'Lembar Pengiriman',
				section: 'Dokumen',
				description: 'Surat jalan dan bukti kirim',
				Icon: LocalShippingOutlinedIcon,
				href: '/dokumen/lembar-pengiriman',
			},
			{
				id: uuid(),
				type: 'item',
				title: 'Pengaturan Email',
				section: 'Pengaturan',
				description: 'Notifikasi dan template email',
				Icon: EmailOutlinedIcon,
				href: '/pengaturan/email-notifikasi',
			},
		],
	},
];

export default NAV_LINKS_CONFIG;
