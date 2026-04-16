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

// getFile
//
//	@Tags		files
//	@Summary	Get task file
//	@Description	Serves a file attachment for a task entity
//	@Produce	application/octet-stream
//	@Param		entityType	path	string	true	"Entity type (e.g. tasks)"
//	@Param		entityId	path	string	true	"Entity UUID"
//	@Param		id			path	string	true	"File ID"
//	@Success	200
//	@Failure	400	{object}	string	"Bad Request"
//	@Failure	404	{object}	string	"Not Found"
//	@Failure	500	{object}	string	"Internal Server Error"
//	@Router		/api/files/tasks/{entityType}/{entityId}/{id} [get]
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
