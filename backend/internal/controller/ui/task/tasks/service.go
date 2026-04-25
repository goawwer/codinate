package tasks

import (
	"context"
	"errors"
	"slices"
	"strconv"
	"time"

	"github.com/goawwer/codinate/internal/adapter/dto/filters"
	"github.com/goawwer/codinate/internal/adapter/dto/shared"
	"github.com/goawwer/codinate/internal/adapter/dto/task"
	"github.com/goawwer/codinate/internal/adapter/model"
	"github.com/goawwer/codinate/internal/adapter/model/enum"
	"github.com/goawwer/codinate/internal/adapter/repository"
	"github.com/google/uuid"
)

type service struct{}

func (s *service) getTaskById(ctx context.Context, id uuid.UUID) (task.RowDetailed, error) {
	return repository.GetTaskRepo().GetTaskBy(ctx, id)
}

func (s *service) getAllTasks(ctx context.Context, f *task.Filters) ([]task.Row, error) {
	return repository.GetTaskRepo().GetTasksRows(ctx, f)
}

func (s *service) addTask(ctx context.Context, input task.CreateTaskInput) (shared.IdOutput, error) {
	dueAt := filters.ResolveDateTime(input.DueAt)

	nextSeq, err := repository.GetTaskRepo().GetNextTaskIdentifier(ctx, input.ReleaseId)
	if err != nil {
		return shared.IdOutput{}, err
	}

	identifier := releasePrefix(input.ReleaseId)*1000 + nextSeq

	return repository.GetTaskRepo().AddNewTask(ctx, model.Task{
		AuthorId:     uuid.MustParse(input.AuthorId),
		AssigneeId:   uuid.MustParse(input.AssigneeId),
		ProjectId:    input.ProjectId,
		ReleaseId:    input.ReleaseId,
		CategoryId:   input.CategoryId,
		PriotiryId:   input.PriorityId,
		StatusId:     input.StatusId,
		Identifier:   identifier,
		Title:        input.Title,
		Description:  input.Description,
		DueAt:        dueAt,
		Participants: uniqueUUIDs(uuid.MustParse(input.AuthorId), uuid.MustParse(input.AssigneeId)),
	})
}

func (s *service) updateTask(ctx context.Context, input task.UpdateTaskInput, id uuid.UUID) error {
	dueAt, _ := time.Parse(time.RFC3339Nano, input.DueAt)
	var closedAt time.Time
	if input.ClosedAt != nil {
		closedAt, _ = time.Parse(time.RFC3339Nano, *input.ClosedAt)
	}

	return repository.GetTaskRepo().UpdateTaskBy(ctx, model.Task{
		AssigneeId:  uuid.MustParse(input.AssigneeId),
		ProjectId:   input.ProjectId,
		ReleaseId:   input.ReleaseId,
		CategoryId:  input.CategoryId,
		PriotiryId:  input.PriorityId,
		StatusId:    input.StatusId,
		Title:       input.Title,
		Description: input.Description,
		DueAt:       dueAt,
		ClosedAt:    closedAt,
	}, id)
}

func (s *service) closeTask(ctx context.Context, id uuid.UUID) error {
	return repository.GetTaskRepo().CloseTaskBy(ctx, id)
}

func (s *service) deleteTask(ctx context.Context, taskId, userId uuid.UUID, userRole enum.PermissionRole) error {
	taskAuthorId, err := repository.GetTaskRepo().GetTaskAuthorId(ctx, taskId)
	if err != nil {
		return err
	}

	if taskAuthorId != userId || !slices.Contains(enum.AtLeastAdmin, userRole) {
		return errors.New("you don't have permission to delete current task")
	}

	return repository.GetTaskRepo().DeleteTaskBy(ctx, taskId)
}

func uniqueUUIDs(ids ...uuid.UUID) []uuid.UUID {
	seen := make(map[uuid.UUID]struct{}, len(ids))
	out := make([]uuid.UUID, 0, len(ids))
	for _, id := range ids {
		if _, ok := seen[id]; !ok {
			seen[id] = struct{}{}
			out = append(out, id)
		}
	}
	return out
}

func releasePrefix(releaseId int) int {
	s := strconv.Itoa(releaseId)
	if len(s) == 1 {
		s = "0" + s
	}
	prefix, _ := strconv.Atoi(s[:2])
	return prefix
}
