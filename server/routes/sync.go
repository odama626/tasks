package routes

import (
	"net/http"

	"github.com/go-chi/chi/v5"
)

func ConnectSyncRoutes(parent *chi.Mux) {
	parent.Get("/", getSync)
}

func getSync(w http.ResponseWriter, r *http.Request) {
	// ctx := r.Context()
	// db := ctx.Value("db").(*pgxpool.Pool)
}
