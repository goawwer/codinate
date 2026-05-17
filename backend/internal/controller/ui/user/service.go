package user

import (
	"context"

	"github.com/goawwer/codinate/internal/adapter/dto"
	"github.com/goawwer/codinate/internal/adapter/dto/filters"
	"github.com/goawwer/codinate/internal/adapter/dto/user"
	"github.com/goawwer/codinate/internal/adapter/model"
	"github.com/goawwer/codinate/internal/adapter/repository"
	"github.com/goawwer/codinate/pkg/util"
	"github.com/google/uuid"
)

type service struct{}

func (s *service) getRows(ctx context.Context, f *user.Filters) ([]user.Row, error) {
	return repository.GetUserRepo().GetAll(ctx, f)
}

func (s *service) getRow(ctx context.Context, id string) (*user.Row, error) {
	return repository.GetUserRepo().GetById(ctx, uuid.MustParse(id))
}

func (s *service) createNewUser(ctx context.Context, input user.CreateInput) error {
	hashedPassword, err := util.CreateHashPassword(input.Password)
	if err != nil {
		return err
	}

	return repository.GetUserRepo().Create(ctx, &model.User{
		Name:           input.Name,
		Surname:        input.Surname,
		Username:       input.Username,
		Email:          input.Email,
		HashedPassword: hashedPassword,
		RoleId:         input.RoleId,
		Permission:     dto.ResolveUserRole(input.Permission),
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

func (s *service) deleteUsersByIds(ctx context.Context, ids []uuid.UUID) error {
	return repository.GetUserRepo().DeleteByIds(ctx, ids)
}

func (s *service) getUserProfileBy(ctx context.Context, userId uuid.UUID) (user.Profile, error) {
	return repository.GetUserRepo().GetUserProfile(ctx, userId)
}

func (s *service) getUserProfileStats(ctx context.Context, userId, from, to string) (user.ProfileStats, error) {
	return repository.GetUserRepo().GetUserProfileStats(ctx, uuid.MustParse(userId), filters.NewDateRange(from, to))
}

func (s *service) getAllUsersHours(ctx context.Context, from, to string) ([]user.UserHoursStat, error) {
	return repository.GetUserRepo().GetAllUsersHours(ctx, filters.NewDateRange(from, to))
}

func (s *service) updateProfile(ctx context.Context, input user.UpdateProfileInput, userId uuid.UUID) error {
	return repository.GetUserRepo().UpdateProfileBy(ctx, input, userId)
}
