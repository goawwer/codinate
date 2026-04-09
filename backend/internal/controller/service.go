package controller

import (
	"fmt"
	"net/http"

	"github.com/go-chi/chi"
)

type Service interface {
	GetRequest() *http.Request
	GetResponse() http.ResponseWriter
	GetService() any
	GetPathParameterAsString(name string) (string, error)
	GetUrlParamAsString(name string) (string, error)
}

type CoreService struct {
	Request  *http.Request
	Response http.ResponseWriter
	Service  any
}

func (s *CoreService) GetRequest() *http.Request {
	return s.Request
}

func (s *CoreService) GetResponse() http.ResponseWriter {
	return s.Response
}

func (s *CoreService) GetService() any {
	return s.Service
}

func (s *CoreService) GetPathParameterAsString(name string) (string, error) {
	param := chi.URLParam(s.GetRequest(), name)
	if param == "" {
		return "", fmt.Errorf("failed to get path parameter - %s: not found", name)
	}

	return param, nil
}

func (s *CoreService) GetUrlParamAsString(name string) (string, error) {
	params, ok := s.Request.URL.Query()[name]
	if !ok {
		return "", fmt.Errorf("failed to get URL parameter - %s: not found", name)
	}

	return params[0], nil
}
