package routes

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/render"
)

func ConnectRoute(parent *chi.Mux) {
	parent.Get("/ping", pong)
}

func pong(w http.ResponseWriter, r *http.Request) {
	render.JSON(w, r, map[string]interface{}{"pong": true})
}
