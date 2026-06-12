package middleware

import "github.com/go-chi/cors"

func CorsConfig() *cors.Cors {
	return cors.New(cors.Options{
		AllowedOrigins: []string{"http://localhost:4200", "http://localhost:80", "http://localhost"},
		AllowedMethods: []string{"GET", "POST", "PUT", "PATCH", "DELETE"},
		AllowedHeaders: []string{"Content-Type", "Accept", "Authorization", "X-CSRF-Token"},

		ExposedHeaders:   []string{"Cursor"},
		AllowCredentials: true,
		MaxAge:           86400,
	})
}
