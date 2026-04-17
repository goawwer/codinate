package categories

import (
	"reflect"

	"github.com/goawwer/codinate/internal/adapter/dto/shared"
	"github.com/goawwer/codinate/internal/adapter/model/enum"
	"github.com/goawwer/codinate/internal/controller/ui"
)

func Register() {
	ui.RegisterGet("/tasks/{project_id}/categories", enum.AnyUser, reflect.TypeOf(service{}), getAll)
	ui.RegisterPost("/tasks/{project_id}/categories/add", enum.AtLeastAdmin, reflect.TypeOf(service{}), add)
	ui.RegisterPatch("/tasks/categories/{id}/update", enum.AtLeastAdmin, reflect.TypeOf(service{}), update)
	ui.RegisterDelete("/tasks/categories/{id}/delete", enum.AtLeastAdmin, reflect.TypeOf(service{}), delete)
}

// getAll
//
//	@Tags		categories
//	@Summary	Get task categories
//	@Description	Returns all task categories for a given project
//	@Produce	json
//	@Param		project_id	path		int	true	"Project ID"
//	@Success	200
//	@Failure	400	{object}	string	"Bad Request"
//	@Failure	500	{object}	string	"Internal Server Error"
//	@Router		/api/tasks/{project_id}/categories [get]
func getAll(s ui.UIService) (any, error) {
	projectId, err := s.GetPathParamAsInt("project_id")
	if err != nil {
		return nil, err
	}

	return s.GetService().(*service).getAllCategoriesBy(s.GetRequest().Context(), projectId)
}

// add
//
//	@Tags		categories
//	@Summary	Add task category
//	@Description	Creates a new task category for a given project
//	@Accept		json
//	@Produce	json
//	@Param		project_id	path		int				true	"Project ID"
//	@Param		payload		body		shared.NameInput	true	"Category name"
//	@Success	200
//	@Failure	400	{object}	string	"Bad Request"
//	@Failure	500	{object}	string	"Internal Server Error"
//	@Router		/api/tasks/{project_id}/categories/add [post]
func add(s ui.UIService) (any, error) {
	var name shared.NameInput

	projectId, err := s.GetPathParamAsInt("project_id")
	if err != nil {
		return nil, err
	}

	if err := s.GetBodyAs(&name); err != nil {
		return nil, err
	}

	return nil, s.GetService().(*service).addNewCategory(s.GetRequest().Context(), name, projectId)
}

// update
//
//	@Tags		categories
//	@Summary	Update task category
//	@Description	Updates the name of an existing task category
//	@Accept		json
//	@Produce	json
//	@Param		id		path		int				true	"Category ID"
//	@Param		payload	body		shared.NameInput	true	"New category name"
//	@Success	200
//	@Failure	400	{object}	string	"Bad Request"
//	@Failure	500	{object}	string	"Internal Server Error"
//	@Router		/api/tasks/categories/{id}/update [patch]
func update(s ui.UIService) (any, error) {
	var name shared.NameInput

	id, err := s.GetPathParamAsInt("id")
	if err != nil {
		return nil, err
	}

	if err := s.GetBodyAs(&name); err != nil {
		return nil, err
	}

	return nil, s.GetService().(*service).updateCategoryBy(s.GetRequest().Context(), name, id)
}

// delete
//
//	@Tags		categories
//	@Summary	Delete task category
//	@Description	Deletes a task category by ID
//	@Produce	json
//	@Param		id	path	int	true	"Category ID"
//	@Success	200
//	@Failure	400	{object}	string	"Bad Request"
//	@Failure	500	{object}	string	"Internal Server Error"
//	@Router		/api/tasks/categories/{id}/delete [delete]
func delete(s ui.UIService) (any, error) {
	id, err := s.GetPathParamAsInt("id")
	if err != nil {
		return nil, err
	}

	return nil, s.GetService().(*service).deleteCategoryBy(s.GetRequest().Context(), id)
}
