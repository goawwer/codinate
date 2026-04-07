export const enum EnumUserRole {
  OwnerRole = 'owner',
  AdminRole = 'admin',
  UserRole = 'user',
}

export const AT_LEAST_OWNER: EnumUserRole[] = [EnumUserRole.OwnerRole];
export const AT_LEAST_ADMIN: EnumUserRole[] = [EnumUserRole.OwnerRole, EnumUserRole.AdminRole];
export const ANY_USER: EnumUserRole[] = [
  EnumUserRole.OwnerRole,
  EnumUserRole.AdminRole,
  EnumUserRole.UserRole,
];
