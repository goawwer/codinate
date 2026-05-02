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

func ResolveReleaseStatus(status string) enum.ReleaseStatus {
	switch status {
	case "active":
		return enum.ReleaseStatusActive
	case "finished":
		return enum.ReleaseStatusFinished
	case "closed":
		return enum.ReleaseStatusClosed
	case "archived":
		return enum.ReleaseStatusArchived
	}

	return ""
}

func ResolveCommentEntityType(entity string) enum.CommentEntityType {
	switch entity {
	case "task":
		return enum.TaskCommentEntity
	case "post":
		return enum.PostCommentEntity
	}

	return ""
}
