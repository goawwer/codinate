package repository

import (
	"context"

	"github.com/goawwer/codinate/internal/adapter/database"
	"github.com/goawwer/codinate/internal/adapter/dto/worklog"
	"github.com/goawwer/codinate/internal/adapter/model"
	"github.com/goawwer/codinate/pkg/util"
	"github.com/google/uuid"
)

type WorklogRepo interface {
	GetAll(ctx context.Context, userId uuid.UUID, f *worklog.Filters) ([]worklog.Row, error)
	Add(ctx context.Context, input model.Worklog) (uuid.UUID, error)
}

type worklogRepoImpl struct {
	*database.CoreRepository
}

func GetWorklogRepo() WorklogRepo {
	r := database.GetCoreRepository()
	return &worklogRepoImpl{r}
}

func (r *worklogRepoImpl) GetAll(ctx context.Context, userId uuid.UUID, f *worklog.Filters) ([]worklog.Row, error) {
	var qb QueryFiltersBuilder

	customNames := map[string]string{
		"TaskId":         "t.task_id",
		"taskId":         "t.task_id",
		"description":    "t.description",
		"Description":    "t.description",
		"projectName":    "p.name",
		"ProjectName":    "p.name",
		"taskIdentifier": "tk.identifier",
		"TaskIdentifier": "tk.identifier",
		"startAt":        "t.start_at",
		"StartAt":        "t.start_at",
		"endAt":          "t.end_at",
		"EndAt":          "t.end_at",
		"totalMinutes":   "t.total_minutes",
		"TotalMinutes":   "t.total_minutes",
	}

	searchCol, err := util.GetDBColumn(model.Worklog{}, f.SearchBy.Column, customNames)
	if err != nil && f.SearchBy.Column != "" {
		return nil, err
	}

	orderCol, err := util.GetDBColumn(model.Worklog{}, f.SortBy.Column, customNames)
	if err != nil && f.SortBy.Column != "" {
		return nil, err
	}

	result := make([]worklog.Row, 0)

	qb.In(util.GetDBColumnsFiltersValuesMap(customNames, model.Worklog{}, f)).
		FilterWithOperator("t.created_at::TIMESTAMP", f.DateRange.From, ">=").
		FilterWithOperator("t.created_at::TIMESTAMP", f.DateRange.To, "<").
		Eq("t.user_id", userId).
		Eq("tk.identifier", f.Identifier).
		Like(searchCol, f.SearchBy.Value).
		Order(orderCol, f.SortBy.Direction, "t.created_at", "DESC").
		Limit(f.Paging.GetOffset(), f.Paging.GetLimit())

	err = r.SelectContext(ctx, &result, `
		SELECT
			t.id,
			t.task_id,
			t.created_at AS date,
			t.start_at,
			t.end_at,
			t.total_minutes,
			t.description,
			p.name AS project_name,
			tk.identifier AS task_identifier
		FROM time_logs t
		LEFT JOIN projects p ON p.id = t.project_id
		LEFT JOIN tasks tk ON tk.id = t.task_id
	`+qb.Build())

	return result, err
}

func (r *worklogRepoImpl) Add(ctx context.Context, input model.Worklog) (uuid.UUID, error) {
	var id uuid.UUID

	err := r.QueryRowContext(ctx, `
		INSERT INTO time_logs (
			project_id, task_id, user_id, description, start_at, end_at, total_minutes
		)
		VALUES (
			NULLIF($1, 0),
			NULLIF($2::text, '00000000-0000-0000-0000-000000000000')::uuid,
			$3, $4, $5, $6, $7
		)
		RETURNING id
	`,
		input.ProjectId, input.TaskId, input.UserId, input.Description,
		input.StartAt, input.EndAt, input.TotalMinutes,
	).Scan(&id)

	return id, err
}

func (r *worklogRepoImpl) DeleteBy(ctx context.Context, id uuid.UUID) error {
	_, err := r.ExecContext(ctx, `
		DELETE FROM time_logs
		WHERE id = $1
	`, id)

	return err
}
