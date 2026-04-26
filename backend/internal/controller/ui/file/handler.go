package file

import (
	"errors"
	"fmt"
	"net/http"
	"reflect"

	"github.com/goawwer/codinate/internal/adapter/model/enum"
	"github.com/goawwer/codinate/internal/controller/ui"
	"github.com/goawwer/codinate/internal/service/uploads"
	"github.com/google/uuid"
	"github.com/spf13/viper"
)

func Register() {
	ui.RegisterPost("/files/{entityType}/{entityId}/upload", enum.AnyUser, reflect.TypeOf(service{}), upload)
	ui.RegisterGet("/files/{entityType}/{entityId}/{fileId}", enum.AnyUser, reflect.TypeOf(service{}), get)
	ui.RegisterDelete("/files/{entityType}/{entityId}/{fileId}", enum.AnyUser, reflect.TypeOf(service{}), remove)
}

// upload
//
//	@Tags		files
//	@Summary	Upload entity file
//	@Description	Uploads a file for any entity (tasks, comments, posts). Accepts any file type. Returns 413 if the file exceeds the size limit.
//	@Accept		multipart/form-data
//	@Produce	json
//	@Param		entityType	path		string	true	"Entity type (tasks, comments, posts)"
//	@Param		entityId	path		string	true	"Entity UUID"
//	@Param		file		formData	file	true	"File to upload"
//	@Success	200	{object}	fileUploadResponse
//	@Failure	400	{object}	string
//	@Failure	413	{object}	string
//	@Failure	500	{object}	string
//	@Router		/api/files/{entityType}/{entityId}/upload [post]
func upload(s ui.UIService) (any, error) {
	var fileId uuid.UUID

	entityType, err := s.GetPathParameterAsString("entityType")
	if err != nil {
		return nil, err
	}

	entityId, err := s.GetPathParameterAsString("entityId")
	if err != nil {
		return nil, err
	}

	currentUser, err := s.GetCurrentUser()
	if err != nil {
		return nil, err
	}

	if err := s.GetRequest().ParseMultipartForm(viper.GetInt64("UPLOADS_MAX_SIZE_MB") << 20); err != nil {
		return nil, ui.NewHttpCodeError(nil, http.StatusBadRequest, "invalid multipart form")
	}

	fileIdRaw := s.GetRequest().FormValue("fileId")
	if fileIdRaw != "" {
		fileId, err = uuid.Parse(fileIdRaw)
		if err != nil {
			return nil, ui.NewHttpCodeError(nil, http.StatusBadRequest, "invalid file id")
		}
	} else {
		fileId = uuid.New()
	}

	file, header, err := s.GetRequest().FormFile("file")
	if err != nil {
		return nil, ui.NewHttpCodeError(nil, http.StatusBadRequest, "missing file field")
	}

	req := s.GetRequest()
	scheme := "http"
	if req.TLS != nil {
		scheme = "https"
	}
	baseURL := fmt.Sprintf("%s://%s", scheme, req.Host)

	resp, err := s.GetService().(*service).uploadFile(req.Context(), fileId, currentUser.Id, entityType, entityId, baseURL, file, header)
	if err != nil {
		if errors.Is(err, uploads.ErrFileTooLarge) {
			return nil, ui.NewHttpCodeError(nil, http.StatusRequestEntityTooLarge, err.Error())
		}
		return nil, err
	}

	return resp, nil
}

// remove
//
//	@Tags		files
//	@Summary	Remove entity file
//	@Description	Deletes a file for any entity and removes its DB record
//	@Param		entityType	path	string	true	"Entity type"
//	@Param		entityId	path	string	true	"Entity UUID"
//	@Param		fileId		path	string	true	"File UUID"
//	@Success	200
//	@Failure	400	{object}	string
//	@Failure	500	{object}	string
//	@Router		/api/files/{entityType}/{entityId}/{fileId} [delete]
func remove(s ui.UIService) (any, error) {
	entityType, err := s.GetPathParameterAsString("entityType")
	if err != nil {
		return nil, err
	}

	entityId, err := s.GetPathParameterAsString("entityId")
	if err != nil {
		return nil, err
	}

	fileId, err := s.GetPathParameterAsString("fileId")
	if err != nil {
		return nil, err
	}

	if err := s.GetService().(*service).removeFile(s.GetRequest().Context(), entityType, entityId, fileId); err != nil {
		return nil, err
	}

	return nil, nil
}

// get
//
//	@Tags		files
//	@Summary	Get entity file
//	@Description	Serves a file for any entity (tasks, comments, posts)
//	@Produce	application/octet-stream
//	@Param		entityType	path	string	true	"Entity type"
//	@Param		entityId	path	string	true	"Entity UUID"
//	@Param		fileId		path	string	true	"File UUID"
//	@Success	200
//	@Failure	404	{object}	string
//	@Router		/api/files/{entityType}/{entityId}/{fileId} [get]
func get(s ui.UIService) (any, error) {
	entityType, err := s.GetPathParameterAsString("entityType")
	if err != nil {
		return nil, err
	}

	entityId, err := s.GetPathParameterAsString("entityId")
	if err != nil {
		return nil, err
	}

	fileId, err := s.GetPathParameterAsString("fileId")
	if err != nil {
		return nil, err
	}

	filePath, err := s.GetService().(*service).getFilePath(entityType, entityId, fileId)
	if err != nil {
		return nil, err
	}

	http.ServeFile(s.GetResponse(), s.GetRequest(), filePath)
	return nil, nil
}
