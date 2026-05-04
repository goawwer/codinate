package worklog

import (
	"context"
	"errors"
	"time"

	"github.com/goawwer/codinate/internal/adapter/dto/worklog"
	"github.com/goawwer/codinate/internal/adapter/model"
	"github.com/goawwer/codinate/internal/adapter/repository"
	"github.com/google/uuid"
)

type service struct{}

func (s *service) getAll(ctx context.Context, userId uuid.UUID, f *worklog.Filters) ([]worklog.Row, error) {
	return repository.GetWorklogRepo().GetAll(ctx, userId, f)
}

func (s *service) add(ctx context.Context, userId uuid.UUID, input worklog.CreateLogInput) (uuid.UUID, error) {
	startAt, err := time.Parse(time.RFC3339Nano, input.StartAt)
	if err != nil {
		return uuid.Nil, err
	}
	endAt, err := time.Parse(time.RFC3339Nano, input.EndAt)
	if err != nil {
		return uuid.Nil, err
	}

	totalMinutes := int(endAt.Sub(startAt).Minutes())
	if totalMinutes <= 0 {
		return uuid.Nil, errors.New("end time must be after start time")
	}

	var taskId uuid.UUID
	var projectId int

	if input.TaskId != "" {
		taskId, err = uuid.Parse(input.TaskId)
		if err != nil {
			return uuid.Nil, err
		}
		projectId, _ = repository.GetTaskRepo().GetTaskProjectId(ctx, taskId)
	}

	return repository.GetWorklogRepo().Add(ctx, model.Worklog{
		TaskId:       taskId,
		UserId:       userId,
		ProjectId:    projectId,
		Description:  input.Description,
		StartAt:      startAt,
		EndAt:        endAt,
		TotalMinutes: totalMinutes,
	})
}
