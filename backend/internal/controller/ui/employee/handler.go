package employee

import (
	"reflect"

	"github.com/goawwer/codinate/internal/adapter/dto/shared"
	"github.com/goawwer/codinate/internal/adapter/model/enum"
	"github.com/goawwer/codinate/internal/controller/ui"
)

func Register() {
	ui.RegisterGet("/employee/roles", enum.AnyUser, reflect.TypeOf(service{}), getEmployeesRoles)
	ui.RegisterPost("/employee/roles/add", enum.AtLeastAdmin, reflect.TypeOf(service{}), addEmployeeRole)
	ui.RegisterPatch("/employee/roles/update/{id}", enum.AtLeastAdmin, reflect.TypeOf(service{}), updateEmployeeRoleById)
	ui.RegisterDelete("/employee/roles/delete/{id}", enum.AtLeastAdmin, reflect.TypeOf(service{}), delEmployeeRoleById)
	ui.RegisterDelete("/employee/roles/delete/all", enum.AtLeastOwner, reflect.TypeOf(service{}), deleteEmployeeRoles)
}

// addEmployeeRole
//
//	@Tags			roles
//	@Summary		Add role
//	@Description	Post body with role name
//	@Accept			json
//	@Produce		json
//	@Param			request	body		shared.NameInput	true	"Body with role name"
//	@Success		200		{object}	nil
//	@Failure		400		{object}	string	"Bad Request"
//	@Failure		500		{object}	string	"Internal Server Error"
//	@Router			/api/employee/roles/add  [post]
func addEmployeeRole(s ui.UIService) (any, error) {
	var input shared.NameInput

	if err := s.GetBodyAs(&input); err != nil {
		return nil, err
	}

	return nil, s.GetService().(*service).addNewEmployeeRole(s.GetRequest().Context(), input.Name)
}

// getEmployeesRoles
//
//	@Tags			roles
//	@Summary		Get roles
//	@Description	Get all roles for employees
//	@Accept			json
//	@Produce		json
//	@Success		200	{object}	nil
//	@Failure		400	{object}	string	"Bad Request"
//	@Failure		500	{object}	string	"Internal Server Error"
//	@Router			/api/employee/roles  [get]
func getEmployeesRoles(s ui.UIService) (any, error) {
	return s.GetService().(*service).getRoles(s.GetRequest().Context())
}

// updateRole
//
//	@Tags			roles
//	@Summary		Update role
//	@Description	Update role by id and new name
//	@Accept			json
//	@Produce		json
//	@Param			id		path		int					true	"Role ID"
//	@Param			request	body		shared.NameInput	true	"Body with new role name"
//	@Success		200		{object}	nil
//	@Failure		400		{object}	string	"Bad Request"
//	@Failure		500		{object}	string	"Internal Server Error"
//	@Router			/api/employee/roles/update/{id}  [patch]
func updateEmployeeRoleById(s ui.UIService) (any, error) {
	id, err := s.GetPathParamAsInt("id")
	if err != nil {
		return nil, err
	}

	var input shared.NameInput

	if err := s.GetBodyAs(&input); err != nil {
		return nil, err
	}

	return nil, s.GetService().(*service).updateEmployeeRoleById(s.GetRequest().Context(), id, input.Name)
}

// deleteEmployeeRole
//
//	@Tags			roles
//	@Summary		Delete role
//	@Description	Delete role by id
//	@Accept			json
//	@Produce		json
//	@Param			id	path		int	true	"Role ID"
//	@Success		200	{object}	nil
//	@Failure		400	{object}	string	"Bad Request"
//	@Failure		500	{object}	string	"Internal Server Error"
//	@Router			/api/employee/roles/delete/{id}  [delete]
func delEmployeeRoleById(s ui.UIService) (any, error) {
	id, err := s.GetPathParamAsInt("id")
	if err != nil {
		return nil, err
	}

	return nil, s.GetService().(*service).deleteRoleById(s.GetRequest().Context(), id)
}

// deleteRoles
//
//	@Tags			roles
//	@Summary		Delete roles
//	@Description	Delete role all employee roles
//	@Accept			json
//	@Produce		json
//	@Success		200	{object}	nil
//	@Failure		400	{object}	string	"Bad Request"
//	@Failure		500	{object}	string	"Internal Server Error"
//	@Router			/api/employee/roles/delete/all  [delete]
func deleteEmployeeRoles(s ui.UIService) (any, error) {
	return nil, s.GetService().(*service).deleteAllRoles(s.GetRequest().Context())
}
