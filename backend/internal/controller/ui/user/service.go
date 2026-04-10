package user

import (
	"context"
	"strings"

	"github.com/goawwer/codinate/internal/adapter/dto"
	"github.com/goawwer/codinate/internal/adapter/dto/user"
	"github.com/goawwer/codinate/internal/adapter/model"
	"github.com/goawwer/codinate/internal/adapter/repository"
	"github.com/goawwer/codinate/pkg/util"
	"github.com/google/uuid"
)

type service struct{}

func (s *service) getRows(ctx context.Context) (*[]user.Row, error) {
	return repository.GetUserRepo().GetAll(ctx)
}

func (s *service) getRow(ctx context.Context, id string) (*user.Row, error) {
	return repository.GetUserRepo().GetById(ctx, uuid.MustParse(id))
}

func (s *service) createNewUser(ctx context.Context, input user.CreateInput) error {
	hashedPassword, err := util.CreateHashPassword(input.Password)
	if err != nil {
		return err
	}

	username, _, _ := strings.Cut(input.Email, "@")

	return repository.GetUserRepo().Create(ctx, &model.User{
		Name:           input.Name,
		Surname:        input.Surname,
		Username:       username,
		Email:          input.Email,
		HashedPassword: hashedPassword,
		Role:           dto.ResolveUserRole(input.Role),
	})
}

func (s *service) updateUserById(ctx context.Context, id string, newFields user.UpdateInput) error {
	if newFields.Password != nil {
		hashed, err := util.CreateHashPassword(*newFields.Password)
		if err != nil {
			return err
		}
		newFields.Password = &hashed
	}

	return repository.GetUserRepo().UpdateById(ctx, newFields, uuid.MustParse(id))
}

func (s *service) deleteUserById(ctx context.Context, id uuid.UUID) error {
	return repository.GetUserRepo().DeleteById(ctx, id)
}
