import { v4 as uuid } from 'uuid';

import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import SettingsApplicationsOutlinedIcon from '@mui/icons-material/SettingsApplicationsOutlined';

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
				],
			},
		],
	},
];

export default NAV_LINKS_CONFIG;
