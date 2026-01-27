export const endpoints = {
    auth: {
      register: '/auth/register',  // POST - no token returned
      login: '/auth/login',        // POST - returns { token: "..." }
    },
    users: {
      profile: '/api/users/profile',       // GET
      updateProfile: '/api/users/profile', // PUT
    },
  } as const;