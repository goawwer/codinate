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
	ui.RegisterGet("/teams/{id}", enum.AnyUser, reflect.TypeOf(service{}), getTeam)
	ui.RegisterPatch("/teams/{id}/update", enum.AtLeastAdmin, reflect.TypeOf(service{}), update)
	ui.RegisterPatch("/teams/{id}/links", enum.AtLeastAdmin, reflect.TypeOf(service{}), updateLinks)
	ui.RegisterDelete("/teams/{id}/delete", enum.AtLeastOwner, reflect.TypeOf(service{}), deleteTeam)
	ui.RegisterDelete("/teams/{team_id}/delete/{member_id}", enum.AtLeastAdmin, reflect.TypeOf(service{}), removeMember)
	ui.RegisterDelete("/teams/{team_id}/delete/picture", enum.AtLeastAdmin, reflect.TypeOf(service{}), removePicture)
	ui.RegisterPost("/teams/{team_id}/add/{member_id}", enum.AtLeastAdmin, reflect.TypeOf(service{}), addMember)
}

// allTeams
//
//	@Tags		teams
//	@Summary	Get all teams
//	@Description	Returns a list of all teams with their members
//	@Produce	json
//	@Success	200	{object}	[]team.Row
//	@Failure	500	{object}	string	"Internal Server Error"
//	@Router		/api/teams [get]
func allTeams(s ui.UIService) (any, error) {
	return s.GetService().(*service).getAllTeams(s.GetRequest().Context())
}

// teamMembers
//
//	@Tags		teams
//	@Summary	Get team members
//	@Description	Returns the list of members for a given team
//	@Produce	json
//	@Param		id	path		string	true	"Team ID"
//	@Success	200	{object}	[]team.Row
//	@Failure	400	{object}	string	"Bad Request"
//	@Failure	500	{object}	string	"Internal Server Error"
//	@Router		/api/teams/{id}/members [get]
func getTeam(s ui.UIService) (any, error) {
	id, err := s.GetPathParamAsInt("id")
	if err != nil {
		return nil, ui.NewHttpCodeError(nil, http.StatusBadRequest, "invalid team id parameter")
	}

	return s.GetService().(*service).getTeam(s.GetRequest().Context(), id)
}

// createTeam
//
//	@Tags		teams
//	@Summary	Create team
//	@Description	Creates a new team with optional picture and initial members
//	@Accept		multipart/form-data
//	@Produce	json
//	@Param		picture	formData	file				false	"Team picture"
//	@Param		payload	formData	team.CreateTeamInput	true	"Team data (JSON)"
//	@Success	200
//	@Failure	400	{object}	string	"Bad Request"
//	@Failure	500	{object}	string	"Internal Server Error"
//	@Router		/api/teams/create [post]
func createTeam(s ui.UIService) (any, error) {
	input, pictureName, err := ui.ParseMultipartPayload[team.CreateTeamInput](s, "avatar", "teams")
	if err != nil {
		return nil, err
	}
	input.PictureName = pictureName

	currentUser, err := s.GetCurrentUser()
	if err != nil {
		return nil, err
	}
	input.AuthorId = currentUser.Id.String()
	input.MembersIds = appendIfMissing(input.MembersIds, input.AuthorId)

	return nil, s.GetService().(*service).addNewTeam(s.GetRequest().Context(), input)
}

func appendIfMissing(ids []string, id string) []string {
	for _, v := range ids {
		if v == id {
			return ids
		}
	}
	return append(ids, id)
}

// updateLinks
//
//	@Tags		teams
//	@Summary	Update team links
//	@Description	Updates the links list for a team
//	@Accept		json
//	@Produce	json
//	@Param		id		path		int						true	"Team ID"
//	@Param		payload	body		team.UpdateLinksInput	true	"Links payload"
//	@Success	200
//	@Failure	400	{object}	string	"Bad Request"
//	@Failure	500	{object}	string	"Internal Server Error"
//	@Router		/api/teams/{id}/links [patch]
func updateLinks(s ui.UIService) (any, error) {
	id, err := s.GetPathParamAsInt("id")
	if err != nil {
		return nil, ui.NewHttpCodeError(nil, http.StatusBadRequest, "invalid team id parameter")
	}

	var input team.UpdateLinksInput
	if err := s.GetBodyAs(&input); err != nil {
		return nil, err
	}

	return nil, s.GetService().(*service).updateLinks(s.GetRequest().Context(), id, input.Links)
}

// update
//
//	@Tags		teams
//	@Summary	Update team
//	@Description	Updates a team's name, description, or picture
//	@Accept		multipart/form-data
//	@Produce	json
//	@Param		id		path		int					true	"Team ID"
//	@Param		picture	formData	file				false	"Team picture"
//	@Param		payload	formData	team.UpdateTeamInput	true	"Fields to update (JSON)"
//	@Success	200
//	@Failure	400	{object}	string	"Bad Request"
//	@Failure	500	{object}	string	"Internal Server Error"
//	@Router		/api/teams/{id}/update [patch]
func update(s ui.UIService) (any, error) {
	id, err := s.GetPathParamAsInt("id")
	if err != nil {
		return nil, err
	}

	input, pictureName, err := ui.ParseMultipartPayload[team.UpdateTeamInput](s, "avatar", "teams")
	if err != nil {
		return nil, err
	}

	input.PictureName = &pictureName

	return nil, s.GetService().(*service).update(s.GetRequest().Context(), input, id)
}

// deleteTeam
//
//	@Tags		teams
//	@Summary	Delete team
//	@Description	Deletes a team by ID
//	@Produce	json
//	@Param		id	path	int	true	"Team ID"
//	@Success	200
//	@Failure	400	{object}	string	"Bad Request"
//	@Failure	500	{object}	string	"Internal Server Error"
//	@Router		/api/teams/{id}/delete [delete]
func deleteTeam(s ui.UIService) (any, error) {
	id, err := s.GetPathParamAsInt("id")
	if err != nil {
		return nil, err
	}

	return nil, s.GetService().(*service).delete(s.GetRequest().Context(), id)
}

// addMember
//
//	@Tags		teams
//	@Summary	Add member to team
//	@Description	Adds a user to a team by their IDs
//	@Produce	json
//	@Param		team_id		path	int		true	"Team ID"
//	@Param		member_id	path	string	true	"User UUID"
//	@Success	200
//	@Failure	400	{object}	string	"Bad Request"
//	@Failure	500	{object}	string	"Internal Server Error"
//	@Router		/api/teams/{team_id}/add/{member_id} [post]
func addMember(s ui.UIService) (any, error) {
	teamId, err := s.GetPathParamAsInt("team_id")
	if err != nil {
		return nil, ui.NewHttpCodeError(nil, http.StatusBadRequest, "invalid team id parameter")
	}

	memberId, err := s.GetPathParameterAsString("member_id")
	if err != nil {
		return nil, ui.NewHttpCodeError(nil, http.StatusBadRequest, "invalid team member id parameter")
	}

	return nil, s.GetService().(*service).addMember(s.GetRequest().Context(), teamId, uuid.MustParse(memberId))
}

// removeMember
//
//	@Tags		teams
//	@Summary	Remove member from team
//	@Description	Removes a user from a team by their IDs
//	@Produce	json
//	@Param		team_id		path	int		true	"Team ID"
//	@Param		member_id	path	string	true	"User UUID"
//	@Success	200
//	@Failure	400	{object}	string	"Bad Request"
//	@Failure	500	{object}	string	"Internal Server Error"
//	@Router		/api/teams/{team_id}/delete/{member_id} [delete]
func removeMember(s ui.UIService) (any, error) {
	teamId, err := s.GetPathParamAsInt("team_id")
	if err != nil {
		return nil, ui.NewHttpCodeError(nil, http.StatusBadRequest, "invalid team id parameter")
	}

	memberId, err := s.GetPathParameterAsString("member_id")
	if err != nil {
		return nil, ui.NewHttpCodeError(nil, http.StatusBadRequest, "invalid team member id parameter")
	}

	return nil, s.GetService().(*service).remMember(s.GetRequest().Context(), teamId, uuid.MustParse(memberId))
}

// removePicture
//
//	@Tags		teams
//	@Summary	Remove team picture
//	@Description	Deletes the picture of a team
//	@Produce	json
//	@Param		team_id	path	int	true	"Team ID"
//	@Success	200
//	@Failure	400	{object}	string	"Bad Request"
//	@Failure	500	{object}	string	"Internal Server Error"
//	@Router		/api/teams/{team_id}/delete/picture [delete]
func removePicture(s ui.UIService) (any, error) {
	teamId, err := s.GetPathParamAsInt("team_id")
	if err != nil {
		return nil, err
	}

	return nil, s.GetService().(*service).deletePicture(s.GetRequest().Context(), teamId)
}
