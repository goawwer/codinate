package team

import (
	"net/http"
	"reflect"

	"github.com/goawwer/codinate/internal/adapter/dto/team"
	"github.com/goawwer/codinate/internal/adapter/model/enum"
	"github.com/goawwer/codinate/internal/controller/ui"
	"github.com/google/uuid"
)

func Register() {
	ui.RegisterPost("/teams/create", enum.AtLeastAdmin, reflect.TypeOf(service{}), createTeam)
	ui.RegisterGet("/teams", enum.AnyUser, reflect.TypeOf(service{}), allTeams)
	ui.RegisterPatch("/teams/{id}/update", enum.AtLeastAdmin, reflect.TypeOf(service{}), update)
	ui.RegisterGet("/teams/{id}/members", enum.AnyUser, reflect.TypeOf(service{}), teamMembers)
	ui.RegisterDelete("/teams/{id}/delete", enum.AtLeastOwner, reflect.TypeOf(service{}), deleteTeam)
	ui.RegisterDelete("/teams/{team_id}/delete/{member_id}", enum.AtLeastAdmin, reflect.TypeOf(service{}), removeMember)
}

func allTeams(s ui.UIService) (any, error) {
	return s.GetService().(*service).getAllTeams(s.GetRequest().Context())
}

func teamMembers(s ui.UIService) (any, error) {
	id, err := s.GetPathParameterAsString("id")
	if err != nil {
		return nil, err
	}

	return s.GetService().(*service).getTeamMembersBy(s.GetRequest().Context(), uuid.MustParse(id))
}

func createTeam(s ui.UIService) (any, error) {
	input, pictureName, err := ui.ParseMultipartPayload[team.CreateTeamInput](s, "picture", "teams")
	if err != nil {
		return nil, err
	}
	input.PictureName = pictureName

	return nil, s.GetService().(*service).addNewTeam(s.GetRequest().Context(), input)
}

func update(s ui.UIService) (any, error) {
	input, pictureName, err := ui.ParseMultipartPayload[team.UpdateTeamInput](s, "picture", "teams")
	if err != nil {
		return nil, err
	}

	input.PictureName = &pictureName

	return nil, s.GetService().(*service).update(s.GetRequest().Context(), input, input.Id)
}

func deleteTeam(s ui.UIService) (any, error) {
	id, err := s.GetPathParamAsInt("id")
	if err != nil {
		return nil, err
	}

	return nil, s.GetService().(*service).delete(s.GetRequest().Context(), id)
}

func removeMember(s ui.UIService) (any, error) {
	teamId, err := s.GetPathParamAsInt("teamId")
	if err != nil {
		return nil, ui.NewHttpCodeError(nil, http.StatusBadRequest, "invalud team id parameter")
	}

	memberId, err := s.GetPathParameterAsString("memberId")
	if err != nil {
		return nil, ui.NewHttpCodeError(nil, http.StatusBadRequest, "invalud team member id parameter")
	}

	return nil, s.GetService().(*service).remMember(s.GetRequest().Context(), teamId, uuid.MustParse(memberId))
}
