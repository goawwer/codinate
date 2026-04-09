package user

import (
	"reflect"

	"github.com/goawwer/codinate/internal/adapter/dto/user"
	"github.com/goawwer/codinate/internal/adapter/model/enum"
	"github.com/goawwer/codinate/internal/controller/ui"
	"github.com/google/uuid"
)

func Register() {
	ui.RegisterPost("/user/add", enum.AtLeastAdmin, reflect.TypeOf(service{}), create)
	ui.RegisterPatch("/user/update/{id}", enum.AtLeastAdmin, reflect.TypeOf(service{}), update)
	ui.RegisterDelete("/user/delete/{id}", enum.AtLeastAdmin, reflect.TypeOf(service{}), delete)
	ui.RegisterGet("/user/{id}", enum.AtLeastAdmin, reflect.TypeOf(service{}), getUser)
	ui.RegisterGet("/user/all", enum.AtLeastAdmin, reflect.TypeOf(service{}), getUsers)
}

// create
//
//	@Tags			user
//	@Summary		Create user
//	@Description	Creates a new user account
//	@Accept			json
//	@Produce		json
//	@Param			body	body	user.CreateInput	true	"User data"
//	@Success		200
//	@Failure		400	{object}	string	"Bad Request"
//	@Failure		500	{object}	string	"Internal Server Error"
//	@Router			/api/user/add [post]
func create(s ui.UIService) (any, error) {
	var input user.CreateInput

	if err := s.GetBodyAs(&input); err != nil {
		return nil, err
	}

	return nil, s.GetService().(*service).createNewUser(s.GetRequest().Context(), input)
}

// getUser
//
//	@Tags			user
//	@Summary		Get user by ID
//	@Description	Returns a single user by their UUID
//	@Produce		json
//	@Param			id	path		string	true	"User UUID"
//	@Success		200	{object}	user.Row
//	@Failure		400	{object}	string	"Bad Request"
//	@Failure		500	{object}	string	"Internal Server Error"
//	@Router			/api/user/{id} [get]
func getUser(s ui.UIService) (any, error) {
	id, err := s.GetPathParameterAsString("id")
	if err != nil {
		return nil, err
	}

	return s.GetService().(*service).getRow(s.GetRequest().Context(), id)
}

// getUsers
//
//	@Tags			user
//	@Summary		Get all users
//	@Description	Returns a list of all users
//	@Produce		json
//	@Success		200	{object}	[]user.Row
//	@Failure		500	{object}	string	"Internal Server Error"
//	@Router			/api/user/all [get]
func getUsers(s ui.UIService) (any, error) {
	return s.GetService().(*service).getRows(s.GetRequest().Context())
}

// update
//
//	@Tags			user
//	@Summary		Update user by ID
//	@Description	Updates only the provided fields of a user
//	@Accept			json
//	@Produce		json
//	@Param			id		path	string				true	"User UUID"
//	@Param			body	body	user.UpdateInput	true	"Fields to update"
//	@Success		200
//	@Failure		400	{object}	string	"Bad Request"
//	@Failure		500	{object}	string	"Internal Server Error"
//	@Router			/api/user/update/{id} [patch]
func update(s ui.UIService) (any, error) {
	id, err := s.GetPathParameterAsString("id")
	if err != nil {
		return nil, err
	}

	var input user.UpdateInput

	if err := s.GetBodyAs(&input); err != nil {
		return nil, err
	}

	return nil, s.GetService().(*service).updateUserById(s.GetRequest().Context(), id, input)
}

// delete
//
//	@Tags			user
//	@Summary		Delete user by ID
//	@Description	Deletes a user by their UUID
//	@Produce		json
//	@Param			id	path	string	true	"User UUID"
//	@Success		200
//	@Failure		400	{object}	string	"Bad Request"
//	@Failure		500	{object}	string	"Internal Server Error"
//	@Router			/api/user/delete/{id} [delete]
func delete(s ui.UIService) (any, error) {
	id, err := s.GetPathParameterAsString("id")
	if err != nil {
		return nil, err
	}

	return nil, s.GetService().(*service).deleteUserById(s.GetRequest().Context(), uuid.MustParse(id))
}
