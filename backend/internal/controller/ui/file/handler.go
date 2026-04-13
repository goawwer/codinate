package file

import (
	"net/http"
	"reflect"

	"github.com/goawwer/codinate/internal/adapter/model/enum"
	"github.com/goawwer/codinate/internal/controller/ui"
)

func Register() {
	ui.RegisterGet("/files/tasks/{entityType}/{entityId}/{id}", enum.AnyUser, reflect.TypeOf(service{}), getFile)
}

func getFile(s ui.UIService) (any, error) {
	entityType, err := s.GetPathParameterAsString("entityType")
	if err != nil {
		return nil, err
	}

	entityId, err := s.GetPathParameterAsString("entityId")
	if err != nil {
		return nil, err
	}

	id, err := s.GetPathParameterAsString("id")
	if err != nil {
		return nil, err
	}

	filePath, err := s.GetService().(*service).getFilePath(s.GetRequest().Context(), entityType, entityId, id)
	if err != nil {
		return nil, err
	}

	http.ServeFile(s.GetResponse(), s.GetRequest(), filePath)
	return nil, nil
}
