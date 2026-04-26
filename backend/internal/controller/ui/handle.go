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
	if result == nil {
		w.WriteHeader(http.StatusOK)
		return
	}
	v := reflect.ValueOf(result)
	switch v.Kind() {
	case reflect.Ptr, reflect.Chan, reflect.Func, reflect.Interface, reflect.Map, reflect.Slice:
		if v.IsNil() {
			w.WriteHeader(http.StatusOK)
			return
		}
	}

	if err := json.NewEncoder(w).Encode(result); err != nil {
		logger.Errorf("Error on API response: %v", err)
		return
	}
}

func handleError(w http.ResponseWriter, err error) {
	logger.Errorf("Error on API request - %v", err)

	if httpCodeError, ok := err.(HttpCodeError); ok {
		http.Error(w, httpCodeError.Message, httpCodeError.Code)
		return
	}

	if notyError, ok := err.(FrontendNotificationError); ok {
		http.Error(w, string(notyError.ToJson()), FrontendNotificationErrorHttpCode)
		return
	}

	http.Error(w, err.Error(), http.StatusInternalServerError)
}
