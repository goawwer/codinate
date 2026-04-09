package repository

import (
	"context"

	"github.com/goawwer/codinate/internal/adapter/database"
	"github.com/goawwer/codinate/internal/adapter/dto/user"
	"github.com/goawwer/codinate/internal/adapter/model"
	models "github.com/goawwer/codinate/internal/adapter/model"
	"github.com/goawwer/codinate/pkg/util"
	"github.com/google/uuid"
)

type UserRepo interface {
	GetById(ctx context.Context, id uuid.UUID) (*user.Row, error)
	GetAll(ctx context.Context) (*[]user.Row, error)
	Create(ctx context.Context, u *models.User) error
	DeleteById(ctx context.Context, id uuid.UUID) error
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
			name, surname, username, email, hashed_password, role
		)
		VALUES (
			:name, :surname, :username, :email, :hashed_password, :role
		)
	`, u)

	return err
}

func (r *userRepoImpl) GetAll(ctx context.Context) (*[]user.Row, error) {
	var res []user.Row

	err := r.SelectContext(ctx, &res, `
		SELECT * FROM users
	`)

	return &res, err
}

func (r *userRepoImpl) GetById(ctx context.Context, id uuid.UUID) (*user.Row, error) {
	var user user.Row

	err := r.QueryRowContext(ctx, `
		SELECT
			id, name, surname, email, username,
			picture_name, role, disabled, created_at
		FROM users
		WHERE id = $1
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
