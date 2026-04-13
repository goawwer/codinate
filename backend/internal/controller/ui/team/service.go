package team

import (
	"context"

	"github.com/goawwer/codinate/internal/adapter/dto/team"
	"github.com/goawwer/codinate/internal/adapter/dto/user"
	"github.com/goawwer/codinate/internal/adapter/repository"
	"github.com/google/uuid"
)

type service struct{}

func (s *service) getTeamMembersBy(ctx context.Context, id uuid.UUID) ([]user.TeamMember, error) {
	return repository.GetTeamRepo().GetTeamMembersBy(ctx, id)
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

func (s *service) remMember(ctx context.Context, teamId int, memberId uuid.UUID) error {
	return repository.GetTeamRepo().RemoveMember(ctx, teamId, memberId)
}

func (s *service) delete(ctx context.Context, teamId int) error {
	return repository.GetTeamRepo().DeleteBy(ctx, teamId)
}
