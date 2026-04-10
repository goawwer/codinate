package router

import (
	"github.com/goawwer/codinate/internal/controller/ui/current"
	"github.com/goawwer/codinate/internal/controller/ui/employee"
	"github.com/goawwer/codinate/internal/controller/ui/task/priority"
	"github.com/goawwer/codinate/internal/controller/ui/task/status"
	"github.com/goawwer/codinate/internal/controller/ui/user"
)

func init() {
	current.Register()
	employee.Register()
	priority.Register()
	status.Register()
	user.Register()
}
