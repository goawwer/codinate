export const enum EnumPermissionRole {
  OwnerRole = 'owner',
  AdminRole = 'admin',
  UserRole = 'user',
}

export const AT_LEAST_OWNER: EnumPermissionRole[] = [EnumPermissionRole.OwnerRole];
export const AT_LEAST_ADMIN: EnumPermissionRole[] = [
  EnumPermissionRole.OwnerRole,
  EnumPermissionRole.AdminRole,
];
export const ANY_USER: EnumPermissionRole[] = [
  EnumPermissionRole.OwnerRole,
  EnumPermissionRole.AdminRole,
  EnumPermissionRole.UserRole,
];
