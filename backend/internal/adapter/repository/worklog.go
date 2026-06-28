package repository

import (
	"context"

	"github.com/goawwer/codinate/internal/adapter/database"
	"github.com/goawwer/codinate/internal/adapter/dto/worklog"
	"github.com/goawwer/codinate/internal/adapter/model"
	"github.com/goawwer/codinate/pkg/util"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type WorklogRepo interface {
	GetAll(ctx context.Context, userId uuid.UUID, f *worklog.Filters) ([]worklog.Row, error)
	GetById(ctx context.Context, logId uuid.UUID) (model.Worklog, error)
	GetByTask(ctx context.Context, taskId uuid.UUID) ([]worklog.TaskRow, error)
	GetLeaderboard(ctx context.Context, limit int) ([]worklog.LeaderboardEntry, error)
	RecalculateLeaderboard(ctx context.Context) error
	Add(ctx context.Context, input model.Worklog) (uuid.UUID, error)
	UpdateBy(ctx context.Context, id uuid.UUID, newLog worklog.UpdateLogInput) error
	DeleteBy(ctx context.Context, id uuid.UUID) error
}

type worklogRepoImpl struct {
	*database.CoreRepository
}

func GetWorklogRepo() WorklogRepo {
	r := database.GetCoreRepository()
	return &worklogRepoImpl{r}
}

func (r *worklogRepoImpl) GetById(ctx context.Context, logId uuid.UUID) (model.Worklog, error) {
	var res model.Worklog

	err := r.GetContext(ctx, &res, `
		SELECT * FROM time_logs
	 	WHERE id = $1
	`, logId)

	return res, err
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
		FilterWithOperator("t.start_at::TIMESTAMP", f.DateRange.From, ">=").
		FilterWithOperator("t.end_at::TIMESTAMP", f.DateRange.To, "<").
		Eq("t.user_id", userId).
		Eq("tk.identifier", f.Identifier).
		Eq("t.project_id", f.ProjectId).
		Like(searchCol, f.SearchBy.Value).
		Order(orderCol, f.SortBy.Direction, "t.start_at", "DESC").
		Limit(f.Paging.GetOffset(), f.Paging.GetLimit())

	err = r.SelectContext(ctx, &result, `
		SELECT
			t.id,
			t.task_id,
			t.start_at AS date,
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

func (r *worklogRepoImpl) GetByTask(ctx context.Context, taskId uuid.UUID) ([]worklog.TaskRow, error) {
	result := make([]worklog.TaskRow, 0)
	err := r.SelectContext(ctx, &result, `
		SELECT
			t.id,
			t.task_id,
			t.start_at,
			t.end_at,
			t.total_minutes,
			COALESCE(t.description, '') AS description,
			u.id AS user_id,
			COALESCE(u.name, '') AS user_name,
			COALESCE(u.surname, '') AS user_surname,
			COALESCE(u.avatar, '') AS user_avatar
		FROM time_logs t
		LEFT JOIN users u ON u.id = t.user_id
		WHERE t.task_id = $1
		ORDER BY t.start_at ASC
	`, taskId)
	return result, err
}

func (r *worklogRepoImpl) GetLeaderboard(ctx context.Context, limit int) ([]worklog.LeaderboardEntry, error) {
	result := make([]worklog.LeaderboardEntry, 0)
	err := r.SelectContext(ctx, &result, `
		SELECT
			ls.user_id,
			u.username,
			COALESCE(u.name, '')    AS name,
			COALESCE(u.surname, '') AS surname,
			COALESCE(u.avatar, '')  AS avatar,
			ls.total_minutes,
			ls.log_count,
			ls.rank
		FROM leaderboard_snapshots ls
		JOIN users u ON u.id = ls.user_id
		ORDER BY ls.rank ASC, ls.user_id ASC
		LIMIT $1
	`, limit)
	if err != nil {
		return nil, err
	}
	// Fallback to live query when snapshot table is empty (e.g. before first recalculation)
	if len(result) == 0 {
		err = r.SelectContext(ctx, &result, `
			SELECT
				u.id AS user_id,
				u.username,
				u.name,
				u.surname,
				COALESCE(u.avatar, '') AS avatar,
				COALESCE(SUM(t.total_minutes), 0) AS total_minutes,
				COUNT(t.id) AS log_count,
				ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(t.total_minutes), 0) DESC, u.id ASC)::int AS rank
			FROM users u
			JOIN time_logs t ON t.user_id = u.id AND t.created_at >= DATE_TRUNC('month', NOW())
			WHERE u.disabled = false
			GROUP BY u.id, u.username, u.name, u.surname, u.avatar
			ORDER BY total_minutes DESC, u.id ASC
			LIMIT $1
		`, limit)
	}
	return result, err
}

func (r *worklogRepoImpl) RecalculateLeaderboard(ctx context.Context) error {
	return r.RunInTransaction(ctx, func(tx *sqlx.Tx) error {
		if _, err := tx.ExecContext(ctx, `DELETE FROM leaderboard_snapshots`); err != nil {
			return err
		}
		_, err := tx.ExecContext(ctx, `
			INSERT INTO leaderboard_snapshots
				(user_id, username, name, surname, avatar, total_minutes, log_count, rank, calculated_at)
			SELECT
				u.id,
				u.username,
				COALESCE(u.name, '')    AS name,
				COALESCE(u.surname, '') AS surname,
				COALESCE(u.avatar, '')  AS avatar,
				COALESCE(SUM(t.total_minutes), 0) AS total_minutes,
				COUNT(t.id)             AS log_count,
				ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(t.total_minutes), 0) DESC, u.id ASC)::int AS rank,
				NOW()
			FROM users u
			LEFT JOIN time_logs t
				ON t.user_id = u.id AND t.created_at >= DATE_TRUNC('month', NOW())
			WHERE u.disabled = false
			GROUP BY u.id, u.username, u.name, u.surname, u.avatar
		`)
		return err
	})
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

func (r *worklogRepoImpl) UpdateBy(ctx context.Context, id uuid.UUID, newLog worklog.UpdateLogInput) error {
	var qb QueryFiltersBuilder

	clause := qb.Update(util.GetDBColumnsFiltersValuesMap(nil, model.Worklog{}, &newLog)).
		Eq("id::uuid", id).
		Build()

	_, err := r.ExecContext(ctx, "UPDATE time_logs "+clause, qb.Args()...)

	return err
}

func (r *worklogRepoImpl) DeleteBy(ctx context.Context, id uuid.UUID) error {
	_, err := r.ExecContext(ctx, `
		DELETE FROM time_logs
		WHERE id = $1
	`, id)

	return err
}
