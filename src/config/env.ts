export const env = {
  GATEWAY_BASE_URL: import.meta.env.VITE_GATEWAY_BASE_URL ?? '',
  
  // Service URLs
  USER_SERVICE_BASE_URL: import.meta.env.VITE_USER_BASE_URL ?? 'http://localhost:8085',
  AUTH_SERVICE_BASE_URL: import.meta.env.VITE_AUTH_BASE_URL ?? import.meta.env.VITE_USER_BASE_URL ?? 'http://localhost:8085',
  ORDER_SERVICE_BASE_URL: import.meta.env.VITE_ORDER_BASE_URL ?? 'http://localhost:8086',
  PRODUCT_SERVICE_BASE_URL: import.meta.env.VITE_PRODUCT_BASE_URL ?? 'http://localhost:8087',
  
  // API Configuration
  API_TIMEOUT_MS: Number(import.meta.env.VITE_API_TIMEOUT_MS ?? 15000),

  // PayHere Webhook Notification URL
  PAYHERE_NOTIFY_URL: import.meta.env.VITE_PAYHERE_NOTIFY_URL ?? 'https://deduct-divisibly-itinerary.ngrok-free.dev/api/v1/orders/payment/notify',
};
