package routes

import (
	"github.com/go-chi/chi/v5"
)

func ConnectRoute(parent *chi.Mux) {
	parent.Route("/.well-known", func(r chi.Router) {
		r.Get("/webfinger", Webfinger)
	})

	parent.Route("/users", UserRouter)

}
