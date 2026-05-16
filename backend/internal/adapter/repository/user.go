package repository

import (
	"context"

	"github.com/goawwer/codinate/internal/adapter/database"
	"github.com/goawwer/codinate/internal/adapter/dto/filters"
	"github.com/goawwer/codinate/internal/adapter/dto/user"
	"github.com/goawwer/codinate/internal/adapter/model"
	models "github.com/goawwer/codinate/internal/adapter/model"
	"github.com/goawwer/codinate/pkg/util"
	"github.com/google/uuid"
	"github.com/lib/pq"
)

type UserRepo interface {
	GetById(ctx context.Context, id uuid.UUID) (*user.Row, error)
	GetAll(ctx context.Context, f *user.Filters) ([]user.Row, error)
	Create(ctx context.Context, u *models.User) error
	DeleteById(ctx context.Context, id uuid.UUID) error
	DeleteByIds(ctx context.Context, ids []uuid.UUID) error
	UpdateById(ctx context.Context, newFields user.UpdateInput, id uuid.UUID) error
	GetUserProfile(ctx context.Context, userId uuid.UUID) (user.Profile, error)
	GetUserProfileStats(ctx context.Context, userId uuid.UUID, d *filters.DateRange) (user.ProfileStats, error)
	GetAllUsersHours(ctx context.Context, d *filters.DateRange) ([]user.UserHoursStat, error)
	UpdateProfileBy(ctx context.Context, input user.UpdateProfileInput, id uuid.UUID) error
}

type userRepoImpl struct {
	*database.CoreRepository
}

func GetUserRepo() UserRepo {
	r := database.GetCoreRepository()
	return &userRepoImpl{r}
}

func (r *userRepoImpl) Create(ctx context.Context, u *models.User) error {
	_, err := r.NamedQueryContext(ctx, `
		INSERT INTO users (
			name, surname, username, email, hashed_password, role_id, permission_role
		)
		VALUES (
			:name, :surname, :username, :email, :hashed_password, :role_id, :permission_role
		)
	`, u)

	return err
}

func (r *userRepoImpl) GetAll(ctx context.Context, f *user.Filters) ([]user.Row, error) {
	var qb QueryFiltersBuilder
	res := make([]user.Row, 0)

	orderCol, err := util.GetDBColumn(user.Row{}, f.SortBy.Column, nil)
	if err != nil && f.SortBy.Column != "" {
		return nil, err
	}

	clause := qb.Eq("u.disabled", f.Disabled).Order(orderCol, f.SearchBy.Column, "u.created_at", "desc").Build()

	err = r.SelectContext(ctx, &res, `
		SELECT
			u.id, u.name, u.surname, u.email, u.username,
			u.avatar, u.permission_role,
			u.disabled, u.created_at, u.updated_at,
			er.name AS role
		FROM users u
		LEFT JOIN employee_roles er ON er.id = u.role_id
	`+clause)

	return res, err
}

func (r *userRepoImpl) GetById(ctx context.Context, id uuid.UUID) (*user.Row, error) {
	var user user.Row

	err := r.QueryRowContext(ctx, `
		SELECT
			u.id, u.name, u.surname, u.email, u.username,
			u.avatar, u.permission_role,
			u.disabled, u.created_at, u.updated_at,
			er.name AS role
		FROM users u
		LEFT JOIN employee_roles er ON er.id = u.role_id
		WHERE u.id = $1
	`, id).StructScan(&user)

	return &user, err
}

func (r *userRepoImpl) UpdateById(ctx context.Context, newFields user.UpdateInput, id uuid.UUID) error {
	var qb QueryFiltersBuilder

	clause := qb.Update(util.GetDBColumnsFiltersValuesMap(nil, model.User{}, &newFields)).
		Eq("id::uuid", id).
		Build()

	_, err := r.ExecContext(ctx, "UPDATE users "+clause, qb.Args()...)
	return err
}

func (r *userRepoImpl) DeleteById(ctx context.Context, id uuid.UUID) error {
	_, err := r.QueryContext(ctx, `
		DELETE FROM users
		WHERE id = $1
	`, id)

	return err
}

func (r *userRepoImpl) DeleteByIds(ctx context.Context, ids []uuid.UUID) error {
	_, err := r.ExecContext(ctx, `
    DELETE FROM users
    WHERE id = ANY($1::uuid[])
  `, pq.Array(ids))

	return err
}

func (r *userRepoImpl) GetUserProfile(ctx context.Context, userId uuid.UUID) (user.Profile, error) {
	var res user.Profile

	err := r.GetContext(ctx, &res, `
		SELECT
			u.id,
			u.name,
			u.surname,
			u.username,
			u.about,
			u.avatar,
			u.background_profile_picture,
			u.created_at,
			er.name as role
		FROM users u
		LEFT JOIN employee_roles er ON u.role_id = er.id
		WHERE u.id = $1
	`, userId)
	if err != nil {
		return res, err
	}

	err = r.SelectContext(ctx, &res.Projects, `
		SELECT
			p.id,
			p.picture_name as project_picture,
			p.about as project_about,
			p.name,
			COALESCE(SUM(t.total_minutes), 0) as spent_minutes,
			COALESCE(SUM(CASE WHEN t.created_at >= NOW() - INTERVAL '30 days' THEN t.total_minutes ELSE 0 END), 0) as recent_minutes
		FROM project_members pm
		JOIN projects p ON p.id = pm.project_id
		LEFT JOIN time_logs t ON t.user_id = $1 AND t.project_id = p.id
		WHERE pm.user_id = $1
		GROUP BY p.id, p.name
	`, userId)
	if err != nil {
		return res, err
	}

	for i, p := range res.Projects {
		res.RecentMinutes += p.RecentMinutes

		tasks := make([]user.TaskRef, 0)
		err = r.SelectContext(ctx, &tasks, `
			SELECT t.id::text, t.identifier, t.title
			FROM tasks t
			INNER JOIN (
				SELECT task_id, MAX(created_at) AS last_activity
				FROM task_history
				WHERE user_id = $2
				GROUP BY task_id
			) th ON th.task_id = t.id
			WHERE t.project_id = $1
			ORDER BY th.last_activity DESC
			LIMIT 5
		`, p.ID, userId)
		if err != nil {
			return res, err
		}
		res.Projects[i].Tasks = tasks
	}

	return res, err
}

func (r *userRepoImpl) GetUserProfileStats(ctx context.Context, userId uuid.UUID, d *filters.DateRange) (user.ProfileStats, error) {
	var res user.ProfileStats

	err := r.SelectContext(ctx, &res.WorkDynamics, `
		WITH days AS (
			SELECT generate_series(
				$2::date,
				$3::date,
				interval '1 day'
			)::date AS date
		)
		SELECT
			d.date::text AS date,
			COALESCE(SUM(t.total_minutes), 0)::int AS spent_minutes
		FROM days d
		LEFT JOIN time_logs t
			ON t.user_id = $1
			AND t.created_at >= d.date
			AND t.created_at < d.date + interval '1 day'
		GROUP BY d.date
		ORDER BY d.date
	`, userId, d.From, d.To)
	if err != nil {
		return res, err
	}

	err = r.SelectContext(ctx, &res.ProjectFocus, `
		SELECT
			p.id AS project_id,
			p.name AS project_name,
			COALESCE(SUM(t.total_minutes), 0)::int AS spent_minutes
		FROM project_members pm
		JOIN projects p ON p.id = pm.project_id
		LEFT JOIN time_logs t
			ON t.user_id = $1
			AND t.project_id = p.id
			AND t.created_at >= $2::date
			AND t.created_at < ($3::date + interval '1 day')
		WHERE pm.user_id = $1
		GROUP BY p.id, p.name
		HAVING COALESCE(SUM(t.total_minutes), 0) > 0
		ORDER BY spent_minutes DESC, p.name ASC
	`, userId, d.From, d.To)
	if err != nil {
		return res, err
	}

	return res, nil
}

func (r *userRepoImpl) GetAllUsersHours(ctx context.Context, d *filters.DateRange) ([]user.UserHoursStat, error) {
	res := make([]user.UserHoursStat, 0)
	err := r.SelectContext(ctx, &res, `
		SELECT
			u.id::text AS user_id,
			COALESCE(SUM(t.total_minutes), 0)::int AS total_minutes
		FROM users u
		LEFT JOIN time_logs t
			ON t.user_id = u.id
			AND t.created_at >= $1::date
			AND t.created_at < ($2::date + interval '1 day')
		GROUP BY u.id
	`, d.From, d.To)
	return res, err
}

func (r *userRepoImpl) UpdateProfileBy(ctx context.Context, input user.UpdateProfileInput, id uuid.UUID) error {
	var qb QueryFiltersBuilder

	clause := qb.Update(util.GetDBColumnsFiltersValuesMap(nil, model.User{}, &input)).
		Eq("id", id).
		Build()

	_, err := r.ExecContext(ctx, "UPDATE users "+clause, qb.Args()...)
	return err
}
