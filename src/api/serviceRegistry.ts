// src/api/serviceRegistry.ts
import { env } from '../config/env';

export type ServiceName = 'user-service' | 'order-service' | 'product-service'|'auth-service';

export const serviceRegistry: Record<ServiceName, string> = {
  'user-service': env.USER_SERVICE_BASE_URL || 'http://localhost:8085',
  'auth-service': env.USER_SERVICE_BASE_URL || 'http://localhost:8085',
  'order-service': env.ORDER_SERVICE_BASE_URL || 'http://localhost:8086',
  'product-service': env.PRODUCT_SERVICE_BASE_URL || 'http://localhost:8087',
};