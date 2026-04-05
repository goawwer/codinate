package repository

import (
	"context"

	"github.com/goawwer/codinate/internal/adapter/database"
	"github.com/goawwer/codinate/internal/adapter/dto/user"
	"github.com/goawwer/codinate/internal/adapter/models"
	"github.com/google/uuid"
)

type UserRepo interface {
	GetUserById(ctx context.Context, id uuid.UUID) (*user.Row, error)
	CreateUser(ctx context.Context, u *models.User) error
}

type userRepoImpl struct {
	*database.CoreRepository
}

func GetUserRepo() UserRepo {
	r := database.GetCoreRepository()
	return &userRepoImpl{r}
}

func (r userRepoImpl) CreateUser(ctx context.Context, u *models.User) error {
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

func (r userRepoImpl) GetUserById(ctx context.Context, id uuid.UUID) (*user.Row, error) {
	var user user.Row

	err := r.QueryRowContext(ctx, `
		SELECT
			id, name, surname, email, username,
			profile_picture_path, role, disabled, created_at
		FROM users
		WHERE id = $1
	`, id).StructScan(&user)

	return &user, err
}
