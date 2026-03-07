import { defineConfig } from '@apps-in-toss/web-framework/config'

export default defineConfig({
  appName: 'spoon-forge',
  brand: {
    displayName: '숟가락 대장간',
    primaryColor: '#0064FF',
    icon: '',
  },
  web: {
    host: 'localhost',
    port: 3000,
    commands: {
      dev: 'next dev',
      build: 'next build',
    },
  },
  outdir: '.next',
  webViewProps: {
    type: 'partner',
    bounces: false,
    pullToRefreshEnabled: false,
    mediaPlaybackRequiresUserAction: false,
  },
  permissions: ['admob'],
})
