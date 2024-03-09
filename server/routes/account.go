package routes

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/render"
	"github.com/odama626/tasks-server/httpError"
	"github.com/odama626/tasks-server/models"
)

func register(w http.ResponseWriter, r *http.Request) {
	account := &models.Account{}

	err := render.Bind(r, account)

	if err != err {
		render.Render(w, r, httpError.InvalidRequest(err))
		return
	}

}

func ConnectUserRoutes(parent *chi.Mux) {
	parent.Post("/register", register)
}
