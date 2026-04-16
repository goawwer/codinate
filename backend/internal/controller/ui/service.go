package ui

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/goawwer/codinate/internal/adapter/dto/user"
	"github.com/goawwer/codinate/internal/adapter/repository"
	"github.com/goawwer/codinate/internal/controller"
	"github.com/goawwer/codinate/internal/service/middleware"
	"github.com/goawwer/codinate/internal/service/uploads"
	"github.com/goawwer/codinate/pkg/logger"
	"github.com/google/uuid"
	"github.com/spf13/viper"
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

func ParseMultipartPayload[T any](s UIService, fileField, entityType string) (T, string, error) {
	var input T

	if err := s.GetRequest().ParseMultipartForm(viper.GetInt64("UPLOADS_MAX_SIZE_MB") << 20); err != nil {
		return input, "", err
	}

	payloadRaw := s.GetRequest().FormValue("payload")
	if payloadRaw == "" {
		return input, "", NewHttpCodeError(nil, http.StatusBadRequest, "missing payload")
	}

	if err := json.Unmarshal([]byte(payloadRaw), &input); err != nil {
		return input, "", NewHttpCodeError(nil, http.StatusBadRequest, "invalid payload")
	}

	fileId := uuid.New()
	file, header, err := s.GetRequest().FormFile(fileField)
	if file != nil {
		mime := header.Header.Get("Content-Type")
		var fileName string
		var saveErr error
		if mime == "image/jpeg" || mime == "image/png" || mime == "image/gif" {
			fileName, saveErr = uploads.SaveImageFileOnServer(file, header, entityType, fileId)
		} else {
			fileName, saveErr = uploads.SaveFileOnServer(file, header, entityType, fileId)
		}
		if saveErr != nil {
			return input, "", saveErr
		}
		return input, fileName, nil
	}

	if err != nil && !errors.Is(err, http.ErrMissingFile) {
		logger.Errorf("error with getting form file value: %v", err)
		return input, "", err
	}

	return input, "", nil
}
