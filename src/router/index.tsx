import { createBrowserRouter } from 'react-router-dom'
import TemplatesListPage from '@/pages/TemplatesListPage'
import BuilderPage from '@/pages/BuilderPage'
import FillPage from '@/pages/FillPage'
import InstancesListPage from '@/pages/InstancesListPage'
import NotFoundPage from '@/pages/NotFoundPage'

export const router = createBrowserRouter([
  { path: '/', element: <TemplatesListPage /> },
  { path: '/builder/new', element: <BuilderPage /> },
  { path: '/builder/:templateId', element: <BuilderPage /> },
  { path: '/fill/:templateId', element: <FillPage /> },
  { path: '/templates/:templateId/responses', element: <InstancesListPage /> },
  { path: '*', element: <NotFoundPage /> },
])
