package ui

import (
	"encoding/json"
	"fmt"
	"net/http"
	"runtime"
	"strings"

	"github.com/go-errors/errors"
	"github.com/goawwer/codinate/pkg/logger"
)

const FrontendNotificationErrorHttpCode int = 480

const (
	NotificationSuccess = "success"
	NotificationInfo    = "info"
	NotificationWarning = "warning"
	NotificationError   = "error"
)

type HttpCodeError struct {
	Code    int
	Message string
	Err     *errors.Error
}

func (e HttpCodeError) Error() string {
	if e.Err != nil {
		return fmt.Sprint("request error: ", e.Code, " - ", e.Message, " | ", e.Err, " | ", strings.TrimSuffix(e.Err.StackFrames()[0].String(), "\n"))
	}

	return fmt.Sprint("request error: ", e.Code, " : ", e.Message)
}

type FrontendNotificationError struct {
	NotyType           string            `json:"type"`
	NotyMessage        string            `json:"message"`
	TranslateKeyParams map[string]string `json:"translateKeyParams"`
	LiteralParams      map[string]string `json:"literalParams"`
	err                *errors.Error
}

func (e FrontendNotificationError) Error() string {
	if e.err != nil {
		return fmt.Sprint("request notification error: ", e.NotyType, " - ", e.NotyMessage, " | ", e.err, " | ", strings.TrimSuffix(e.err.StackFrames()[0].String(), "\n"))
	}

	return fmt.Sprint("request notification error: ", e.NotyType, " - ", e.NotyMessage)
}

func (e FrontendNotificationError) ToJson() []byte {
	bytes, err := json.Marshal(e)
	if err != nil {
		logger.Errorf("Error on notification error respone to JSON marshal: %v", err)
	}

	return bytes
}

func NewNotFoundError(err error) error {
	return NewHttpCodeError(err, http.StatusNotFound)
}

func NewInternalServerError(err error) error {
	return NewHttpCodeError(err, http.StatusInternalServerError)
}

func NewBadRequestError(err error) error {
	return NewHttpCodeError(err, http.StatusBadRequest)
}

func NewUnauthorizedError() error {
	return NewHttpCodeError(nil, http.StatusUnauthorized)
}

func NewForbiddenError() error {
	return NewHttpCodeError(nil, http.StatusForbidden)
}

func NewHttpCodeError(err error, code int, message ...string) error {
	_, file, _, _ := runtime.Caller(1)

	var useError *errors.Error
	if strings.Contains(file, "frontend/api/error.go") {
		useError = errors.Wrap(err, 2)
	} else {
		useError = errors.Wrap(err, 1)
	}

	var msg string
	if len(message) > 0 {
		msg = fmt.Sprint(message)
	} else {
		msg = http.StatusText(code)
	}

	return HttpCodeError{Err: useError, Code: code, Message: msg}
}

func NewNotificationErrorSimple(notyType string, notyMessage string) error {
	return NewNotificationError(notyType, notyMessage, nil)
}

func NewNotificationErrorWithParams(notyType string, notyMessage string, translateKeyParams map[string]string, literalParams map[string]string) error {
	return NewParametrizedNotificationError(notyType, notyMessage, translateKeyParams, literalParams, nil)
}

func NewNotificationError(notyType string, notyMessage string, err error) error {
	_, file, _, _ := runtime.Caller(1)

	var useError *errors.Error
	if strings.Contains(file, "controller/ui/error.go") {
		useError = errors.Wrap(err, 2)
	} else {
		useError = errors.Wrap(err, 1)
	}

	return FrontendNotificationError{err: useError, NotyType: notyType, NotyMessage: notyMessage}
}

func NewParametrizedNotificationError(notyType string, notyMessage string, translateKeyParams map[string]string, literalParams map[string]string, err error) error {
	_, file, _, _ := runtime.Caller(1)

	var useError *errors.Error
	if strings.Contains(file, "controller/ui/error.go") {
		useError = errors.Wrap(err, 2)
	} else {
		useError = errors.Wrap(err, 1)
	}

	return FrontendNotificationError{err: useError, NotyType: notyType, NotyMessage: notyMessage, TranslateKeyParams: translateKeyParams, LiteralParams: literalParams}
}
