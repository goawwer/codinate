package project

import (
	"reflect"

	"github.com/goawwer/codinate/internal/adapter/dto/project"
	"github.com/goawwer/codinate/internal/adapter/model/enum"
	"github.com/goawwer/codinate/internal/controller/ui"
	"github.com/google/uuid"
)

func Register() {
	ui.RegisterGet("/projects", enum.AnyUser, reflect.TypeOf(service{}), getAll)
	ui.RegisterPost("/projects/create", enum.AtLeastAdmin, reflect.TypeOf(service{}), create)
	ui.RegisterPatch("/projects/{id}/update", enum.AtLeastAdmin, reflect.TypeOf(service{}), update)
	ui.RegisterDelete("/projects/{id}/delete", enum.AtLeastOwner, reflect.TypeOf(service{}), delete)
	ui.RegisterDelete("/projects/{project_id}/delete/{member_id}", enum.AtLeastAdmin, reflect.TypeOf(service{}), removeMember)
	ui.RegisterDelete("/projects/{project_id}/delete/picture", enum.AtLeastAdmin, reflect.TypeOf(service{}), removePicture)
	ui.RegisterPost("/projects/{project_id}/add/{member_id}", enum.AtLeastAdmin, reflect.TypeOf(service{}), addMember)

	// releases
	ui.RegisterGet("/projects/releases/{project_id}", enum.AnyUser, reflect.TypeOf(service{}), releases)
	ui.RegisterPost("/projects/releases/{project_id}/add", enum.AtLeastAdmin, reflect.TypeOf(service{}), addRelease)
	ui.RegisterPatch("/projects/releases/{id}/update", enum.AtLeastAdmin, reflect.TypeOf(service{}), updateRelease)
	ui.RegisterDelete("/projects/releases/{id}/delete", enum.AtLeastAdmin, reflect.TypeOf(service{}), deleteRelease)
}

// getAll
//
//	@Tags		projects
//	@Summary	Get all projects
//	@Description	Returns a list of all projects with their members
//	@Produce	json
//	@Success	200	{object}	[]project.Row
//	@Failure	500	{object}	string	"Internal Server Error"
//	@Router		/api/projects [get]
func getAll(s ui.UIService) (any, error) {
	return s.GetService().(*service).all(s.GetRequest().Context())
}

// create
//
//	@Tags		projects
//	@Summary	Create project
//	@Description	Creates a new project with optional picture and initial members
//	@Accept		multipart/form-data
//	@Produce	json
//	@Param		picture	formData	file					false	"Project picture"
//	@Param		payload	formData	project.CreateProjectInput	true	"Project data (JSON)"
//	@Success	200
//	@Failure	400	{object}	string	"Bad Request"
//	@Failure	500	{object}	string	"Internal Server Error"
//	@Router		/api/projects/create [post]
func create(s ui.UIService) (any, error) {
	input, pictureName, err := ui.ParseMultipartPayload[project.CreateProjectInput](s, "picture", "projects")
	if err != nil {
		return nil, err
	}
	input.Core.PictureName = &pictureName

	return nil, s.GetService().(*service).addNewProject(s.GetRequest().Context(), input)
}

// update
//
//	@Tags		projects
//	@Summary	Update project
//	@Description	Updates a project's name, description, or picture
//	@Accept		multipart/form-data
//	@Produce	json
//	@Param		id		path		int						true	"Project ID"
//	@Param		picture	formData	file					false	"Project picture"
//	@Param		payload	formData	project.UpdateProjectInput	true	"Fields to update (JSON)"
//	@Success	200
//	@Failure	400	{object}	string	"Bad Request"
//	@Failure	500	{object}	string	"Internal Server Error"
//	@Router		/api/projects/{id}/update [patch]
func update(s ui.UIService) (any, error) {
	id, err := s.GetPathParamAsInt("id")
	if err != nil {
		return nil, err
	}

	input, pictureName, err := ui.ParseMultipartPayload[project.UpdateProjectInput](s, "picture", "projects")
	if err != nil {
		return nil, err
	}
	input.PictureName = &pictureName

	return nil, s.GetService().(*service).updateProject(s.GetRequest().Context(), input, id)
}

// delete
//
//	@Tags		projects
//	@Summary	Delete project
//	@Description	Deletes a project by ID
//	@Produce	json
//	@Param		id	path	int	true	"Project ID"
//	@Success	200
//	@Failure	400	{object}	string	"Bad Request"
//	@Failure	500	{object}	string	"Internal Server Error"
//	@Router		/api/projects/{id}/delete [delete]
func delete(s ui.UIService) (any, error) {
	id, err := s.GetPathParamAsInt("id")
	if err != nil {
		return nil, err
	}

	return nil, s.GetService().(*service).deleteProject(s.GetRequest().Context(), id)
}

// addMember
//
//	@Tags		projects
//	@Summary	Add member to project
//	@Description	Adds a user to a project by their UUIDs
//	@Produce	json
//	@Param		project_id	path	int		true	"Project ID"
//	@Param		member_id	path	string	true	"User UUID"
//	@Success	200
//	@Failure	400	{object}	string	"Bad Request"
//	@Failure	500	{object}	string	"Internal Server Error"
//	@Router		/api/projects/{project_id}/add/{member_id} [post]
func addMember(s ui.UIService) (any, error) {
	projectId, err := s.GetPathParamAsInt("project_id")
	if err != nil {
		return nil, err
	}

	memberId, err := s.GetPathParameterAsString("member_id")
	if err != nil {
		return nil, err
	}

	return nil, s.GetService().(*service).addProjectMember(s.GetRequest().Context(), projectId, uuid.MustParse(memberId))
}

// removeMember
//
//	@Tags		projects
//	@Summary	Remove member from project
//	@Description	Removes a user from a project by their UUIDs
//	@Produce	json
//	@Param		project_id	path	int		true	"Project ID"
//	@Param		member_id	path	string	true	"User UUID"
//	@Success	200
//	@Failure	400	{object}	string	"Bad Request"
//	@Failure	500	{object}	string	"Internal Server Error"
//	@Router		/api/projects/{project_id}/delete/{member_id} [delete]
func removeMember(s ui.UIService) (any, error) {
	projectId, err := s.GetPathParamAsInt("project_id")
	if err != nil {
		return nil, err
	}

	memberId, err := s.GetPathParameterAsString("member_id")
	if err != nil {
		return nil, err
	}

	return nil, s.GetService().(*service).deleteProjectMember(s.GetRequest().Context(), projectId, uuid.MustParse(memberId))
}

// removePicture
//
//	@Tags		projects
//	@Summary	Remove project picture
//	@Description	Deletes the picture of a project
//	@Produce	json
//	@Param		project_id	path	int	true	"Project ID"
//	@Success	200
//	@Failure	400	{object}	string	"Bad Request"
//	@Failure	500	{object}	string	"Internal Server Error"
//	@Router		/api/projects/{project_id}/delete/picture [delete]
func removePicture(s ui.UIService) (any, error) {
	projectId, err := s.GetPathParamAsInt("project_id")
	if err != nil {
		return nil, err
	}

	return nil, s.GetService().(*service).deletePicture(s.GetRequest().Context(), projectId)
}

// releases
//
//	@Tags		projects
//	@Summary	Get project releases
//	@Description	Returns all releases for a given project
//	@Produce	json
//	@Param		project_id	path		int	true	"Project ID"
//	@Success	200
//	@Failure	400	{object}	string	"Bad Request"
//	@Failure	500	{object}	string	"Internal Server Error"
//	@Router		/api/projects/releases/{project_id} [get]
func releases(s ui.UIService) (any, error) {
	projectId, err := s.GetPathParamAsInt("project_id")
	if err != nil {
		return nil, err
	}

	return s.GetService().(*service).getProjectReleases(s.GetRequest().Context(), projectId)
}

// addRelease
//
//	@Tags		projects
//	@Summary	Add release to project
//	@Description	Creates a new release for a given project
//	@Accept		json
//	@Produce	json
//	@Param		project_id	path		int							true	"Project ID"
//	@Param		payload		body		project.CreateReleaseInput	true	"Release data"
//	@Success	200
//	@Failure	400	{object}	string	"Bad Request"
//	@Failure	500	{object}	string	"Internal Server Error"
//	@Router		/api/projects/releases/{project_id}/add [post]
func addRelease(s ui.UIService) (any, error) {
	var input project.CreateReleaseInput

	projectId, err := s.GetPathParamAsInt("project_id")
	if err != nil {
		return nil, err
	}

	if err := s.GetBodyAs(&input); err != nil {
		return nil, err
	}

	return nil, s.GetService().(*service).addProjectRelease(s.GetRequest().Context(), input, projectId)
}

// updateRelease
//
//	@Tags		projects
//	@Summary	Update release
//	@Description	Updates fields of an existing release
//	@Accept		json
//	@Produce	json
//	@Param		id		path		int							true	"Release ID"
//	@Param		payload	body		project.UpdateReleaseInput	true	"Fields to update"
//	@Success	200
//	@Failure	400	{object}	string	"Bad Request"
//	@Failure	500	{object}	string	"Internal Server Error"
//	@Router		/api/projects/releases/{id}/update [patch]
func updateRelease(s ui.UIService) (any, error) {
	var input project.UpdateReleaseInput

	id, err := s.GetPathParamAsInt("id")
	if err != nil {
		return nil, err
	}

	if err := s.GetBodyAs(&input); err != nil {
		return nil, err
	}

	return nil, s.GetService().(*service).updateProjectRelease(s.GetRequest().Context(), input, id)
}

// deleteRelease
//
//	@Tags		projects
//	@Summary	Delete release
//	@Description	Deletes a release by ID
//	@Produce	json
//	@Param		id	path	int	true	"Release ID"
//	@Success	200
//	@Failure	400	{object}	string	"Bad Request"
//	@Failure	500	{object}	string	"Internal Server Error"
//	@Router		/api/projects/releases/{id}/delete [delete]
func deleteRelease(s ui.UIService) (any, error) {
	id, err := s.GetPathParamAsInt("id")
	if err != nil {
		return nil, err
	}

	return nil, s.GetService().(*service).deleteProjectRelease(s.GetRequest().Context(), id)
}
