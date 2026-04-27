import { parseEntityRef } from '@backstage/catalog-model';
import {
  AuthorizeResult,
  isPermission,
  PolicyDecision,
} from '@backstage/plugin-permission-common';
import {
  PermissionPolicy,
  PolicyQuery,
  PolicyQueryUser,
} from '@backstage/plugin-permission-node';
import {
  catalogEntityDeletePermission,
  catalogEntityRefreshPermission,
  catalogLocationCreatePermission,
  catalogLocationDeletePermission,
} from '@backstage/plugin-catalog-common/alpha';

/**
 * A simple role-based permission policy.
 *
 * Roles are determined by Backstage group membership:
 *   - Group "admins"  → full access to everything.
 *   - Everyone else   → read access to all catalog entities; write/delete/mutate
 *                       actions are denied.
 *
 * To assign a user to the admins group, add them to the "admins" Group entity
 * in the catalog (see examples/org.yaml).
 */
export class RbacPermissionPolicy implements PermissionPolicy {
  async handle(
    request: PolicyQuery,
    user?: PolicyQueryUser,
  ): Promise<PolicyDecision> {
    const userGroups = this.getUserGroups(user);
    const isAdmin = userGroups.includes('admins');

    // Admins can do anything
    if (isAdmin) {
      return { result: AuthorizeResult.ALLOW };
    }

    // Deny catalog mutations for non-admins
    if (
      isPermission(request.permission, catalogEntityDeletePermission) ||
      isPermission(request.permission, catalogLocationCreatePermission) ||
      isPermission(request.permission, catalogLocationDeletePermission) ||
      isPermission(request.permission, catalogEntityRefreshPermission)
    ) {
      return { result: AuthorizeResult.DENY };
    }

    // Allow all catalog reads (browsing components, APIs, systems, etc.)
    // without ownership restrictions so users can discover the full catalog.
    // Only mutations (handled above) are denied for non-admins.
    return { result: AuthorizeResult.ALLOW };
  }

  private getUserGroups(user?: PolicyQueryUser): string[] {
    if (!user?.info) {
      return [];
    }
    // ownershipEntityRefs contains strings like "group:default/admins"
    // Use parseEntityRef to correctly handle any namespace, not just "default".
    return (user.info.ownershipEntityRefs ?? [])
      .filter(ref => ref.startsWith('group:'))
      .map(ref => {
        try {
          return parseEntityRef(ref).name;
        } catch {
          return '';
        }
      })
      .filter(Boolean);
  }
}
