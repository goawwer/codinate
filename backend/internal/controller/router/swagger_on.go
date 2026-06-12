//go:build swagger

package router

import (
	"github.com/go-chi/chi/v5"
	"github.com/goawwer/codinate/docs"
	"github.com/goawwer/codinate/pkg/logger"
	httpSwagger "github.com/swaggo/http-swagger"
)

func registerSwagger(root *chi.Mux) {
	logger.Debug("swagger docs available at: /swagger/index.html")
	docs.SwaggerInfo.Host = ""
	root.Get("/swagger/*", httpSwagger.Handler(
		httpSwagger.URL("swagger/doc.json"),
	))
}
