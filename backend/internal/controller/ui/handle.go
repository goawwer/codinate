package ui

import (
	"encoding/json"
	"net/http"
	"reflect"

	"github.com/goawwer/codinate/internal/controller"
	"github.com/goawwer/codinate/pkg/logger"
)

func createHandler(serviceType reflect.Type, handlerFn func(s UIService) (any, error)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		service := reflect.New(serviceType).Interface()
		rootService := CoreUiService{&controller.CoreService{Request: r, Response: w, Service: service}}

		result, err := handlerFn(&rootService)
		if err != nil {
			handleError(w, err)
		} else {
			handleResult(w, result)
		}
	}
}

func handleResult(w http.ResponseWriter, result any) {
	if result == nil || reflect.ValueOf(result).IsNil() {
		w.WriteHeader(http.StatusOK)
		return
	}

	if err := json.NewEncoder(w).Encode(result); err != nil {
		logger.Errorf("Error on API response: %v", err)
		return
	}
}

func handleError(w http.ResponseWriter, err error) {
	logger.Errorf("Error on API request: %v", err)
	http.Error(w, err.Error(), http.StatusInternalServerError)
}
