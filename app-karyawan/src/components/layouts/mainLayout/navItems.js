import { v4 as uuid } from 'uuid';

import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import FeedOutlinedIcon from '@mui/icons-material/FeedOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import ReportGmailerrorredOutlinedIcon from '@mui/icons-material/ReportGmailerrorredOutlined';
import SettingsApplicationsOutlinedIcon from '@mui/icons-material/SettingsApplicationsOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import CastForEducationOutlinedIcon from '@mui/icons-material/CastForEducationOutlined';

import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';

/**
 * @example
 * {
 *	id: number,
 *	type: "group" | "item",
 *	title: string,
 *	Icon: NodeElement
 *	menuChildren?: {title: string, href: string}[]
 *  menuMinWidth?: number
 * }
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
		menuMinWidth: 220,
		menuChildren: [
			{
				id: uuid(),
				type: 'item',
				title: 'Master Data Karyawan',
				Icon: BadgeOutlinedIcon,
				href: '/data-master/master-data-karyawan/employees',
			},
			{
				id: uuid(),
				type: 'item',
				title: 'Master Admin',
				Icon: BadgeOutlinedIcon,
				href: '/data-master/master-data-karyawan/admins',
			},
			{
				id: uuid(),
				type: 'item',
				title: 'Site Approval Config',
				Icon: SettingsApplicationsOutlinedIcon,
				href: '/data-master/master-data-karyawan/site-approval-config',
				roles: ['super_admin'],
			},
			{
				id: uuid(),
				type: 'group',
				title: 'Master Data Unit',
				Icon: LocalShippingOutlinedIcon,
				menuChildren: [
					{
						id: uuid(),
						type: 'item',
						title: 'Master Unit',
						Icon: LocalShippingOutlinedIcon,
						href: '/data-master/master-data-unit/master-unit',
					},
					{
						id: uuid(),
						type: 'item',
						title: 'Master Vendor',
						Icon: BusinessOutlinedIcon,
						href: '/data-master/master-data-unit/master-vendor',
					},
				],
			},
			{
				id: uuid(),
				type: 'group',
				title: 'Master Data Dokumen',
				Icon: DescriptionOutlinedIcon,
				menuChildren: [
					{
						id: uuid(),
						type: 'item',
						title: 'Master Dok PKB',
						Icon: ReceiptLongOutlinedIcon,
						href: '/data-master/master-data-dokumen/master-dok-pkb',
					},
					{
						id: uuid(),
						type: 'item',
						title: 'Master Dok Karyawan',
						Icon: DescriptionOutlinedIcon,
						href: '/data-master/master-data-dokumen/master-dok-karyawan',
					},
					{
						id: uuid(),
						type: 'item',
						title: 'Master Cuti Karyawan',
						Icon: DescriptionOutlinedIcon,
						href: '/data-master/master-data-dokumen/master-cuti-karyawan',
					},
					{
						id: uuid(),
						type: 'item',
						title: 'Master Hari Libur',
						Icon: DescriptionOutlinedIcon,
						href: '/data-master/master-data-dokumen/master-hari-libur',
					},
				],
			},
		],
	},
	{
		id: uuid(),
		type: 'group',
		title: 'Data Karyawan',
		Icon: PeopleAltOutlinedIcon,
		menuMinWidth: 240,
		menuChildren: [
			{
				id: uuid(),
				type: 'item',
				title: 'Detail Karyawan',
				Icon: PeopleAltOutlinedIcon,
				href: '/data-karyawan/detail-karyawan',
			},
			{
				id: uuid(),
				type: 'item',
				title: 'Bimbingan & Pengarahan',
				Icon: FeedOutlinedIcon,
				href: '/data-karyawan/bimbingan-pengarahan',
			},
			{
				id: uuid(),
				type: 'item',
				title: 'Data Surat Peringatan',
				Icon: ReportGmailerrorredOutlinedIcon,
				href: '/data-karyawan/data-surat-peringatan',
			},
			{
				id: uuid(),
				type: 'item',
				title: 'Lisensi & Sertifikasi',
				Icon: DescriptionOutlinedIcon,
				href: '/data-karyawan/lisensi-sertifikasi',
			},
			{
				id: uuid(),
				type: 'item',
				title: 'Pelatihan Karyawan',
				Icon: CastForEducationOutlinedIcon,
				href: '/data-karyawan/pelatihan-karyawan',
			},
			{
				id: uuid(),
				type: 'item',
				title: 'Cuti Karyawan',
				Icon: DescriptionOutlinedIcon,
				href: '/data-karyawan/cuti-karyawan',
			},
		],
	},
	{
		id: uuid(),
		type: 'group',
		title: 'Data Unit',
		Icon: LocalShippingOutlinedIcon,
		menuMinWidth: 260,
		menuChildren: [
			{
				id: uuid(),
				type: 'item',
				title: 'Lisensi & Sertifikasi Unit',
				Icon: DescriptionOutlinedIcon,
				href: '/data-unit/lisensi-sertifikasi-unit',
			},
		],
	},
];

export default NAV_LINKS_CONFIG;
