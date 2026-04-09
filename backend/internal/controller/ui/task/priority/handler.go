package priority

import (
	"reflect"

	"github.com/goawwer/codinate/internal/adapter/dto/shared"
	"github.com/goawwer/codinate/internal/adapter/model/enum"
	"github.com/goawwer/codinate/internal/controller/ui"
)

func Register() {
	ui.RegisterGet("/task/priorities", enum.AnyUser, reflect.TypeOf(service{}), getTaskPriorities)
	ui.RegisterPost("/task/priorities/add", enum.AtLeastAdmin, reflect.TypeOf(service{}), addTaskPriority)
	ui.RegisterPatch("/task/priorities/update/{id}", enum.AtLeastAdmin, reflect.TypeOf(service{}), updatePriorityById)
	ui.RegisterDelete("/task/priorities/delete/{id}", enum.AtLeastAdmin, reflect.TypeOf(service{}), delPriotiryById)
	ui.RegisterDelete("/task/priorities/delete/all", enum.AtLeastOwner, reflect.TypeOf(service{}), deletePriorities)
}

// getTaskPriorities
//
//	@Tags			task/priority
//	@Summary		Get priorities
//	@Description	Get all task priorities
//	@Accept			json
//	@Produce		json
//	@Success		200	{object}	nil
//	@Failure		500	{object}	string	"Internal Server Error"
//	@Router			/api/task/priorities  [get]
func getTaskPriorities(s ui.UIService) (any, error) {
	return s.GetService().(*service).getPriorities(s.GetRequest().Context())
}

// addTaskPriority
//
//	@Tags			task/priority
//	@Summary		Add priority
//	@Description	Post body with priority name
//	@Accept			json
//	@Produce		json
//	@Param			request	body		shared.NameInput	true	"Body with priority name"
//	@Success		200		{object}	nil
//	@Failure		400		{object}	string	"Bad Request"
//	@Failure		500		{object}	string	"Internal Server Error"
//	@Router			/api/task/priorities/add  [post]
func addTaskPriority(s ui.UIService) (any, error) {
	var input shared.NameInput

	if err := s.GetBodyAs(&input); err != nil {
		return nil, err
	}

	return nil, s.GetService().(*service).addPriority(s.GetRequest().Context(), input.Name)
}

// updatePriorityById
//
//	@Tags			task/priority
//	@Summary		Update priority
//	@Description	Update task priority name by id
//	@Accept			json
//	@Produce		json
//	@Param			id		path		int				true	"Priority ID"
//	@Param			request	body		shared.NameInput	true	"Body with new priority name"
//	@Success		200		{object}	nil
//	@Failure		400		{object}	string	"Bad Request"
//	@Failure		500		{object}	string	"Internal Server Error"
//	@Router			/api/task/priorities/update/{id}  [patch]
func updatePriorityById(s ui.UIService) (any, error) {
	id, err := s.GetPathParamAsInt("id")
	if err != nil {
		return nil, err
	}

	var input shared.NameInput

	if err := s.GetBodyAs(&input); err != nil {
		return nil, err
	}

	return nil, s.GetService().(*service).updatePriority(s.GetRequest().Context(), id, input.Name)
}

// delEmployeeRoleById
//
//	@Tags			task/priority
//	@Summary		Delete priority
//	@Description	Delete task priority by id
//	@Accept			json
//	@Produce		json
//	@Param			id	path		int	true	"Priority ID"
//	@Success		200	{object}	nil
//	@Failure		400	{object}	string	"Bad Request"
//	@Failure		500	{object}	string	"Internal Server Error"
//	@Router			/api/task/priorities/delete/{id}  [delete]
func delPriotiryById(s ui.UIService) (any, error) {
	id, err := s.GetPathParamAsInt("id")
	if err != nil {
		return nil, err
	}

	return nil, s.GetService().(*service).deletePriorityById(s.GetRequest().Context(), id)
}

// deleteEmployeeRoles
//
//	@Tags			task/priority
//	@Summary		Delete all priorities
//	@Description	Delete all task priorities
//	@Accept			json
//	@Produce		json
//	@Success		200	{object}	nil
//	@Failure		500	{object}	string	"Internal Server Error"
//	@Router			/api/task/priorities/delete/all  [delete]
func deletePriorities(s ui.UIService) (any, error) {
	return nil, s.GetService().(*service).deleteAllTaskPriorities(s.GetRequest().Context())
}
