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
}

func getAll(s ui.UIService) (any, error) {
	return s.GetService().(*service).all(s.GetRequest().Context())
}

func create(s ui.UIService) (any, error) {
	input, pictureName, err := ui.ParseMultipartPayload[project.CreateProjectInput](s, "picture", "teams")
	if err != nil {
		return nil, err
	}
	input.Core.PictureName = pictureName

	return nil, s.GetService().(*service).addNewProject(s.GetRequest().Context(), input)
}

func update(s ui.UIService) (any, error) {
	id, err := s.GetPathParamAsInt("id")
	if err != nil {
		return nil, err
	}

	var input project.UpdateProjectInput

	if err := s.GetBodyAs(&input); err != nil {
		return nil, err
	}

	return nil, s.GetService().(*service).updateProject(s.GetRequest().Context(), input, id)
}

func delete(s ui.UIService) (any, error) {
	id, err := s.GetPathParamAsInt("id")
	if err != nil {
		return nil, err
	}

	return nil, s.GetService().(*service).deleteProject(s.GetRequest().Context(), id)
}

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
