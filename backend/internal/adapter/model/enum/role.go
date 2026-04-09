package enum

type Role string

const (
	OwnerRole Role = "owner"
	AdminRole Role = "admin"
	UserRole  Role = "user"
	NoRole    Role = ""
)

var AtLeastOwner = []Role{OwnerRole}
var AtLeastAdmin = []Role{OwnerRole, AdminRole}
var AnyUser = []Role{UserRole, AdminRole, OwnerRole}
