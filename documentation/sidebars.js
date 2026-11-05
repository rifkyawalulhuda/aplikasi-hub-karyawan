/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  mainSidebar: [
    {
      type: 'doc',
      id: 'intro',
      label: 'Pengenalan',
    },
    {
      type: 'category',
      label: 'Memulai',
      items: [
        'getting-started/prerequisites',
        'getting-started/development-setup',
        'getting-started/env-configuration',
      ],
    },
    {
      type: 'category',
      label: 'Arsitektur',
      items: [
        'architecture/overview',
        'architecture/frontend',
        'architecture/backend',
        'architecture/database',
      ],
    },
    {
      type: 'category',
      label: 'Modul',
      items: [
        'modules/data-master',
        'modules/data-karyawan',
        'modules/data-unit',
        {
          type: 'category',
          label: 'Job Requirement',
          collapsed: true,
          items: [
            'modules/job-requirement/konsep-readiness',
            'modules/job-requirement/panduan-admin',
            'modules/job-requirement/referensi-api',
            'modules/job-requirement/model-data',
          ],
        },
        'modules/cuti-workflow',
        'modules/portal-mobile',
        'modules/notifikasi',
        'modules/pengaturan-email',
      ],
    },
    {
      type: 'category',
      label: 'API',
      items: ['api/endpoints'],
    },
    {
      type: 'category',
      label: 'Deployment',
      items: [
        'deployment/production-server',
        'deployment/cloudflare-tunnel',
        'deployment/troubleshooting',
      ],
    },
    {
      type: 'doc',
      id: 'contributing',
      label: 'Kontribusi',
    },
  ],
};

module.exports = sidebars;
