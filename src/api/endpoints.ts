export const endpoints = {
    auth: {
      register: '/api/v1/auth/register',  // POST - no token returned
      login: '/api/v1/auth/login',        // POST - returns { token: "...", refreshToken: "..." }
      refresh: '/api/v1/auth/refresh',    // POST - returns { token: "...", refreshToken: "..." }
      forgotPassword: '/api/v1/auth/forgot-password', // POST
      resetPassword: '/api/v1/auth/reset-password',   // POST
    },
    users: {
      me: '/api/v1/users/me',               // GET - returns current user
      profile: '/api/v1/users/profile',       // GET
      updateProfile: '/api/v1/users/profile', // PUT
      changePassword: '/api/v1/users/change-password', // POST
      verification: '/api/v1/users/profile/verification', // POST
      getAll: '/api/v1/users',              // GET - returns all users (Admin only)
      disable: (id: number | string) => `/api/v1/users/${id}/disable`,
      enable: (id: number | string) => `/api/v1/users/${id}/enable`,
    },
    admin: {
      verifications: '/api/v1/admin/verifications',
      reviewVerification: (sellerId: number | string) => `/api/v1/admin/verifications/${sellerId}`,
    },
  } as const;