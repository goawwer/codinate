package dto

import "github.com/goawwer/codinate/internal/adapter/model/enum"

func ResolveUserRole(role string) enum.PermissionRole {
	switch role {
	case "owner":
		return enum.OwnerPermissionRole
	case "admin":
		return enum.AdminPermissionRole
	case "user":
		return enum.UserPermissionRole
	default:
		return enum.NoPermissionRole
	}
}
