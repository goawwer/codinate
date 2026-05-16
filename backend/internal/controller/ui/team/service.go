package team

import (
	"context"

	"github.com/goawwer/codinate/internal/adapter/dto/team"
	"github.com/goawwer/codinate/internal/adapter/repository"
	"github.com/google/uuid"
)

type service struct{}

func (s *service) getTeam(ctx context.Context, id uuid.UUID) (team.Row, error) {
	return repository.GetTeamRepo().GetTeamBy(ctx, id)
}

func (s *service) getAllTeams(ctx context.Context) ([]team.Row, error) {
	return repository.GetTeamRepo().GetAllTeamsWithMembersShort(ctx)
}

func (s *service) addNewTeam(ctx context.Context, input team.CreateTeamInput) error {
	return repository.GetTeamRepo().Create(ctx, input)
}

func (s *service) update(ctx context.Context, input team.UpdateTeamInput, id int) error {
	return repository.GetTeamRepo().Update(ctx, input, id)
}

func (s *service) addMember(ctx context.Context, teamId int, memberId uuid.UUID) error {
	return repository.GetTeamRepo().AddMember(ctx, teamId, memberId)
}

func (s *service) remMember(ctx context.Context, teamId int, memberId uuid.UUID) error {
	return repository.GetTeamRepo().RemoveMember(ctx, teamId, memberId)
}

func (s *service) delete(ctx context.Context, teamId int) error {
	return repository.GetTeamRepo().DeleteBy(ctx, teamId)
}

func (s *service) updateLinks(ctx context.Context, id int, links team.TeamLinks) error {
	return repository.GetTeamRepo().UpdateLinks(ctx, id, links)
}

func (s *service) deletePicture(ctx context.Context, projectId int) error {
	return repository.GetTeamRepo().DeletePictureBy(ctx, projectId)
}
