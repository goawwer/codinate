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

func (s *service) getByTask(ctx context.Context, taskId uuid.UUID) ([]worklog.TaskRow, error) {
	return repository.GetWorklogRepo().GetByTask(ctx, taskId)
}

func (s *service) getLeaderboard(ctx context.Context) ([]worklog.LeaderboardEntry, error) {
	return repository.GetWorklogRepo().GetLeaderboard(ctx, 10)
}

func (s *service) recalculateLeaderboard(ctx context.Context) error {
	return repository.GetWorklogRepo().RecalculateLeaderboard(ctx)
}

func (s *service) update(ctx context.Context, id uuid.UUID, input worklog.UpdateLogInput) error {
	return repository.GetWorklogRepo().UpdateBy(ctx, id, input)
}

func (s *service) deleteBy(ctx context.Context, id uuid.UUID) error {
	return repository.GetWorklogRepo().DeleteBy(ctx, id)
}

func (s *service) add(ctx context.Context, input worklog.CreateLogInput) (uuid.UUID, error) {
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
		UserId:       uuid.MustParse(input.UserId),
		ProjectId:    projectId,
		Description:  input.Description,
		StartAt:      startAt,
		EndAt:        endAt,
		TotalMinutes: totalMinutes,
	})
}
