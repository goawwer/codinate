package status

import (
	"reflect"

	"github.com/goawwer/codinate/internal/adapter/dto/shared"
	"github.com/goawwer/codinate/internal/adapter/model/enum"
	"github.com/goawwer/codinate/internal/controller/ui"
)

func Register() {
	ui.RegisterGet("/task/statuses", enum.AnyUser, reflect.TypeOf(service{}), getTaskStatuses)
	ui.RegisterPost("/task/statuses/add", enum.AtLeastAdmin, reflect.TypeOf(service{}), addTaskStatus)
	ui.RegisterPatch("/task/statuses/update/{id}", enum.AtLeastAdmin, reflect.TypeOf(service{}), updateStatusById)
	ui.RegisterDelete("/task/statuses/delete/{id}", enum.AtLeastAdmin, reflect.TypeOf(service{}), deleteStatusById)
	ui.RegisterDelete("/task/statuses/delete/all", enum.AtLeastOwner, reflect.TypeOf(service{}), deleteAllStatuses)
}

// getTaskStatuses
//
//	@Tags			task/status
//	@Summary		Get statuses
//	@Description	Get all task statuses
//	@Accept			json
//	@Produce		json
//	@Success		200	{object}	nil
//	@Failure		500	{object}	string	"Internal Server Error"
//	@Router			/api/task/statuses  [get]
func getTaskStatuses(s ui.UIService) (any, error) {
	return s.GetService().(*service).getStatuses(s.GetRequest().Context())
}

// addTaskStatus
//
//	@Tags			task/status
//	@Summary		Add status
//	@Description	Post body with status name
//	@Accept			json
//	@Produce		json
//	@Param			request	body		shared.NameInput	true	"Body with status name"
//	@Success		200		{object}	nil
//	@Failure		400		{object}	string	"Bad Request"
//	@Failure		500		{object}	string	"Internal Server Error"
//	@Router			/api/task/statuses/add  [post]
func addTaskStatus(s ui.UIService) (any, error) {
	var input shared.NameInput

	if err := s.GetBodyAs(&input); err != nil {
		return nil, err
	}

	return nil, s.GetService().(*service).addStatus(s.GetRequest().Context(), input.Name)
}

// updateStatusById
//
//	@Tags			task/status
//	@Summary		Update status
//	@Description	Update task status name by id
//	@Accept			json
//	@Produce		json
//	@Param			id		path		int					true	"Status ID"
//	@Param			request	body		shared.NameInput	true	"Body with new status name"
//	@Success		200		{object}	nil
//	@Failure		400		{object}	string	"Bad Request"
//	@Failure		500		{object}	string	"Internal Server Error"
//	@Router			/api/task/statuses/update/{id}  [patch]
func updateStatusById(s ui.UIService) (any, error) {
	id, err := s.GetPathParamAsInt("id")
	if err != nil {
		return nil, err
	}

	var input shared.NameInput

	if err := s.GetBodyAs(&input); err != nil {
		return nil, err
	}

	return nil, s.GetService().(*service).updateStatus(s.GetRequest().Context(), id, input.Name)
}

// deleteStatusById
//
//	@Tags			task/status
//	@Summary		Delete status
//	@Description	Delete task status by id
//	@Accept			json
//	@Produce		json
//	@Param			id	path		int	true	"Status ID"
//	@Success		200	{object}	nil
//	@Failure		400	{object}	string	"Bad Request"
//	@Failure		500	{object}	string	"Internal Server Error"
//	@Router			/api/task/statuses/delete/{id}  [delete]
func deleteStatusById(s ui.UIService) (any, error) {
	id, err := s.GetPathParamAsInt("id")
	if err != nil {
		return nil, err
	}

	return nil, s.GetService().(*service).deleteStatusById(s.GetRequest().Context(), id)
}

// deleteAllStatuses
//
//	@Tags			task/status
//	@Summary		Delete all statuses
//	@Description	Delete all task statuses
//	@Accept			json
//	@Produce		json
//	@Success		200	{object}	nil
//	@Failure		500	{object}	string	"Internal Server Error"
//	@Router			/api/task/statuses/delete/all  [delete]
func deleteAllStatuses(s ui.UIService) (any, error) {
	return nil, s.GetService().(*service).deleteAllTaskStatuses(s.GetRequest().Context())
}
