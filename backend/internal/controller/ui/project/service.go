package project

import (
	"context"

	"github.com/goawwer/codinate/internal/adapter/dto/filters"
	"github.com/goawwer/codinate/internal/adapter/dto/project"
	"github.com/goawwer/codinate/internal/adapter/model"
	"github.com/goawwer/codinate/internal/adapter/model/enum"
	"github.com/goawwer/codinate/internal/adapter/repository"
	"github.com/google/uuid"
)

type service struct{}

func (s *service) all(ctx context.Context) ([]project.Row, error) {
	return repository.GetProjectRepo().GetAll(ctx)
}

func (s *service) getById(ctx context.Context, id int) (project.Row, error) {
	return repository.GetProjectRepo().GetById(ctx, id)
}

func (s *service) updateLinks(ctx context.Context, id int, input project.UpdateLinksInput) error {
	return repository.GetProjectRepo().UpdateLinks(ctx, id, input.Links)
}

func (s *service) addNewProject(ctx context.Context, input project.CreateProjectInput) (int, error) {
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

func (s *service) getProjectReleases(ctx context.Context, projectId int) ([]model.Release, error) {
	return repository.GetProjectRepo().GetReleases(ctx, projectId)
}

func (s *service) addProjectRelease(ctx context.Context, input project.CreateReleaseInput, projectId int) error {
	dateRange := filters.NewDateRange(input.StartAt, input.EndAt)

	return repository.GetProjectRepo().AddNewRelease(ctx, &model.Release{
		ProjectId:  projectId,
		Title:      input.Title,
		Decription: input.Description,
		Status:     enum.ReleaseStatusActive,
		StartAt:    dateRange.From,
		EndAt:      dateRange.To,
	})
}

func (s *service) updateProjectRelease(ctx context.Context, input project.UpdateReleaseInput, id int) error {
	return repository.GetProjectRepo().UpdateRelease(ctx, input, id)
}

func (s *service) deleteProjectRelease(ctx context.Context, id int) error {
	return repository.GetProjectRepo().DeleteRelease(ctx, id)
}
