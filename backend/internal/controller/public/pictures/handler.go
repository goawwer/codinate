package pictures

import (
	"net/http"
	"path"
	"reflect"

	"github.com/goawwer/codinate/internal/controller/public"
	"github.com/spf13/viper"
)

type service struct{}

func Register() {
	public.RegisterGet("/{entity_type}", reflect.TypeOf(service{}), getEntityAvatar)
}

// getEntityPicture
//
//	@Tags		pictures
//	@Summary	Get entity picture
//	@Description	Serves a picture file for a given entity type (e.g. teams, projects)
//	@Produce	image/*
//	@Param		entity_type	path	string	true	"Entity type (e.g. teams, projects)"
//	@Param		filename	query	string	true	"Picture filename"
//	@Success	200
//	@Failure	404	{object}	string	"Not Found"
//	@Failure	500	{object}	string	"Internal Server Error"
//	@Router		/{entity_type} [get]
func getEntityAvatar(s public.PublicService) (any, error) {
	entityType, err := s.GetPathParameterAsString("entity_type")
	if err != nil {
		return nil, err
	}

	filename, _ := s.GetUrlParamAsString("filename")
	file := path.Join(viper.GetString("UPLOADS_DIR"), "avatars", entityType, filename)

	http.ServeFile(s.GetResponse(), s.GetRequest(), file)

	return nil, nil
}
