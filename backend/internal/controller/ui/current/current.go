package current

import (
	"reflect"

	"github.com/goawwer/codinate/internal/adapter/models/enum"
	"github.com/goawwer/codinate/internal/controller/ui"
)

func Register() {
	ui.RegisterGet("/current/user", enum.AnyUser, reflect.TypeOf(currentService{}), getCurrentUser)
}

func getCurrentUser(s ui.UIService) (any, error) {
	return s.GetCurrentUser()
}
