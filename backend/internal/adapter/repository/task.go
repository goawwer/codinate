package repository

import (
	"context"
	"fmt"
	"math"
	"time"

	"github.com/goawwer/codinate/internal/adapter/database"
	"github.com/goawwer/codinate/internal/adapter/dto/shared"
	"github.com/goawwer/codinate/internal/adapter/dto/task"
	"github.com/goawwer/codinate/internal/adapter/model"
	"github.com/goawwer/codinate/internal/controller"
	"github.com/goawwer/codinate/pkg/util"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
)

type TaskRepo interface {
	// Core
	GetTasksRows(ctx context.Context, f *task.Filters) ([]task.Row, error)
	GetTaskBy(ctx context.Context, id uuid.UUID) (task.RowDetailed, error)
	GetTaskAuthorId(ctx context.Context, taskId uuid.UUID) (uuid.UUID, error)
	GetTaskProjectId(ctx context.Context, taskId uuid.UUID) (int, error)
	GetTaskSnapshot(ctx context.Context, id uuid.UUID) (model.TaskSnapshot, error)
	AddNewTask(ctx context.Context, input model.Task) (uuid.UUID, error)
	GetNextTaskIdentifier(ctx context.Context, releaseId int) (int, error)
	GetTasksSuggestion(ctx context.Context, b controller.BasicQueryParams) ([]task.Suggestion, error)
	UpdateTaskBy(ctx context.Context, newTask model.Task, id uuid.UUID) error
	AddParticipant(ctx context.Context, taskId, userId uuid.UUID) error
	AttachFilesToTask(ctx context.Context, taskId uuid.UUID, fileIds []uuid.UUID) error
	DetachFileFromTask(ctx context.Context, taskId, fileId uuid.UUID) error
	CloseTaskBy(ctx context.Context, id uuid.UUID) error
	ReopenTaskBy(ctx context.Context, id uuid.UUID) error
	DeleteTaskBy(ctx context.Context, id uuid.UUID) error
	RecordHistoryBatch(ctx context.Context, entries []model.TaskHistory) error
	GetDeadlinePressure(ctx context.Context) (task.DeadlinePressure, error)
	GetStatusDistribution(ctx context.Context) ([]task.StatusDistributionItem, error)
	GetTasksByStatus(ctx context.Context, statusId, page int) (task.StatusTasksPage, error)
	GetVelocity(ctx context.Context) (task.VelocityData, error)

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
	res := make([]task.Row, 0)

	customNames := map[string]string{
		"authorId":   "t.author_id",
		"updatedAt":  "t.updated_at",
		"createdAt":  "t.updated_at",
		"projectId":  "t.project_id",
		"releaseId":  "t.release_id",
		"categoryId": "t.category_id",
		"priorityId": "t.priority_id",
		"statusId":   "t.status_id",
		"assigneeId": "t.assignee_id",
		"title":      "t.title",
	}

	searchCol, err := util.GetDBColumn(model.Task{}, f.SearchBy.Column, customNames)
	if err != nil && f.SearchBy.Column != "" {
		return nil, err
	}

	orderCol, err := util.GetDBColumn(model.Task{}, f.SortBy.Column, customNames)
	if err != nil && f.SortBy.Column != "" {
		return nil, err
	}

	err = r.SelectContext(ctx, &res, `
			SELECT
				t.id,
				u.username as assignee_username,
				p.name as project_name,
				p.picture_name as project_picture,
				pr.title as release,
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
			LEFT JOIN project_releases pr ON t.release_id = pr.id
			LEFT JOIN task_categories tc ON t.category_id = tc.id
			LEFT JOIN task_priorities tp ON t.priority_id = tp.id
			LEFT JOIN task_statuses ts ON t.status_id = ts.id
		`+
		qb.In(util.GetDBColumnsFiltersValuesMap(customNames, model.Task{}, f)).
			FilterWithOperator("t.due_at::TIMESTAMP", f.DateRange.From, ">=").
			FilterWithOperator("t.due_at::TIMESTAMP", f.DateRange.To, "<").
			Eq("t.identifier", f.Identifier).
			Like(searchCol, f.SearchBy.Value).
			Order(orderCol, f.SortBy.Direction, "t.updated_at", "DESC").
			Limit(f.Paging.GetOffset(), f.Paging.GetLimit()).
			Build(),
	)

	return res, err
}

func (r *taskRepoImpl) GetTaskBy(ctx context.Context, id uuid.UUID) (task.RowDetailed, error) {
	var result task.RowDetailed

	err := r.QueryRowContext(ctx, `
		SELECT
			t.id,
			t.project_id,
			COALESCE(t.release_id, 0) AS release_id,
			COALESCE(t.category_id, 0) AS category_id,
			t.author_id,
			au.name AS author_name,
			au.surname AS author_surname,
			asn.id AS assignee_id,
			asn.username AS assignee_username,
			asn.name AS assignee_name,
			asn.surname AS assignee_surname,
			asn.avatar AS assignee_picture,
			COALESCE(
				json_agg(
					json_build_object(
						'id',      mu.id,
						'name',    mu.name,
						'surname', mu.surname,
						'role',    er.name,
						'picture', mu.avatar
					)
				) FILTER (WHERE mu.id IS NOT NULL),
				'[]'::json
			) AS members,
			COALESCE(
				(SELECT json_agg(json_build_object('id', f.id, 'name', f.name))
				 FROM files f
				 WHERE f.id = ANY(t.attached_files_ids)),
				'[]'::json
			) AS attached_files,
			p.name AS project_name,
			p.picture_name AS project_picture,
			pr.title AS release,
			tc.name AS category,
			tp.name AS priority,
			ts.name AS status,
			t.identifier,
			t.title,
			t.description,
			t.created_at,
			t.updated_at,
			t.due_at,
			t.closed_at
		FROM tasks t
		LEFT JOIN users au ON t.author_id = au.id
		LEFT JOIN users asn ON t.assignee_id = asn.id
		LEFT JOIN projects p ON t.project_id = p.id
		LEFT JOIN project_releases pr ON t.release_id = pr.id
		LEFT JOIN task_categories tc ON t.category_id = tc.id
		LEFT JOIN task_priorities tp ON t.priority_id = tp.id
		LEFT JOIN task_statuses ts ON t.status_id = ts.id
		LEFT JOIN task_participants tpart ON t.id = tpart.task_id
		LEFT JOIN users mu ON tpart.user_id = mu.id
		LEFT JOIN employee_roles er ON tpart.role_id = er.id
		WHERE t.id = $1
		GROUP BY
			t.id, t.project_id, t.release_id, t.category_id,
			au.name, au.surname,
			asn.id, asn.username, asn.name, asn.surname,
			p.name, p.picture_name, pr.title,
			tc.name, tp.name, ts.name
	`, id).StructScan(&result)

	fmt.Println(result)

	return result, err
}

func (r *taskRepoImpl) GetTaskAuthorId(ctx context.Context, taskId uuid.UUID) (uuid.UUID, error) {
	var authorId uuid.UUID

	err := r.QueryRowContext(ctx, "SELECT author_id FROM tasks WHERE id = $1", taskId).Scan(&authorId)

	return authorId, err
}

func (r *taskRepoImpl) GetTaskSnapshot(ctx context.Context, id uuid.UUID) (model.TaskSnapshot, error) {
	var s model.TaskSnapshot
	err := r.GetContext(ctx, &s, `
		SELECT
			t.id, t.assignee_id, t.project_id, t.release_id, t.category_id,
			t.priority_id, t.status_id, t.title, t.description, t.due_at,
			COALESCE(u.name, '')   AS assignee_name,
			COALESCE(u.surname, '') AS assignee_surname,
			COALESCE(ts.name, '')  AS status_name,
			COALESCE(tc.name, '')  AS category_name,
			COALESCE(tp.name, '')  AS priority_name,
			COALESCE(pr.title, '') AS release_name
		FROM tasks t
		LEFT JOIN users u             ON t.assignee_id  = u.id
		LEFT JOIN task_statuses ts    ON t.status_id    = ts.id
		LEFT JOIN task_categories tc  ON t.category_id  = tc.id
		LEFT JOIN task_priorities tp  ON t.priority_id  = tp.id
		LEFT JOIN project_releases pr ON t.release_id   = pr.id
		WHERE t.id = $1
	`, id)
	return s, err
}

func (r *taskRepoImpl) RecordHistoryBatch(ctx context.Context, entries []model.TaskHistory) error {
	if len(entries) == 0 {
		return nil
	}
	return r.RunInTransaction(ctx, func(tx *sqlx.Tx) error {
		for _, e := range entries {
			if _, err := tx.ExecContext(ctx, `
				INSERT INTO task_history (id, task_id, user_id, comment_id, field_name, old_value, new_value)
				VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb)
			`, e.Id, e.TaskId, e.UserId, e.CommentId, e.FieldName, e.OldValue, e.NewValue); err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *taskRepoImpl) GetTaskProjectId(ctx context.Context, taskId uuid.UUID) (int, error) {
	var projectId int

	err := r.QueryRowContext(ctx, "SELECT project_id FROM tasks WHERE id = $1", taskId).Scan(&projectId)

	return projectId, err
}

func (r *taskRepoImpl) AddNewTask(ctx context.Context, input model.Task) (uuid.UUID, error) {
	mentionIDs := util.ExtractMentionIDs(input.Description)

	err := r.RunInTransaction(ctx, func(tx *sqlx.Tx) error {
		if _, err := tx.ExecContext(ctx, `
			INSERT INTO tasks (
				id, author_id, assignee_id, project_id,
				release_id, category_id, priority_id,
				status_id, identifier, title, description, due_at, attached_files_ids
			)
			VALUES (
				$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::uuid[]
			)
		`,
			input.Id, input.AuthorId, input.AssigneeId, input.ProjectId,
			input.ReleaseId, input.CategoryId, input.PriotiryId,
			input.StatusId, input.Identifier, input.Title, input.Description, input.DueAt,
			pq.Array(input.AttachedFilesIds),
		); err != nil {
			return err
		}

		for _, userID := range input.Participants {
			if _, err := tx.ExecContext(ctx, `
        		INSERT INTO task_participants (task_id, user_id, role_id)
          		VALUES ($1, $2, (SELECT u.role_id FROM users u WHERE u.id = $2))
            `, input.Id, userID); err != nil {
				return err
			}
		}

		for _, mentionedID := range mentionIDs {
			if _, err := tx.ExecContext(ctx, `
				INSERT INTO mentions (entity_type, entity_id, mentioned_user_id)
				VALUES ('task', $1, $2)
				ON CONFLICT DO NOTHING
			`, input.Id, mentionedID); err != nil {
				return err
			}
		}

		return nil
	})

	return input.Id, err
}

func (r *taskRepoImpl) AddParticipant(ctx context.Context, taskId, userId uuid.UUID) error {
	_, err := r.ExecContext(ctx, `
		INSERT INTO task_participants (task_id, user_id, role_id)
		VALUES ($1, $2, (SELECT role_id FROM users WHERE id = $2))
		ON CONFLICT DO NOTHING
	`, taskId, userId)
	return err
}

func (r *taskRepoImpl) AttachFilesToTask(ctx context.Context, taskId uuid.UUID, fileIds []uuid.UUID) error {
	strIds := make([]string, len(fileIds))
	for i, id := range fileIds {
		strIds[i] = id.String()
	}
	_, err := r.ExecContext(ctx, `
		UPDATE tasks
		SET attached_files_ids = array_cat(COALESCE(attached_files_ids, '{}'::uuid[]), $1::text[]::uuid[])
		WHERE id = $2
	`, pq.Array(strIds), taskId)
	return err
}

func (r *taskRepoImpl) DetachFileFromTask(ctx context.Context, taskId, fileId uuid.UUID) error {
	_, err := r.ExecContext(ctx, `
		UPDATE tasks
		SET attached_files_ids = array_remove(COALESCE(attached_files_ids, '{}'::uuid[]), $1)
		WHERE id = $2
	`, fileId, taskId)
	return err
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

func (r *taskRepoImpl) GetTasksSuggestion(ctx context.Context, b controller.BasicQueryParams) ([]task.Suggestion, error) {
	var qb QueryFiltersBuilder
	res := make([]task.Suggestion, 0)

	err := r.SelectContext(ctx, &res, `
		SELECT id, identifier, title
		FROM tasks
		`+
		qb.Like("CAST(identifier AS TEXT)", b.SearchValue).
			Order("created_at", "DESC").
			Limit(0, b.PagesLimit).
			Build(),
	)

	return res, err
}

func (r *taskRepoImpl) UpdateTaskBy(ctx context.Context, newTask model.Task, id uuid.UUID) error {
	var qb QueryFiltersBuilder

	clause := qb.Update(util.GetDBColumnsFiltersValuesMap(nil, model.Task{}, &newTask)).
		Eq("id::uuid", id).
		Build()

	return r.RunInTransaction(ctx, func(tx *sqlx.Tx) error {
		if _, err := tx.ExecContext(ctx, "UPDATE tasks "+clause, qb.Args()...); err != nil {
			return err
		}

		if newTask.Description != "" {
			mentionIDs := util.ExtractMentionIDs(newTask.Description)
			if _, err := tx.ExecContext(ctx, "DELETE FROM mentions WHERE entity_type = 'task' AND entity_id = $1", id); err != nil {
				return err
			}
			for _, mentionedID := range mentionIDs {
				if _, err := tx.ExecContext(ctx, `
					INSERT INTO mentions (entity_type, entity_id, mentioned_user_id)
					VALUES ('task', $1, $2)
					ON CONFLICT DO NOTHING
				`, id, mentionedID); err != nil {
					return err
				}
			}
		}

		return nil
	})
}

func (r *taskRepoImpl) CloseTaskBy(ctx context.Context, id uuid.UUID) error {
	_, err := r.ExecContext(ctx, `
		UPDATE tasks SET closed_at = now()
		WHERE id = $1
	`, id)

	return err
}

func (r *taskRepoImpl) ReopenTaskBy(ctx context.Context, id uuid.UUID) error {
	_, err := r.ExecContext(ctx, `
		UPDATE tasks SET closed_at = '0001-01-01 00:00:00'
		WHERE id = $1
	`, id)

	return err
}

func (r *taskRepoImpl) DeleteTaskBy(ctx context.Context, id uuid.UUID) error {

	err := r.RunInTransaction(ctx, func(tx *sqlx.Tx) error {
		if _, err := tx.ExecContext(ctx, `
   			DELETE FROM task_participants
      		WHERE task_id = $1
		`, id); err != nil {
			return err
		}

		_, err := tx.ExecContext(ctx, `
			DELETE FROM tasks
			WHERE id = $1
		`, id)

		return err
	})

	return err
}

func (r *taskRepoImpl) GetTaskPriorities(ctx context.Context) ([]shared.IdWithName, error) {
	res := make([]shared.IdWithName, 0)

	err := r.SelectContext(ctx, &res, `SELECT * FROM task_priorities`)

	return res, err
}

func (r *taskRepoImpl) AddTaskPriority(ctx context.Context, name string) error {
	_, err := r.ExecContext(ctx, `
		INSERT INTO task_priorities (name)
		VALUES ($1)
	`, name)

	return err
}

func (r *taskRepoImpl) UpdateTaskPriority(ctx context.Context, id int, newName string) error {
	_, err := r.ExecContext(ctx, `
		UPDATE task_priorities SET name = $1
		WHERE id = $2
	`, newName, id)

	return err
}

func (r *taskRepoImpl) DeleteTaskPriorityById(ctx context.Context, id int) error {
	_, err := r.ExecContext(ctx, `
		DELETE FROM task_priorities
		WHERE id = $1
	`, id)

	return err
}

func (r *taskRepoImpl) GetTaskStatuses(ctx context.Context) ([]shared.IdWithName, error) {
	res := make([]shared.IdWithName, 0)

	err := r.SelectContext(ctx, &res, `SELECT * FROM task_statuses`)

	return res, err
}

func (r *taskRepoImpl) AddTaskStatus(ctx context.Context, name string) error {
	_, err := r.ExecContext(ctx, `
		INSERT INTO task_statuses (name)
		VALUES ($1)
	`, name)

	return err
}

func (r *taskRepoImpl) UpdateTaskStatus(ctx context.Context, id int, newName string) error {
	_, err := r.ExecContext(ctx, `
		UPDATE task_statuses SET name = $1
		WHERE id = $2
	`, newName, id)

	return err
}

func (r *taskRepoImpl) DeleteTaskStatusById(ctx context.Context, id int) error {
	_, err := r.ExecContext(ctx, `
		DELETE FROM task_statuses
		WHERE id = $1
	`, id)

	return err
}

func (r *taskRepoImpl) GetAllCategoriesBy(ctx context.Context, proejctId int) ([]shared.IdWithName, error) {
	res := make([]shared.IdWithName, 0)

	err := r.SelectContext(ctx, &res, `
		SELECT id, name FROM task_categories
		WHERE project_id = $1
	`, proejctId)

	return res, err
}

func (r *taskRepoImpl) AddNewCategory(ctx context.Context, input shared.NameInput, projectId int) error {
	_, err := r.ExecContext(ctx, `
		INSERT INTO task_categories (name, project_id)
		VALUES ($1, $2)
	`, input.Name, projectId)

	return err
}

func (r *taskRepoImpl) UpdateCategory(ctx context.Context, input shared.NameInput, id int) error {
	_, err := r.ExecContext(ctx, `
		UPDATE task_categories SET name = $1
		WHERE id = $2
	`, input.Name, id)

	return err
}

func (r *taskRepoImpl) DeleteCategorty(ctx context.Context, id int) error {
	_, err := r.ExecContext(ctx, `
		DELETE FROM task_categories
		WHERE id = $1
	`, id)

	return err
}

func (r *taskRepoImpl) GetDeadlinePressure(ctx context.Context) (task.DeadlinePressure, error) {
	overdue := make([]task.DeadlineTask, 0)

	if err := r.SelectContext(ctx, &overdue, `
		SELECT id, title, due_at
		FROM tasks
		WHERE due_at IS NOT NULL
			AND due_at::date < CURRENT_DATE
			AND (closed_at IS NULL OR closed_at < '0002-01-01'::timestamp)
		ORDER BY due_at DESC
	`); err != nil {
		return task.DeadlinePressure{}, err
	}

	upcoming := make([]task.DeadlineTask, 0)

	if err := r.SelectContext(ctx, &upcoming, `
		SELECT id, title, due_at
		FROM tasks
		WHERE due_at IS NOT NULL
			AND due_at::date >= CURRENT_DATE
			AND due_at::date < CURRENT_DATE + INTERVAL '14 days'
			AND (closed_at IS NULL OR closed_at < '0002-01-01'::timestamp)
		ORDER BY due_at ASC
	`); err != nil {
		return task.DeadlinePressure{}, err
	}

	return task.DeadlinePressure{Overdue: overdue, Upcoming: upcoming}, nil
}

func (r *taskRepoImpl) GetStatusDistribution(ctx context.Context) ([]task.StatusDistributionItem, error) {
	res := make([]task.StatusDistributionItem, 0)

	err := r.SelectContext(ctx, &res, `
		SELECT ts.name AS status, COUNT(t.id) AS count
		FROM tasks t
		JOIN task_statuses ts ON t.status_id = ts.id
		WHERE (t.closed_at IS NULL OR t.closed_at < '0002-01-01'::timestamp)
		GROUP BY ts.name
		ORDER BY count DESC
	`)

	return res, err
}

func (r *taskRepoImpl) GetTasksByStatus(ctx context.Context, statusId, page int) (task.StatusTasksPage, error) {
	const pageSize = 5
	offset := page * pageSize

	var total int
	if err := r.QueryRowContext(ctx, `
		SELECT COUNT(*)
		FROM tasks
		WHERE status_id = $1
			AND (closed_at IS NULL OR closed_at < '0002-01-01'::timestamp)
	`, statusId).Scan(&total); err != nil {
		return task.StatusTasksPage{}, err
	}

	items := make([]task.Row, 0)
	if err := r.SelectContext(ctx, &items, `
		SELECT
			t.id,
			u.username  AS assignee_username,
			p.name      AS project_name,
			p.picture_name AS project_picture,
			pr.title    AS release,
			tc.name     AS category,
			tp.name     AS priority,
			ts.name     AS status,
			t.identifier,
			t.title,
			t.description,
			t.created_at,
			t.due_at,
			t.closed_at
		FROM tasks t
		LEFT JOIN users u              ON t.assignee_id  = u.id
		LEFT JOIN projects p           ON t.project_id   = p.id
		LEFT JOIN project_releases pr  ON t.release_id   = pr.id
		LEFT JOIN task_categories tc   ON t.category_id  = tc.id
		LEFT JOIN task_priorities tp   ON t.priority_id  = tp.id
		LEFT JOIN task_statuses ts     ON t.status_id    = ts.id
		WHERE t.status_id = $1
			AND (t.closed_at IS NULL OR t.closed_at < '0002-01-01'::timestamp)
		ORDER BY t.updated_at DESC
		LIMIT $2 OFFSET $3
	`, statusId, pageSize, offset); err != nil {
		return task.StatusTasksPage{}, err
	}

	return task.StatusTasksPage{Items: items, Total: total}, nil
}

func (r *taskRepoImpl) GetVelocity(ctx context.Context) (task.VelocityData, error) {
	type rawRow struct {
		Day   time.Time `db:"day"`
		Count int       `db:"count"`
	}

	rows := make([]rawRow, 0)
	if err := r.SelectContext(ctx, &rows, `
		SELECT day, SUM(cnt) AS count FROM (
			SELECT created_at::date AS day, COUNT(*) AS cnt
			FROM tasks
			WHERE created_at::date >= CURRENT_DATE - INTERVAL '13 days'
			GROUP BY day
			UNION ALL
			SELECT closed_at::date AS day, COUNT(*) AS cnt
			FROM tasks
			WHERE closed_at IS NOT NULL
				AND closed_at >= '0002-01-01'::timestamp
				AND closed_at::date >= CURRENT_DATE - INTERVAL '13 days'
			GROUP BY day
			UNION ALL
			SELECT created_at::date AS day, COUNT(*) AS cnt
			FROM posts
			WHERE deleted_at IS NULL
				AND created_at::date >= CURRENT_DATE - INTERVAL '13 days'
			GROUP BY day
			UNION ALL
			SELECT created_at::date AS day, COUNT(*) AS cnt
			FROM comments
			WHERE deleted_at IS NULL
				AND created_at::date >= CURRENT_DATE - INTERVAL '13 days'
			GROUP BY day
		) sub
		GROUP BY day
		ORDER BY day ASC
	`); err != nil {
		return task.VelocityData{}, err
	}

	byDay := make(map[string]int, len(rows))
	for _, row := range rows {
		byDay[row.Day.Format("2006-01-02")] = row.Count
	}

	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.Local)

	lastWeek := make([]task.VelocityDay, 7)
	thisWeek := make([]task.VelocityDay, 7)

	for i := 0; i < 7; i++ {
		lwDay := today.AddDate(0, 0, -(13 - i))
		lwKey := lwDay.Format("2006-01-02")
		lastWeek[i] = task.VelocityDay{Day: lwKey, Count: byDay[lwKey]}

		twDay := today.AddDate(0, 0, -(6 - i))
		twKey := twDay.Format("2006-01-02")
		thisWeek[i] = task.VelocityDay{Day: twKey, Count: byDay[twKey]}
	}

	var lastWeekTotal, thisWeekTotal int
	for _, d := range lastWeek {
		lastWeekTotal += d.Count
	}
	for _, d := range thisWeek {
		thisWeekTotal += d.Count
	}

	var changePercent int
	if lastWeekTotal > 0 {
		changePercent = int(math.Round(float64(thisWeekTotal-lastWeekTotal) / float64(lastWeekTotal) * 100))
	} else if thisWeekTotal > 0 {
		changePercent = 100
	}

	return task.VelocityData{
		ThisWeek:      thisWeek,
		LastWeek:      lastWeek,
		ThisWeekTotal: thisWeekTotal,
		LastWeekTotal: lastWeekTotal,
		ChangePercent: changePercent,
	}, nil
}
