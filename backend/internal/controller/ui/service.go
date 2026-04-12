package ui

import (
	"github.com/goawwer/codinate/internal/adapter/dto/user"
	"github.com/goawwer/codinate/internal/adapter/repository"
	"github.com/goawwer/codinate/internal/controller"
	"github.com/goawwer/codinate/internal/service/middleware"
	"github.com/google/uuid"
)

type UIService interface {
	GetCurrentUser() (*user.Row, error)
	controller.Service
}

type CoreUiService struct {
	*controller.CoreService
}

func (s *CoreUiService) GetCurrentUser() (*user.Row, error) {
	claims, err := middleware.GetClaimsFromRequest(s.Request)
	if err != nil {
		return nil, err
	}

	return repository.GetUserRepo().GetById(s.Request.Context(), uuid.MustParse(claims.UserID))
}

type FilterService[IN any, OUT any] struct{}

func (f *FilterService[IN, OUT]) GetResolvedFilters(s UIService, resolver func(*IN, controller.BasicQueryParams) *OUT) (*OUT, error) {
	var input IN

	if err := s.BindUrlParams(&input, ""); err != nil {
		return nil, err
	}

	return resolver(&input, s.GetBasicSortingAndPagingParams()), nil
}
