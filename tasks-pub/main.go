package main

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/unrolled/render"

	"tasks-pub/routes"
)

func main() {
	router := chi.NewRouter()
	render := render.New()

	router.Use(middleware.Logger)
	router.Use(middleware.Recoverer)

	routes.ConnectRoute(router)
	router.Get("/", func(w http.ResponseWriter, r *http.Request) {
		render.JSON(w, http.StatusOK, map[string]string{"hello": "world"})
	})

	http.ListenAndServe(":3000", router)
}
