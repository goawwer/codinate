package public

import (
	"reflect"

	"github.com/go-chi/chi/v5"
)

var router = chi.NewRouter()

func Router() *chi.Mux {
	return router
}

func RegisterGet(pattern string, serviceType reflect.Type, handlerFn func(s PublicService) (any, error)) {
	router.Method("GET", pattern, createHandler(serviceType, handlerFn))
}
