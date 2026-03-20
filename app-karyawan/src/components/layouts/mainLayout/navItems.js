import { v4 as uuid } from 'uuid';

import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import FeedOutlinedIcon from '@mui/icons-material/FeedOutlined';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import ReportGmailerrorredOutlinedIcon from '@mui/icons-material/ReportGmailerrorredOutlined';
import SettingsApplicationsOutlinedIcon from '@mui/icons-material/SettingsApplicationsOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';

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
		type: 'group',
		title: 'Data Master',
		Icon: SettingsApplicationsOutlinedIcon,
		menuMinWidth: 220,
		menuChildren: [
			{
				id: uuid(),
				type: 'group',
				title: 'Master Data Karyawan',
				Icon: BadgeOutlinedIcon,
				menuChildren: [
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
						title: 'Master Karyawan',
						Icon: PeopleAltOutlinedIcon,
						href: '/data-master/master-data-karyawan/employees',
					},
					{
						id: uuid(),
						type: 'item',
						title: 'Master Work Location',
						Icon: BusinessOutlinedIcon,
						href: '/data-master/master-data-karyawan/work-locations',
					},
					{
						id: uuid(),
						type: 'item',
						title: 'Master Department',
						Icon: ApartmentOutlinedIcon,
						href: '/data-master/master-data-karyawan/departments',
					},
					{
						id: uuid(),
						type: 'item',
						title: 'Master Job Role',
						Icon: BadgeOutlinedIcon,
						href: '/data-master/master-data-karyawan/job-roles',
					},
					{
						id: uuid(),
						type: 'item',
						title: 'Master Job Level',
						Icon: LayersOutlinedIcon,
						href: '/data-master/master-data-karyawan/job-levels',
					},
					{
						id: uuid(),
						type: 'item',
						title: 'Master Group Shift',
						Icon: BadgeOutlinedIcon,
						href: '/data-master/master-data-karyawan/group-shifts',
					},
				],
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
				type: 'group',
				title: 'Cuti Karyawan',
				Icon: DescriptionOutlinedIcon,
				menuChildren: [
					{
						id: uuid(),
						type: 'item',
						title: 'Data Cuti Karyawan',
						Icon: DescriptionOutlinedIcon,
						href: '/data-karyawan/cuti-karyawan',
					},
					{
						id: uuid(),
						type: 'item',
						title: 'Flow Proses Cuti',
						Icon: DescriptionOutlinedIcon,
						href: '/data-karyawan/cuti-karyawan/flow',
					},
				],
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
