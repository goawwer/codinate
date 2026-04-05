package enum

type Role string

const (
	OwnerRole Role = "owner"
	AdminRole Role = "admin"
	UserRole  Role = "user"
)

var AtLeastOnwer = []string{string(OwnerRole)}
var AtLeastAdmin = []string{string(OwnerRole), string(AdminRole)}
var AnyUser = []string{string(UserRole), string(AdminRole), string(OwnerRole)}
