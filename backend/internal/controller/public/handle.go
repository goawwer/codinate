package public

import (
	"encoding/json"
	"net/http"
	"reflect"

	"github.com/goawwer/codinate/internal/controller"
	"github.com/goawwer/codinate/internal/controller/ui"
	"github.com/goawwer/codinate/pkg/logger"
)

func createHandler(serviceType reflect.Type, handlerFn func(PublicService) (interface{}, error)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		service := reflect.New(serviceType).Interface()
		rootService := CorePublicService{&controller.CoreService{Request: r, Response: w, Service: service}}

		result, err := handlerFn(&rootService)
		if err == nil {
			handleResult(w, result)
		} else {
			handleError(w, err)
		}
	}
}

func handleResult(w http.ResponseWriter, result interface{}) {
	if result == nil || reflect.ValueOf(result).IsNil() {
		w.WriteHeader(http.StatusOK)
		return
	}

	jsonBytes, err := json.Marshal(result)
	if err != nil {
		logger.Errorf("Error on API PUBLIC result convert to JSON: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	_, err = w.Write(jsonBytes)
	if err != nil {
		logger.Errorf("Error on API PUBLIC result JSON write to response: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
}

func handleError(w http.ResponseWriter, err error) {
	logger.Errorf("Error on API PUBLIC request - %v", err)

	if httpCodeError, ok := err.(ui.HttpCodeError); ok {
		http.Error(w, httpCodeError.Message, httpCodeError.Code)
		return
	}

	http.Error(w, err.Error(), http.StatusInternalServerError)
}
