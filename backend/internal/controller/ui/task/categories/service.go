package categories

import (
	"context"

	"github.com/goawwer/codinate/internal/adapter/dto/shared"
	"github.com/goawwer/codinate/internal/adapter/repository"
)

type service struct{}

func (s *service) getAllCategoriesBy(ctx context.Context, projectId int) ([]shared.IdWithName, error) {
	return repository.GetTaskRepo().GetAllCategoriesBy(ctx, projectId)
}

func (s *service) addNewCategory(ctx context.Context, name shared.NameInput, projectId int) error {
	return repository.GetTaskRepo().AddNewCategory(ctx, name, projectId)
}

func (s *service) updateCategoryBy(ctx context.Context, name shared.NameInput, id int) error {
	return repository.GetTaskRepo().UpdateCategory(ctx, name, id)
}

func (s *service) deleteCategoryBy(ctx context.Context, id int) error {
	return repository.GetTaskRepo().DeleteCategorty(ctx, id)
}
