// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const { themes } = require('prism-react-renderer');
const lightTheme = themes.github;
const darkTheme = themes.dracula;

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Hub Karyawan',
  tagline: 'Dokumentasi Aplikasi Internal Manajemen Karyawan',
  favicon: 'img/favicon.ico',

  url: 'https://rifkyawalulhuda.github.io',
  baseUrl: '/aplikasi-hub-karyawan/',

  organizationName: 'rifkyawalulhuda',
  projectName: 'aplikasi-hub-karyawan',
  trailingSlash: false,

  onBrokenLinks: 'warn',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  i18n: {
    defaultLocale: 'id',
    locales: ['id'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          routeBasePath: '/',
          editUrl:
            'https://github.com/rifkyawalulhuda/aplikasi-hub-karyawan/tree/master/documentation/',
        },
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/social-card.png',
      navbar: {
        title: 'Hub Karyawan',
        logo: {
          alt: 'Hub Karyawan Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'mainSidebar',
            position: 'left',
            label: 'Dokumentasi',
          },
          {
            href: 'https://github.com/rifkyawalulhuda/aplikasi-hub-karyawan',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Dokumentasi',
            items: [
              { label: 'Mulai', to: '/' },
              { label: 'Setup Development', to: '/getting-started/development-setup' },
              { label: 'Arsitektur', to: '/architecture/overview' },
            ],
          },
          {
            title: 'Modul',
            items: [
              { label: 'Data Master', to: '/modules/data-master' },
              { label: 'Workflow Cuti', to: '/modules/cuti-workflow' },
              { label: 'Portal Mobile', to: '/modules/portal-mobile' },
            ],
          },
          {
            title: 'Deployment',
            items: [
              { label: 'Production Server', to: '/deployment/production-server' },
              { label: 'Cloudflare Tunnel', to: '/deployment/cloudflare-tunnel' },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Hub Karyawan. Dibangun dengan Docusaurus.`,
      },
      prism: {
        theme: lightTheme,
        darkTheme: darkTheme,
        additionalLanguages: ['bash', 'json', 'yaml', 'ini', 'typescript', 'javascript'],
      },
      colorMode: {
        defaultMode: 'light',
        disableSwitch: false,
        respectPrefersColorScheme: true,
      },
    }),
};

module.exports = config;
