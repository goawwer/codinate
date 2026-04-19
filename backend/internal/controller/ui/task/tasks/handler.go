package tasks

import (
	"reflect"

	"github.com/goawwer/codinate/internal/adapter/dto/task"
	"github.com/goawwer/codinate/internal/adapter/model/enum"
	"github.com/goawwer/codinate/internal/controller/ui"
	"github.com/google/uuid"
)

func Register() {
	ui.RegisterGet("/tasks/{id}", enum.AnyUser, reflect.TypeOf(service{}), getById)
	ui.RegisterGet("/tasks", enum.AnyUser, reflect.TypeOf(service{}), getAll)
	ui.RegisterPost("/tasks/add", enum.AnyUser, reflect.TypeOf(service{}), add)
	ui.RegisterPatch("/tasks/{id}/update", enum.AnyUser, reflect.TypeOf(service{}), update)
	ui.RegisterPost("/tasks/{id}/close", enum.AnyUser, reflect.TypeOf(service{}), close)
	ui.RegisterDelete("/tasks/{id}/delete", enum.AnyUser, reflect.TypeOf(service{}), deleteById)
}

// getById
//
//	@Tags		tasks
//	@Summary	Get task by ID
//	@Description	Returns detailed information about a task
//	@Produce	json
//	@Param		id	path		string	true	"Task UUID"
//	@Success	200	{object}	task.RowDetailed
//	@Failure	400	{object}	string	"Bad Request"
//	@Failure	500	{object}	string	"Internal Server Error"
//	@Router		/api/tasks/{id} [get]
func getById(s ui.UIService) (any, error) {
	id, err := s.GetPathParameterAsString("id")
	if err != nil {
		return nil, err
	}

	return s.GetService().(*service).getTaskById(s.GetRequest().Context(), uuid.MustParse(id))
}

// getAll
//
//	@Tags		tasks
//	@Summary	Get all tasks
//	@Description	Returns a list of all tasks
//	@Produce	json
//	@Success	200	{object}	[]task.Row
//	@Failure	500	{object}	string	"Internal Server Error"
//	@Router		/api/tasks [get]
func getAll(s ui.UIService) (any, error) {
	filters, err := parseFilterParams(s)
	if err != nil {
		return nil, err
	}

	return s.GetService().(*service).getAllTasks(s.GetRequest().Context(), filters)
}

// add
//
//	@Tags		tasks
//	@Summary	Create task
//	@Description	Creates a new task, identifier is auto-generated from the release ID
//	@Accept		json
//	@Produce	json
//	@Param		payload	body		task.CreateTaskInput	true	"Task data"
//	@Success	200	{object}	shared.IdOutput
//	@Failure	400	{object}	string	"Bad Request"
//	@Failure	500	{object}	string	"Internal Server Error"
//	@Router		/api/tasks/add [post]
func add(s ui.UIService) (any, error) {
	var input task.CreateTaskInput

	if err := s.GetBodyAs(&input); err != nil {
		return nil, err
	}

	return s.GetService().(*service).addTask(s.GetRequest().Context(), input)
}

// update
//
//	@Tags		tasks
//	@Summary	Update task
//	@Description	Updates fields of an existing task
//	@Accept		json
//	@Produce	json
//	@Param		id		path		string				true	"Task UUID"
//	@Param		payload	body		task.UpdateTaskInput	true	"Fields to update"
//	@Success	200
//	@Failure	400	{object}	string	"Bad Request"
//	@Failure	500	{object}	string	"Internal Server Error"
//	@Router		/api/tasks/{id}/update [patch]
func update(s ui.UIService) (any, error) {
	id, err := s.GetPathParameterAsString("id")
	if err != nil {
		return nil, err
	}

	var input task.UpdateTaskInput

	if err := s.GetBodyAs(&input); err != nil {
		return nil, err
	}

	return nil, s.GetService().(*service).updateTask(s.GetRequest().Context(), input, uuid.MustParse(id))
}

// close
//
//	@Tags		tasks
//	@Summary	Close task
//	@Description	Marks a task as closed by setting its closed_at timestamp
//	@Produce	json
//	@Param		id	path	string	true	"Task UUID"
//	@Success	200
//	@Failure	400	{object}	string	"Bad Request"
//	@Failure	500	{object}	string	"Internal Server Error"
//	@Router		/api/tasks/{id}/close [post]
func close(s ui.UIService) (any, error) {
	id, err := s.GetPathParameterAsString("id")
	if err != nil {
		return nil, err
	}

	return nil, s.GetService().(*service).closeTask(s.GetRequest().Context(), uuid.MustParse(id))
}

// deleteById
//
//	@Tags		tasks
//	@Summary	Delete task
//	@Description	Deletes a task by ID, only allowed for the task author or admins
//	@Produce	json
//	@Param		id	path	string	true	"Task UUID"
//	@Success	200
//	@Failure	400	{object}	string	"Bad Request"
//	@Failure	403	{object}	string	"Forbidden"
//	@Failure	500	{object}	string	"Internal Server Error"
//	@Router		/api/tasks/{id}/delete [delete]
func deleteById(s ui.UIService) (any, error) {
	u, err := s.GetCurrentUser()
	if err != nil {
		return nil, err
	}

	taskId, err := s.GetPathParameterAsString("id")
	if err != nil {
		return nil, err
	}

	return nil, s.GetService().(*service).deleteTask(
		s.GetRequest().Context(), uuid.MustParse(taskId), u.Id, u.Permission,
	)
}

func parseFilterParams(s ui.UIService) (*task.Filters, error) {
	var f ui.FilterService[task.FiltersInput, task.Filters]

	return f.GetResolvedFilters(s, (*task.FiltersInput).ResolveFilters)
}
