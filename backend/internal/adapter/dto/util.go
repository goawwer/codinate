package dto

import "github.com/goawwer/codinate/internal/adapter/model/enum"

func ResolveUserRole(role string) enum.Role {
	switch role {
	case "owner":
		return enum.OwnerRole
	case "admin":
		return enum.AdminRole
	case "user":
		return enum.UserRole
	default:
		return enum.NoRole
	}
}
