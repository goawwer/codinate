package router

import (
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/render"
	"github.com/goawwer/codinate/docs"
	"github.com/goawwer/codinate/internal/controller/auth"
	"github.com/goawwer/codinate/internal/controller/public"
	"github.com/goawwer/codinate/internal/controller/ui"
	serviceMiddleware "github.com/goawwer/codinate/internal/service/middleware"
	"github.com/goawwer/codinate/pkg/debug"
	"github.com/goawwer/codinate/pkg/logger"
	httpSwagger "github.com/swaggo/http-swagger"
)

func init() {
}

func InitializeAppRouter() *chi.Mux {
	root := chi.NewRouter()
	root.Use(middleware.Recoverer)
	root.Use(middleware.RequestID)
	root.Use(middleware.RealIP)
	root.Use(serviceMiddleware.CorsConfig().Handler)
	root.Use(logger.NewHttpLooger())

	if debug.IsEnabled {
		logger.Debug("swagger docs available at: /swagger/index.html")

		docs.SwaggerInfo.Host = ""

		root.Get("/swagger/*", httpSwagger.Handler(
			httpSwagger.URL("swagger/doc.json"),
		))
	}

	apiRouter := chi.NewRouter()
	apiRouter.Group(func(r chi.Router) {
		r.Use(middleware.RedirectSlashes)
		r.Use(serviceMiddleware.HandleMiddlewareWithAccessToken)
		r.Mount("/", ui.Router())
	})

	publicRouter := chi.NewRouter()
	publicRouter.Use(render.SetContentType(render.ContentTypeJSON))
	publicRouter.Group(func(r chi.Router) {
		r.Use(middleware.RedirectSlashes)
		r.Use(serviceMiddleware.HandleMiddlewareWithAccessToken)
		r.Mount("/", public.Router())
	})

	auth.PrepareRouter(root)
	root.Mount("/api", apiRouter)
	root.Mount("/apipublic", publicRouter)

	return root
}
