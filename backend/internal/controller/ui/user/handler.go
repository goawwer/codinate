package user

import (
	"reflect"

	"github.com/goawwer/codinate/internal/adapter/dto/user"
	"github.com/goawwer/codinate/internal/adapter/model/enum"
	"github.com/goawwer/codinate/internal/controller/ui"
	"github.com/google/uuid"
)

func Register() {
	ui.RegisterPost("/users/add", enum.AtLeastAdmin, reflect.TypeOf(service{}), create)
	ui.RegisterPatch("/users/update/{id}", enum.AtLeastAdmin, reflect.TypeOf(service{}), update)
	ui.RegisterDelete("/users/delete/{id}", enum.AtLeastAdmin, reflect.TypeOf(service{}), delete)
	ui.RegisterDelete("/users/delete", enum.AtLeastAdmin, reflect.TypeOf(service{}), deleteMany)
	ui.RegisterGet("/users/{id}", enum.AtLeastAdmin, reflect.TypeOf(service{}), getUser)
	ui.RegisterGet("/users/all", enum.AtLeastAdmin, reflect.TypeOf(service{}), getUsers)

	// profile
	ui.RegisterGet("/users/profile/{user_id}", enum.AnyUser, reflect.TypeOf(service{}), profile)
	// ui.RegisterPatch("/users/profile/{user_id}", enum.AnyUser, reflect.TypeOf(service{}), updateProfile)
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
//	@Param			orderBy		query		string	false	"filter column"
//	@Param			order		query		string	false	"filter value"
//	@Param			disabled	query		bool	false	"filter by user state"
//	@Success		200			{object}	[]user.Row
//	@Failure		500			{object}	string	"Internal Server Error"
//	@Router			/api/user/all [get]
func getUsers(s ui.UIService) (any, error) {
	f, err := parseFilterParams(s)
	if err != nil {
		return nil, err
	}

	return s.GetService().(*service).getRows(s.GetRequest().Context(), f)
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

// deleteMany
//
//	@Tags			user
//	@Summary		Delete multiple users
//	@Description	Deletes multiple users by their UUIDs
//	@Accept			json
//	@Produce		json
//	@Param			body	body	user.DeleteMultiInput	true	"List of user UUIDs"
//	@Success		200
//	@Failure		400	{object}	string	"Bad Request"
//	@Failure		500	{object}	string	"Internal Server Error"
//	@Router			/api/user/delete [delete]
func deleteMany(s ui.UIService) (any, error) {
	var input user.DeleteMultiInput

	if err := s.GetBodyAs(&input); err != nil {
		return nil, err
	}

	return nil, s.GetService().(*service).deleteUsersByIds(s.GetRequest().Context(), input.IDs)
}

func profile(s ui.UIService) (any, error) {
	userId, err := s.GetPathParameterAsString("user_id")
	if err != nil {
		return nil, err
	}

	return s.GetService().(*service).getUserProfileBy(s.GetRequest().Context(), uuid.MustParse(userId))
}

/*
	func updateProfile(s ui.UIService) (any, error) {
		user_id, err := s.GetPathParameterAsString("user_id")
		if err != nil {
			return nil, err
		}

		currentUser, err := s.GetCurrentUser()
		if err != nil {
			return nil, err
		}

		var
	}
*/
func parseFilterParams(s ui.UIService) (*user.Filters, error) {
	var f ui.FilterService[user.DashBoardInput, user.Filters]

	return f.GetResolvedFilters(s, (*user.DashBoardInput).ResolveFilters)
}
