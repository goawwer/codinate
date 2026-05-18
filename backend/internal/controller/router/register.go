package router

import (
	"github.com/goawwer/codinate/internal/controller/public/pictures"
	"github.com/goawwer/codinate/internal/controller/ui/comment"
	"github.com/goawwer/codinate/internal/controller/ui/current"
	"github.com/goawwer/codinate/internal/controller/ui/employee"
	"github.com/goawwer/codinate/internal/controller/ui/file"
	"github.com/goawwer/codinate/internal/controller/ui/notification"
	"github.com/goawwer/codinate/internal/controller/ui/post"
	"github.com/goawwer/codinate/internal/controller/ui/project"
	"github.com/goawwer/codinate/internal/controller/ui/task/categories"
	"github.com/goawwer/codinate/internal/controller/ui/task/priority"
	"github.com/goawwer/codinate/internal/controller/ui/task/status"
	"github.com/goawwer/codinate/internal/controller/ui/task/tasks"
	"github.com/goawwer/codinate/internal/controller/ui/team"
	"github.com/goawwer/codinate/internal/controller/ui/user"
	"github.com/goawwer/codinate/internal/controller/ui/worklog"
)

func init() {
	current.Register()
	employee.Register()
	priority.Register()
	status.Register()
	user.Register()
	team.Register()
	project.Register()
	categories.Register()
	tasks.Register()
	file.Register()
	comment.Register()
	worklog.Register()
	post.Register()
	notification.Register()

	// public
	pictures.Register()
}
