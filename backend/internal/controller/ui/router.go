package ui

import (
	"net/http"
	"reflect"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/goawwer/codinate/internal/adapter/model/enum"
	custom "github.com/goawwer/codinate/internal/service/middleware"
)

var router = chi.NewRouter()

func Router() *chi.Mux {
	return router
}

func RegisterGet(pattern string, roles []enum.Role, serviceType reflect.Type, handlerFn func(s UIService) (any, error)) {
	register(http.MethodGet, pattern, roles, serviceType, handlerFn)
}

func RegisterPost(pattern string, roles []enum.Role, serviceType reflect.Type, handlerFn func(s UIService) (any, error)) {
	register(http.MethodPost, pattern, roles, serviceType, handlerFn)
}

func RegisterPut(pattern string, roles []enum.Role, serviceType reflect.Type, handlerFn func(s UIService) (any, error)) {
	register(http.MethodPut, pattern, roles, serviceType, handlerFn)
}

func RegisterPatch(pattern string, roles []enum.Role, serviceType reflect.Type, handlerFn func(s UIService) (any, error)) {
	register(http.MethodPatch, pattern, roles, serviceType, handlerFn)
}

func RegisterDelete(pattern string, roles []enum.Role, serviceType reflect.Type, handlerFn func(s UIService) (any, error)) {
	register(http.MethodDelete, pattern, roles, serviceType, handlerFn)
}

func register(method, pattern string, roles []enum.Role, serviceType reflect.Type, handlerFn func(s UIService) (any, error)) {
	middlewares := chi.Middlewares{middleware.WithValue(custom.RolesKey, roles), custom.RoleValidator}
	handler := middlewares.HandlerFunc(createHandler(serviceType, handlerFn))
	router.Method(method, pattern, handler)
}
