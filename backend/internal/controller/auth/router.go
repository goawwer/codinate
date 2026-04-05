package auth

import (
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/render"
)

func PrepareRouter(root *chi.Mux) {
	root.Route("/auth", func(r chi.Router) {
		r.Use(render.SetContentType(render.ContentTypeJSON))
		r.Get("/refresh", refresh)
		r.Get("/logout", logout)
		r.Post("/login", login)
	})
}
