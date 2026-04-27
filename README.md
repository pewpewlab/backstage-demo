# [Backstage](https://backstage.io) – Development Platform

## Quick Start

```sh
yarn install
yarn start
```

---

## Auth Integration: GitHub & GitLab + RBAC

This Backstage instance is configured to support **GitHub OAuth**, **GitLab OAuth**, and **role-based access control (RBAC)** through the built-in Backstage permission framework.

---

### 1. GitHub OAuth Setup

#### 1a. Create a GitHub OAuth App

1. Go to **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**
   (or for an org: **Org Settings → Developer settings → OAuth Apps → New OAuth App**).
2. Fill in the form:
   | Field | Value |
   |---|---|
   | Application name | `Backstage (dev)` |
   | Homepage URL | `http://localhost:3000` |
   | Authorization callback URL | `http://localhost:7007/api/auth/github/handler/frame` |
3. Click **Register application**.
4. Copy the **Client ID** and generate a **Client Secret**.

#### 1b. Set environment variables

```sh
export AUTH_GITHUB_CLIENT_ID=<your-client-id>
export AUTH_GITHUB_CLIENT_SECRET=<your-client-secret>
```

#### 1c. How it works

- Backstage backend loads `@backstage/plugin-auth-backend-module-github-provider`.
- When a user clicks **Sign in with GitHub**, they are redirected to GitHub's OAuth consent page.
- GitHub redirects back to `http://localhost:7007/api/auth/github/handler/frame` with a code.
- The backend exchanges the code for an access token, resolves the GitHub user profile, and creates a Backstage session.
- By default, the GitHub login handle is matched against User entity names in the catalog. To enable catalog-based identity resolution, add User entities with `github.com/user-login` annotations to your catalog (or configure the `usernameMatchingUserEntityName` sign-in resolver in `app-config.yaml`).
- To restrict sign-in to members of a specific GitHub organisation, use `allowedOrganizations` (not `enterpriseInstanceUrl`, which is for GitHub Enterprise Server instances).

---

### 2. GitLab OAuth Setup

#### 2a. Create a GitLab Application

1. Go to **GitLab → User Settings (avatar) → Applications** (for a personal app)  
   or **GitLab → Admin → Applications** (for an instance-wide app).
2. Fill in the form:
   | Field | Value |
   |---|---|
   | Name | `Backstage (dev)` |
   | Redirect URI | `http://localhost:7007/api/auth/gitlab/handler/frame` |
   | Scopes | `read_user`, `openid`, `profile`, `email` |
3. Click **Save application**.
4. Copy the **Application ID** (Client ID) and **Secret** (Client Secret).

> **Self-hosted GitLab:** uncomment the `audience` key in `app-config.yaml` and set it to your GitLab instance URL, e.g. `https://gitlab.example.com`.

#### 2b. Set environment variables

```sh
export AUTH_GITLAB_CLIENT_ID=<your-application-id>
export AUTH_GITLAB_CLIENT_SECRET=<your-secret>
```

#### 2c. How it works

- Backstage backend loads `@backstage/plugin-auth-backend-module-gitlab-provider`.
- When a user clicks **Sign in with GitLab**, they are redirected to GitLab's OAuth consent page.
- GitLab redirects back to the configured Redirect URI with an authorization code.
- The backend exchanges the code for tokens, resolves the GitLab user profile, and creates a Backstage session.

---

### 3. Session Secret

Both OAuth providers require a session secret for cookie-based session management.

```sh
# Generate a secure random secret (at least 24 characters)
export AUTH_SESSION_SECRET=$(openssl rand -base64 32)
```

Add this to your `.env` file or deployment secrets.

---

### 4. RBAC (Role-Based Access Control)

#### 4a. How it works

RBAC is implemented via a custom `PermissionPolicy` in `packages/backend/src/permissions/policy.ts`.

| Role | Catalog group | Permissions |
|---|---|---|
| **Admin** | `group:default/admins` | Full access: read, create, refresh, delete |
| **Viewer** (default) | everyone else | Read-only: catalog reads are filtered to entities they own; mutations denied |

The policy is registered as a backend module in `packages/backend/src/permissions/module.ts` and wired into `packages/backend/src/index.ts`, replacing the default allow-all policy.

#### 4b. Assigning users to the admins group

Edit `examples/org.yaml` (or your own org catalog source) and add the user's Backstage entity name to the `admins` group's `members` list:

```yaml
apiVersion: backstage.io/v1alpha1
kind: Group
metadata:
  name: admins
spec:
  type: team
  children: []
  members:
    - alice   # must match the User entity name in the catalog
    - bob
```

> **Tip:** When a user signs in via GitHub/GitLab, Backstage resolves their identity to a User entity in the catalog. The User entity name is typically their GitHub/GitLab username (lowercased). Make sure the User entity exists in the catalog before granting admin access.

#### 4c. Adding User entities for GitHub/GitLab users

Example User entity for a GitHub user:

```yaml
apiVersion: backstage.io/v1alpha1
kind: User
metadata:
  name: alice   # must match the GitHub/GitLab username (lowercased)
  annotations:
    github.com/user-login: Alice   # GitHub login (case-insensitive)
spec:
  memberOf: [admins]
```

#### 4d. How sign-in resolution works end-to-end

1. User visits Backstage and is presented with the sign-in page.
2. They click **Sign in with GitHub** (or GitLab) and complete the OAuth flow.
3. The backend resolves their profile to a Backstage User entity (matched by login handle).
4. The session is stamped with the user's entity ref and their group memberships (`ownershipEntityRefs`).
5. Every API request carries the session token; the permission backend evaluates it against the RBAC policy.
6. The frontend hides/shows UI elements based on the permission decisions returned by the backend.

---

### 5. Environment Variables Summary

| Variable | Required | Description |
|---|---|---|
| `AUTH_SESSION_SECRET` | ✅ | Random secret for session cookies (min 24 chars) |
| `AUTH_GITHUB_CLIENT_ID` | ✅ for GitHub login | GitHub OAuth App client ID |
| `AUTH_GITHUB_CLIENT_SECRET` | ✅ for GitHub login | GitHub OAuth App client secret |
| `AUTH_GITLAB_CLIENT_ID` | ✅ for GitLab login | GitLab Application ID |
| `AUTH_GITLAB_CLIENT_SECRET` | ✅ for GitLab login | GitLab Application secret |
| `GITHUB_TOKEN` | Recommended | PAT for GitHub integrations/scaffolding |

---

### 6. Production Deployment Notes

- Update `app-config.production.yaml` to set the correct `app.baseUrl` and `backend.baseUrl`.
- Update OAuth callback URLs in GitHub/GitLab to use your production domain, e.g.:
  - `https://backstage.example.com/api/auth/github/handler/frame`
  - `https://backstage.example.com/api/auth/gitlab/handler/frame`
- The `auth.providers.github` and `auth.providers.gitlab` keys in `app-config.production.yaml` use the `production` environment key instead of `development`.
- Store all secrets as environment variables or use a secrets manager (Vault, AWS Secrets Manager, etc.).

