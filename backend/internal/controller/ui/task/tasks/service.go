package tasks

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"slices"
	"strconv"
	"strings"
	"time"

	"github.com/goawwer/codinate/internal/adapter/dto/filters"
	"github.com/goawwer/codinate/internal/adapter/dto/task"
	"github.com/goawwer/codinate/internal/adapter/model"
	"github.com/goawwer/codinate/internal/adapter/model/enum"
	"github.com/goawwer/codinate/internal/adapter/repository"
	"github.com/goawwer/codinate/internal/controller"
	"github.com/goawwer/codinate/pkg/logger"
	"github.com/goawwer/codinate/pkg/util"
	"github.com/google/uuid"
)

type service struct{}

func (s *service) getTaskById(ctx context.Context, id uuid.UUID) (task.RowDetailed, error) {
	return repository.GetTaskRepo().GetTaskBy(ctx, id)
}

func (s *service) getAllTasks(ctx context.Context, f *task.Filters) ([]task.Row, error) {
	return repository.GetTaskRepo().GetTasksRows(ctx, f)
}

func (s *service) addTask(ctx context.Context, input task.CreateTaskInput) (uuid.UUID, error) {
	dueAt := filters.ResolveDateTime(input.DueAt)

	nextSeq, err := repository.GetTaskRepo().GetNextTaskIdentifier(ctx, input.ReleaseId)
	if err != nil {
		return uuid.Nil, err
	}

	identifier := releasePrefix(input.ReleaseId)*1000 + nextSeq

	attachedFileIds, err := util.ParseAttachedFileIds(input.AttachedFiles)
	if err != nil {
		return uuid.Nil, err
	}

	authorId := uuid.MustParse(input.AuthorId)
	assigneeId := uuid.MustParse(input.AssigneeId)

	taskModel := model.Task{
		Id:               uuid.MustParse(input.Id),
		AuthorId:         authorId,
		AssigneeId:       assigneeId,
		ProjectId:        input.ProjectId,
		ReleaseId:        input.ReleaseId,
		CategoryId:       input.CategoryId,
		PriotiryId:       input.PriorityId,
		StatusId:         input.StatusId,
		Identifier:       identifier,
		Title:            input.Title,
		Description:      input.Description,
		DueAt:            dueAt,
		AttachedFilesIds: attachedFileIds,
		Participants:     uniqueUUIDs(authorId, assigneeId),
	}

	id, err := repository.GetTaskRepo().AddNewTask(ctx, taskModel)
	if err == nil && assigneeId != authorId {
		go notifyTaskAssigned(taskModel, id)
	}

	return id, err
}

func notifyTaskAssigned(t model.Task, taskId uuid.UUID) {
	ctx := context.Background()

	related, _ := json.Marshal(map[string]any{
		"taskId":         taskId.String(),
		"taskTitle":      t.Title,
		"taskIdentifier": t.Identifier,
	})

	n := model.Notification{
		Id:               uuid.New(),
		UserId:           t.AssigneeId,
		ActorId:          t.AuthorId,
		NotificationType: "task",
		Related:          related,
		Title:            "Task assigned to you",
		Body:             fmt.Sprintf(`"%s"`, t.Title),
	}

	if err := repository.GetNotificationRepo().Create(ctx, n); err != nil {
		logger.Errorf("notifyTaskAssigned: %v", err)
	}
}

func (s *service) updateTask(ctx context.Context, input task.UpdateTaskInput, id, userId uuid.UUID) error {
	current, err := repository.GetTaskRepo().GetTaskSnapshot(ctx, id)
	if err != nil {
		return err
	}

	dueAt, _ := time.Parse(time.RFC3339Nano, input.DueAt)
	var closedAt time.Time
	if input.ClosedAt != nil {
		closedAt, _ = time.Parse(time.RFC3339Nano, *input.ClosedAt)
	}

	assigneeId := uuid.MustParse(input.AssigneeId)

	assigneeChanged := current.AssigneeId != assigneeId

	if err := repository.GetTaskRepo().UpdateTaskBy(ctx, model.Task{
		AssigneeId:  assigneeId,
		ProjectId:   input.ProjectId,
		ReleaseId:   input.ReleaseId,
		CategoryId:  input.CategoryId,
		PriotiryId:  input.PriorityId,
		StatusId:    input.StatusId,
		Title:       input.Title,
		Description: input.Description,
		DueAt:       dueAt,
		ClosedAt:    closedAt,
		UpdatedAt:   time.Now(),
	}, id); err != nil {
		return err
	}

	if assigneeChanged {
		go notifyTaskAssigned(model.Task{
			AssigneeId: assigneeId,
			AuthorId:   userId,
			Title:      input.Title,
		}, id)
	}

	if err := repository.GetTaskRepo().AddParticipant(ctx, id, assigneeId); err != nil {
		return err
	}

	changes := detectTaskChanges(current, input, id, userId)

	if len(changes) == 0 && input.CommentBody == "" {
		return nil
	}

	commentId := uuid.New()
	if _, err := repository.GetCommentRepo().Create(ctx, model.Comment{
		Id:         commentId,
		EntityType: enum.TaskCommentEntity,
		EntityId:   id,
		UserId:     userId,
		Body:       input.CommentBody,
	}); err != nil {
		return err
	}

	for i := range changes {
		changes[i].CommentId = &commentId
	}
	return repository.GetTaskRepo().RecordHistoryBatch(ctx, changes)
}

func (s *service) addParticipant(ctx context.Context, taskId, userId uuid.UUID) error {
	return repository.GetTaskRepo().AddParticipant(ctx, taskId, userId)
}

func (s *service) closeTask(ctx context.Context, id, userId uuid.UUID) error {
	if err := repository.GetTaskRepo().CloseTaskBy(ctx, id); err != nil {
		return err
	}

	commentId := uuid.New()
	if _, err := repository.GetCommentRepo().Create(ctx, model.Comment{
		Id:         commentId,
		EntityType: enum.TaskCommentEntity,
		EntityId:   id,
		UserId:     userId,
		Body:       "",
	}); err != nil {
		return err
	}

	return repository.GetTaskRepo().RecordHistoryBatch(ctx, []model.TaskHistory{{
		Id:        uuid.New(),
		TaskId:    id,
		UserId:    userId,
		CommentId: &commentId,
		FieldName: "closed",
		OldValue:  `false`,
		NewValue:  `true`,
	}})
}

func (s *service) reopenTask(ctx context.Context, id, userId uuid.UUID) error {
	if err := repository.GetTaskRepo().ReopenTaskBy(ctx, id); err != nil {
		return err
	}

	commentId := uuid.New()
	if _, err := repository.GetCommentRepo().Create(ctx, model.Comment{
		Id:         commentId,
		EntityType: enum.TaskCommentEntity,
		EntityId:   id,
		UserId:     userId,
		Body:       "",
	}); err != nil {
		return err
	}

	return repository.GetTaskRepo().RecordHistoryBatch(ctx, []model.TaskHistory{{
		Id:        uuid.New(),
		TaskId:    id,
		UserId:    userId,
		CommentId: &commentId,
		FieldName: "closed",
		OldValue:  `true`,
		NewValue:  `false`,
	}})
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

func (s *service) suggestionsBy(ctx context.Context, b controller.BasicQueryParams) ([]task.Suggestion, error) {
	return repository.GetTaskRepo().GetTasksSuggestion(ctx, b)
}

func (s *service) getDeadlinePressure(ctx context.Context, userId uuid.UUID) (task.DeadlinePressure, error) {
	return repository.GetTaskRepo().GetDeadlinePressure(ctx, userId)
}

func (s *service) getStatusDistribution(ctx context.Context, userId uuid.UUID) ([]task.StatusDistributionItem, error) {
	return repository.GetTaskRepo().GetStatusDistribution(ctx, userId)
}

func (s *service) getTasksByStatus(ctx context.Context, statusId, page int, userId uuid.UUID) (task.StatusTasksPage, error) {
	return repository.GetTaskRepo().GetTasksByStatus(ctx, statusId, page, userId)
}

func (s *service) getVelocity(ctx context.Context, userId uuid.UUID) (task.VelocityData, error) {
	return repository.GetTaskRepo().GetVelocity(ctx, userId)
}

// detectTaskChanges builds history entries comparing snapshot (with resolved names) against
// the incoming input. String names are stored directly so the frontend can display them
// without needing to resolve IDs.
func detectTaskChanges(current model.TaskSnapshot, input task.UpdateTaskInput, taskId, userId uuid.UUID) []model.TaskHistory {
	var entries []model.TaskHistory

	addStr := func(field, oldName, newName string) {
		if oldName == newName {
			return
		}
		oldJSON, _ := json.Marshal(oldName)
		newJSON, _ := json.Marshal(newName)
		entries = append(entries, model.TaskHistory{
			Id:        uuid.New(),
			TaskId:    taskId,
			UserId:    userId,
			FieldName: field,
			OldValue:  string(oldJSON),
			NewValue:  string(newJSON),
		})
	}

	oldAssignee := strings.TrimSpace(current.AssigneeName + " " + current.AssigneeSurname)
	if newAssignee := uuid.MustParse(input.AssigneeId); current.AssigneeId != newAssignee {
		addStr("assignee", oldAssignee, input.AssigneeName)
	}
	if current.StatusId != input.StatusId {
		addStr("status", current.StatusName, input.StatusName)
	}
	if current.CategoryId != input.CategoryId {
		addStr("category", current.CategoryName, input.CategoryName)
	}
	if current.PriotiryId != input.PriorityId {
		addStr("priority", current.PriorityName, input.PriorityName)
	}
	if current.ReleaseId != input.ReleaseId {
		addStr("release", current.ReleaseName, input.ReleaseName)
	}
	if current.Title != input.Title {
		addStr("title", current.Title, input.Title)
	}
	if newDue, err := time.Parse(time.RFC3339Nano, input.DueAt); err == nil {
		if !current.DueAt.Equal(newDue) {
			addStr("dueAt",
				current.DueAt.Format("2006-01-02"),
				newDue.Format("2006-01-02"),
			)
		}
	}

	return entries
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
