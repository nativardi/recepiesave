// Description: Development bypass user for testing without authentication

export const DEV_USER = {
  id: "dev-user-uuid-12345",
  email: "dev@saveit.local",
  full_name: "Dev User",
  avatar_url: "/placeholder-avatar.png",
};

export type DevUser = typeof DEV_USER;
