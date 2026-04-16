package project

import (
	"context"

	"github.com/goawwer/codinate/internal/adapter/dto/project"
	"github.com/goawwer/codinate/internal/adapter/repository"
	"github.com/google/uuid"
)

type service struct{}

func (s *service) all(ctx context.Context) ([]project.Row, error) {
	return repository.GetProjectRepo().GetAll(ctx)
}

func (s *service) addNewProject(ctx context.Context, input project.CreateProjectInput) error {
	return repository.GetProjectRepo().Create(ctx, input)
}

func (s *service) updateProject(ctx context.Context, input project.UpdateProjectInput, id int) error {
	return repository.GetProjectRepo().Update(ctx, input, id)
}

func (s *service) addProjectMember(ctx context.Context, projectId int, memberId uuid.UUID) error {
	return repository.GetProjectRepo().AddMember(ctx, projectId, memberId)
}

func (s *service) deleteProjectMember(ctx context.Context, projectId int, memberId uuid.UUID) error {
	return repository.GetProjectRepo().RemoveMember(ctx, projectId, memberId)
}

func (s *service) deleteProject(ctx context.Context, projectId int) error {
	return repository.GetProjectRepo().DeleteBy(ctx, projectId)
}

func (s *service) deletePicture(ctx context.Context, projectId int) error {
	return repository.GetProjectRepo().DeletePictureBy(ctx, projectId)
}
