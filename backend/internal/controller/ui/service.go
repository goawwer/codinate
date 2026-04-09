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
