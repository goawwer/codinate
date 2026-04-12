package repository

import (
	"context"

	"github.com/goawwer/codinate/internal/adapter/database"
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
	var res []user.Row

	orderCol, err := util.GetDBColumn(user.Row{}, f.SortBy.Column, nil)
	if err != nil && f.SortBy.Column != "" {
		return nil, err
	}

	clause := qb.Eq("u.disabled", f.Disabled).Order(orderCol, f.SearchBy.Column, "u.created_at", "desc").Build()

	err = r.SelectContext(ctx, &res, `
		SELECT
			u.id, u.name, u.surname, u.email, u.username,
			u.picture_name, u.permission_role,
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
			u.picture_name, u.permission_role,
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

	_, err := r.ExecContext(ctx, "UPDATE users "+clause)
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
