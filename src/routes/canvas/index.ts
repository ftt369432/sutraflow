/**
 * Canvas Routes Configuration
 * Entry point for all canvas-related routes
 */

import type { RouteObject } from 'react-router-dom';

export const canvasRoutes: RouteObject[] = [
  {
    path: '/canvas',
    children: [
      {
        index: true,
        async lazy() {
          const { UnifiedCanvasSystem } = await import('../../components/canvas/UnifiedCanvasSystem');
          return { Component: UnifiedCanvasSystem };
        },
      },
    ],
  },
];

export default canvasRoutes;