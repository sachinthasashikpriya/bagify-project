// src/api/serviceRegistry.ts
//
// All requests now go through the API Gateway on port 8080.
// The gateway routes to the correct downstream service automatically based on the path:
//   /api/v1/auth/**     → user service    (:8085)
//   /api/v1/users/**    → user service    (:8085)
//   /api/v1/products/** → product service (:8082)
//   /api/v1/orders/**   → order service   (:8083)
//
// During development (before api-gateway is running), you can temporarily
// revert to direct service ports by changing GATEWAY_BASE_URL.

import { env } from '../config/env';

export type ServiceName =
  | 'user-service'
  | 'auth-service'
  | 'order-service'
  | 'product-service';

const GATEWAY_BASE_URL = env.GATEWAY_BASE_URL || 'http://localhost:8080';

/**
 * All services route through the single API Gateway URL.
 * This eliminates the anti-pattern of the frontend knowing individual service ports.
 */
export const serviceRegistry: Record<ServiceName, string> = {
  'user-service':    GATEWAY_BASE_URL,
  'auth-service':    GATEWAY_BASE_URL,
  'order-service':   GATEWAY_BASE_URL,
  'product-service': GATEWAY_BASE_URL,
};