//go:build !swagger

package router

import "github.com/go-chi/chi/v5"

func registerSwagger(_ *chi.Mux) {}
