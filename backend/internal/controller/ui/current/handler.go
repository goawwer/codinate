package current

import (
	"reflect"

	"github.com/goawwer/codinate/internal/adapter/model/enum"
	"github.com/goawwer/codinate/internal/controller/ui"
)

func Register() {
	ui.RegisterGet("/current/user", enum.AnyUser, reflect.TypeOf(currentService{}), getCurrentUser)
}

// user
//
//	@Tags			current
//	@Summary		Get current user
//	@Description	Takes user from access token cookie
//	@Accept			json
//	@Produce		json
//	@Success		200	{object}	user.Row
//	@Failure		400	{object}	string	"Bad Request"
//	@Failure		500	{object}	string	"Internal Server Error"
//	@Router			/api/current/user  [get]
func getCurrentUser(s ui.UIService) (any, error) {
	return s.GetCurrentUser()
}
