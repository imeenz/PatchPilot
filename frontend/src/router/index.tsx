import { createBrowserRouter } from 'react-router-dom';
import { PublicLayout } from '@/layouts/PublicLayout';
import { WorkspaceLayout } from '@/layouts/WorkspaceLayout';
import { LandingPage } from '@/pages/LandingPage';
import { LoadingState } from '@/components/ui/StateViews';

// Workspace pages are code-split so the public landing page stays light.
export const router = createBrowserRouter([
  {
    // Public experience
    element: <PublicLayout />,
    children: [{ path: '/', element: <LandingPage /> }],
  },
  {
    // Security workspace
    element: <WorkspaceLayout />,
    hydrateFallbackElement: <LoadingState />,
    children: [
      { path: '/overview', lazy: () => import('@/pages/OverviewPage').then((m) => ({ Component: m.OverviewPage })) },
      { path: '/assistant', lazy: () => import('@/pages/AssistantPage').then((m) => ({ Component: m.AssistantPage })) },
      { path: '/vulnerabilities', lazy: () => import('@/pages/VulnerabilitiesPage').then((m) => ({ Component: m.VulnerabilitiesPage })) },
      { path: '/vulnerabilities/:id', lazy: () => import('@/pages/FindingDetailPage').then((m) => ({ Component: m.FindingDetailPage })) },
      { path: '/tasks', lazy: () => import('@/pages/TasksPage').then((m) => ({ Component: m.TasksPage })) },
      { path: '/verification', lazy: () => import('@/pages/VerificationPage').then((m) => ({ Component: m.VerificationPage })) },
      { path: '/settings', lazy: () => import('@/pages/SettingsPage').then((m) => ({ Component: m.SettingsPage })) },
      { path: '*', lazy: () => import('@/pages/NotFoundPage').then((m) => ({ Component: m.NotFoundPage })) },
    ],
  },
]);
