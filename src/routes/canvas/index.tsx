/**
 * Canvas Routes - Centralized Route Configuration
 * 
 * Defines all canvas-related routes and lazy-loaded components
 * following the prompt guidelines for clean architecture.
 */

import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';

// Canvas Loading Component
const CanvasLoading = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

// Lazy load canvas components for better performance
const CanvasWorkspace = lazy(() => import('../../components/canvas/UnifiedCanvasSystem'));
const DocumentEditorPage = lazy(() => import('../../components/canvas/DocumentEditorLayout'));
const TemplateGallery = lazy(() => import('../../components/canvas/TemplateManager'));

/**
 * Canvas route definitions
 * All routes are prefixed with /canvas
 */
export const canvasRoutes: RouteObject[] = [
  {
    path: '/canvas',
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<CanvasLoading />}>
            <CanvasWorkspace />
          </Suspense>
        ),
      },
      {
        path: 'document/:documentId',
        element: (
          <Suspense fallback={<CanvasLoading />}>
            <DocumentEditorPage />
          </Suspense>
        ),
      },
      {
        path: 'document/:documentId/edit',
        element: (
          <Suspense fallback={<CanvasLoading />}>
            <DocumentEditorPage />
          </Suspense>
        ),
      },
      {
        path: 'templates',
        element: (
          <Suspense fallback={<CanvasLoading />}>
            <TemplateGallery />
          </Suspense>
        ),
      },
      {
        path: 'templates/:templateId',
        element: (
          <Suspense fallback={<CanvasLoading />}>
            <TemplateGallery />
          </Suspense>
        ),
      },
    ],
  },
];

/**
 * Route metadata for navigation and breadcrumbs
 */
export const canvasRouteMetadata = {
  '/canvas': {
    title: 'Canvas Workspace',
    description: 'Main canvas workspace for document creation',
    icon: 'layout',
    breadcrumb: 'Canvas',
  },
  '/canvas/document/:documentId': {
    title: 'Document Editor',
    description: 'Edit and manage canvas documents',
    icon: 'file-text',
    breadcrumb: 'Document',
  },
  '/canvas/templates': {
    title: 'Template Gallery',
    description: 'Browse and select document templates',
    icon: 'layout-template',
    breadcrumb: 'Templates',
  },
  '/canvas/workflows': {
    title: 'Workflow Manager',
    description: 'Manage automated workflows',
    icon: 'workflow',
    breadcrumb: 'Workflows',
  },
  '/canvas/agents': {
    title: 'Agent Dashboard',
    description: 'Monitor and manage AI agents',
    icon: 'bot',
    breadcrumb: 'Agents',
  },
};

/**
 * Navigation links for canvas section
 */
export const canvasNavigation = [
  {
    to: '/canvas',
    label: 'Workspace',
    icon: 'layout',
  },
  {
    to: '/canvas/templates',
    label: 'Templates',
    icon: 'layout-template',
  },
  {
    to: '/canvas/workflows',
    label: 'Workflows',
    icon: 'workflow',
  },
  {
    to: '/canvas/agents',
    label: 'Agents',
    icon: 'bot',
  },
];

/**
 * Route guards and permissions
 */
export const canvasRouteGuards = {
  '/canvas': {
    requiresAuth: true,
    permissions: ['canvas:read'],
  },
  '/canvas/document/:documentId': {
    requiresAuth: true,
    permissions: ['canvas:read', 'canvas:write'],
  },
  '/canvas/templates': {
    requiresAuth: true,
    permissions: ['canvas:read'],
  },
  '/canvas/workflows': {
    requiresAuth: true,
    permissions: ['canvas:read', 'workflow:execute'],
  },
  '/canvas/agents': {
    requiresAuth: true,
    permissions: ['canvas:read', 'agent:manage'],
  },
};

export default canvasRoutes;
