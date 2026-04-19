package repository

import (
	"context"

	"github.com/goawwer/codinate/internal/adapter/database"
	"github.com/goawwer/codinate/internal/adapter/dto/shared"
	"github.com/goawwer/codinate/internal/adapter/dto/task"
	"github.com/goawwer/codinate/internal/adapter/model"
	"github.com/goawwer/codinate/pkg/logger"
	"github.com/goawwer/codinate/pkg/util"
	"github.com/google/uuid"
)

type TaskRepo interface {
	// Core
	GetTasksRows(ctx context.Context, f *task.Filters) ([]task.Row, error)
	GetTaskBy(ctx context.Context, id uuid.UUID) (task.RowDetailed, error)
	GetTaskAuthorId(ctx context.Context, taskId uuid.UUID) (uuid.UUID, error)
	AddNewTask(ctx context.Context, input model.Task) (shared.IdOutput, error)
	GetNextTaskIdentifier(ctx context.Context, releaseId int) (int, error)
	UpdateTaskBy(ctx context.Context, newTask model.Task, id uuid.UUID) error
	CloseTaskBy(ctx context.Context, id uuid.UUID) error
	DeleteTaskBy(ctx context.Context, id uuid.UUID) error

	// Priorities
	GetTaskPriorities(ctx context.Context) ([]shared.IdWithName, error)
	AddTaskPriority(ctx context.Context, name string) error
	UpdateTaskPriority(ctx context.Context, id int, newName string) error
	DeleteTaskPriorityById(ctx context.Context, id int) error

	// Statuses
	GetTaskStatuses(ctx context.Context) ([]shared.IdWithName, error)
	AddTaskStatus(ctx context.Context, name string) error
	UpdateTaskStatus(ctx context.Context, id int, newName string) error
	DeleteTaskStatusById(ctx context.Context, id int) error

	// categories
	GetAllCategoriesBy(ctx context.Context, proejctId int) ([]shared.IdWithName, error)
	AddNewCategory(ctx context.Context, name shared.NameInput, projectId int) error
	UpdateCategory(ctx context.Context, name shared.NameInput, id int) error
	DeleteCategorty(ctx context.Context, id int) error
}

type taskRepoImpl struct {
	*database.CoreRepository
}

func GetTaskRepo() TaskRepo {
	r := database.GetCoreRepository()
	return &taskRepoImpl{r}
}

func (r *taskRepoImpl) GetTasksRows(ctx context.Context, f *task.Filters) ([]task.Row, error) {
	var qb QueryFiltersBuilder
	var res []task.Row

	searchCol, err := util.GetDBColumn(model.Task{}, f.SearchBy.Column, nil)
	if err != nil && f.SearchBy.Column != "" {
		return nil, err
	}

	orderCol, err := util.GetDBColumn(model.Task{}, f.SortBy.Column, nil)
	if err != nil && f.SortBy.Column != "" {
		return nil, err
	}

	err = r.SelectContext(ctx, &res, r.getTaskClause()+
		qb.In(util.GetDBColumnsFiltersValuesMap(nil, model.Task{}, f)).
			Like(searchCol, f.SearchBy.Value).
			Order(orderCol, f.SortBy.Direction, "t.created_at", "DESC").
			Limit(f.Paging.GetOffset(), f.Paging.GetLimit()).
			Build(),
	)

	if res == nil {
		return []task.Row{}, err
	}

	return res, err
}

func (r *taskRepoImpl) GetTaskBy(ctx context.Context, id uuid.UUID) (task.RowDetailed, error) {
	var result task.RowDetailed

	err := r.SelectContext(ctx, &result, r.getTaskClause()+"WHERE id = $1", id)

	return result, err
}

func (r *taskRepoImpl) GetTaskAuthorId(ctx context.Context, taskId uuid.UUID) (uuid.UUID, error) {
	var authorId uuid.UUID

	err := r.SelectContext(ctx, &authorId, "SELECT author_id FROM tasks WHERE id = $1", taskId)

	return authorId, err
}

func (r *taskRepoImpl) AddNewTask(ctx context.Context, input model.Task) (shared.IdOutput, error) {
	var out shared.IdOutput

	rows, err := r.NamedQueryContext(ctx, `
		INSERT INTO tasks (
			author_id, assignee_id, project_id,
			release_id, category_id, priority_id,
			status_id, identifier, title, description, due_at
		)
		VALUES (
			:author_id, :assignee_id, :project_id,
			:release_id, :category_id, :priority_id,
			:status_id, :identifier, :title, :description, :due_at
		)
		RETURNING id
	`, input)

	defer func() {
		if err := rows.Close(); err != nil {
			logger.Errorf("failed to close rows on add new task method: %v", err)
		}
	}()

	if rows.Next() {
		rows.Scan(&out.Id)
	}

	return out, err
}

func (r *taskRepoImpl) GetNextTaskIdentifier(ctx context.Context, releaseId int) (int, error) {
	var nextSeq int

	err := r.QueryRowContext(ctx, `
		SELECT COALESCE(MAX(identifier) % 1000, 0) + 1
		FROM tasks
		WHERE release_id = $1
	`, releaseId).Scan(&nextSeq)

	return nextSeq, err
}

func (r *taskRepoImpl) UpdateTaskBy(ctx context.Context, newTask model.Task, id uuid.UUID) error {
	var qb QueryFiltersBuilder

	clause := qb.Update(util.GetDBColumnsFiltersValuesMap(nil, model.Task{}, &newTask)).
		Eq("id::uuid", id).
		Build()

	_, err := r.ExecContext(ctx, "UPDATE users "+clause)

	return err
}

func (r *taskRepoImpl) CloseTaskBy(ctx context.Context, id uuid.UUID) error {
	_, err := r.QueryContext(ctx, `
		UPDATE tasks SET closed_at = now()
		WHERE id = $1
	`, id)

	return err
}

func (r *taskRepoImpl) DeleteTaskBy(ctx context.Context, id uuid.UUID) error {
	_, err := r.QueryContext(ctx, `
		DELETE FROM tasks
		WHERE id = $1
	`, id)

	return err
}

func (r *taskRepoImpl) GetTaskPriorities(ctx context.Context) ([]shared.IdWithName, error) {
	var res []shared.IdWithName

	err := r.SelectContext(ctx, &res, `SELECT * FROM task_priorities`)

	return res, err
}

func (r *taskRepoImpl) AddTaskPriority(ctx context.Context, name string) error {
	_, err := r.QueryContext(ctx, `
		INSERT INTO task_priorities (name)
		VALUES ($1)
	`, name)

	return err
}

func (r *taskRepoImpl) UpdateTaskPriority(ctx context.Context, id int, newName string) error {
	_, err := r.QueryContext(ctx, `
		UPDATE task_priorities SET name = $1
		WHERE id = $2
	`, newName, id)

	return err
}

func (r *taskRepoImpl) DeleteTaskPriorityById(ctx context.Context, id int) error {
	_, err := r.QueryContext(ctx, `
		DELETE FROM task_priorities
		WHERE id = $1
	`, id)

	return err
}

func (r *taskRepoImpl) GetTaskStatuses(ctx context.Context) ([]shared.IdWithName, error) {
	var res []shared.IdWithName

	err := r.SelectContext(ctx, &res, `SELECT * FROM task_statuses`)

	return res, err
}

func (r *taskRepoImpl) AddTaskStatus(ctx context.Context, name string) error {
	_, err := r.QueryContext(ctx, `
		INSERT INTO task_statuses (name)
		VALUES ($1)
	`, name)

	return err
}

func (r *taskRepoImpl) UpdateTaskStatus(ctx context.Context, id int, newName string) error {
	_, err := r.QueryContext(ctx, `
		UPDATE task_statuses SET name = $1
		WHERE id = $2
	`, newName, id)

	return err
}

func (r *taskRepoImpl) DeleteTaskStatusById(ctx context.Context, id int) error {
	_, err := r.QueryContext(ctx, `
		DELETE FROM task_statuses
		WHERE id = $1
	`, id)

	return err
}

func (r *taskRepoImpl) GetAllCategoriesBy(ctx context.Context, proejctId int) ([]shared.IdWithName, error) {
	var res []shared.IdWithName

	err := r.SelectContext(ctx, &res, `
		SELECT id, name FROM task_categories
		WHERE project_id = $1
	`, proejctId)

	return res, err
}

func (r *taskRepoImpl) AddNewCategory(ctx context.Context, input shared.NameInput, projectId int) error {
	_, err := r.QueryContext(ctx, `
		INSERT INTO task_categories (name, project_id)
		VALUES ($1, $2)
	`, input.Name, projectId)

	return err
}

func (r *taskRepoImpl) UpdateCategory(ctx context.Context, input shared.NameInput, id int) error {
	_, err := r.QueryContext(ctx, `
		UPDATE task_categories SET name = $1
		WHERE id = $2
	`, input.Name, id)

	return err
}

func (r *taskRepoImpl) DeleteCategorty(ctx context.Context, id int) error {
	_, err := r.QueryContext(ctx, `
		DELETE FROM task_categories
		WHERE id = $1
	`, id)

	return err
}

func (r *taskRepoImpl) getTaskClause() string {
	return `
		SELECT
			t.id,
			u.username as assignee_username,
			p.picture_name as project_picture,
			tc.name as category,
			tp.name as priority,
			ts.name as status,
			t.identifier,
			t.title,
			t.description,
		 	t.created_at,
			t.due_at,
			t.closed_at
		FROM tasks t
		LEFT JOIN users u ON t.assignee_id = u.id
		LEFT JOIN projects p ON t.project_id = p.id
		LEFT JOIN task_categories tc ON t.category_id = tc.id
		LEFT JOIN task_priorities tp ON t.priority_id = tp.id
		LEFT JOIN task_statuses ts ON t.status_id = ts.id
	`
}
