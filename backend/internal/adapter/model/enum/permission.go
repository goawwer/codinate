package enum

type PermissionRole string

const (
	OwnerPermissionRole PermissionRole = "owner"
	AdminPermissionRole PermissionRole = "admin"
	UserPermissionRole  PermissionRole = "user"
	NoPermissionRole    PermissionRole = ""
)

var AtLeastOwner = []PermissionRole{OwnerPermissionRole}
var AtLeastAdmin = []PermissionRole{OwnerPermissionRole, AdminPermissionRole}
var AnyUser = []PermissionRole{UserPermissionRole, AdminPermissionRole, OwnerPermissionRole}
