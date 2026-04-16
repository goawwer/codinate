package public

import "github.com/goawwer/codinate/internal/controller"

type PublicService interface {
	controller.Service
}

type CorePublicService struct {
	*controller.CoreService
}
