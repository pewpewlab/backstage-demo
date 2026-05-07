import { createApp } from '@backstage/frontend-defaults';
import catalogPlugin from '@backstage/plugin-catalog/alpha';
import notificationsPlugin from '@backstage/plugin-notifications/alpha';
import signalsPlugin from '@backstage/plugin-signals/alpha';
import userSettingsPlugin from '@backstage/plugin-user-settings/alpha';
import scaffolderPlugin from '@backstage/plugin-scaffolder/alpha';
import searchPlugin from '@backstage/plugin-search/alpha';
import techdocsPlugin from '@backstage/plugin-techdocs/alpha';
import orgPlugin from '@backstage/plugin-org/alpha';
import apiDocsPlugin from '@backstage/plugin-api-docs/alpha';
import catalogImportPlugin from '@backstage/plugin-catalog-import/alpha';
import kubernetesPlugin from '@backstage/plugin-kubernetes/alpha';
import { navModule } from './modules/nav';
import { signInPageModule } from './modules/auth/signInPage';

export default createApp({
  features: [
    catalogPlugin,
    notificationsPlugin,
    signalsPlugin,
    userSettingsPlugin,
    scaffolderPlugin,
    searchPlugin,
    techdocsPlugin,
    orgPlugin,
    apiDocsPlugin,
    catalogImportPlugin,
    kubernetesPlugin,
    navModule,
    signInPageModule,
  ],
});