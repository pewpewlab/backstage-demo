// This is configuration for Sign-In Configuration page in backstage app 
// please refer to `https://backstage.io/docs/auth/#sign-in-configuration`
// import React from 'react';
import { createFrontendModule } from '@backstage/frontend-plugin-api';
import { SignInPageBlueprint } from '@backstage/plugin-app-react';
import { gitlabAuthApiRef, githubAuthApiRef } from '@backstage/core-plugin-api';
import { SignInPage } from '@backstage/core-components';

export const signInPageModule = createFrontendModule({
  pluginId: 'app',
  extensions: [
    SignInPageBlueprint.make({
      params: {
        loader: async () => props =>
          (
            <SignInPage
              {...props}
              providers={[
                {
                  id: 'gitlab-auth-provider',
                  title: 'GitLab',
                  message: 'Sign in with your GitLab account',
                  apiRef: gitlabAuthApiRef,
                },
                {
                  id: 'github-auth-provider',
                  title: 'GitHub',
                  message: 'Sign in with your GitHub account',
                  apiRef: githubAuthApiRef,
                },
              ]}
            />
          ),
      },
    }),
  ],
});
