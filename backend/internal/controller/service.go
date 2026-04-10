package controller

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"reflect"
	"strconv"

	"github.com/go-chi/chi/v5"
)

type Service interface {
	GetRequest() *http.Request
	GetResponse() http.ResponseWriter
	GetService() any
	GetPathParameterAsString(name string) (string, error)
	GetPathParamAsInt(name string) (int, error)
	GetUrlParamAsString(name string) (string, error)
	GetBodyAs(model interface{}) error
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

func (s *CoreService) GetPathParamAsInt(name string) (int, error) {
	paramStr := chi.URLParam(s.Request, name)
	if paramStr == "" {
		return 0, fmt.Errorf("path parameter '%s' not found", name)
	}

	return strconv.Atoi(paramStr)
}

func (s *CoreService) GetUrlParamAsString(name string) (string, error) {
	params, ok := s.Request.URL.Query()[name]
	if !ok {
		return "", fmt.Errorf("failed to get URL parameter - %s: not found", name)
	}

	return params[0], nil
}

func (s *CoreService) GetBodyAs(model interface{}) error {
	rv := reflect.ValueOf(model)
	if rv.Kind() != reflect.Ptr || rv.IsNil() {
		return &json.InvalidUnmarshalError{Type: reflect.TypeOf(model)}
	}

	body, err := io.ReadAll(s.Request.Body)
	if err != nil {
		return err
	}

	return json.Unmarshal(body, &model)
}
