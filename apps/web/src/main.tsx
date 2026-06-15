import '@workspace/ui/globals.css';
import { RegistryProvider } from '@effect/atom-react';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { Toaster } from '@workspace/ui/components/toast';
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';

import { routeTree } from './routeTree.gen';

const router = createRouter({
  routeTree,
  scrollRestoration: true,
  defaultPreload: 'intent',
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById('root');

if (!rootElement?.innerHTML) {
  const root = ReactDOM.createRoot(rootElement!);

  root.render(
    <StrictMode>
      <RegistryProvider>
        <RouterProvider router={router} />
        <Toaster />
      </RegistryProvider>
    </StrictMode>,
  );
}
