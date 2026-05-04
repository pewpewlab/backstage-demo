import { createBackendModule } from '@backstage/backend-plugin-api';
import { policyExtensionPoint } from '@backstage/plugin-permission-node/alpha';
import { RbacPermissionPolicy } from './policy';

/**
 * Backend module that registers the custom RBAC permission policy.
 *
 * Add this module to the backend in place of
 * `@backstage/plugin-permission-backend-module-allow-all-policy`.
 */
const permissionModuleRbacPolicy = createBackendModule({
  pluginId: 'permission',
  moduleId: 'rbac-policy',
  register(reg) {
    reg.registerInit({
      deps: { policy: policyExtensionPoint },
      async init({ policy }) {
        policy.setPolicy(new RbacPermissionPolicy());
      },
    });
  },
});

export default permissionModuleRbacPolicy;
