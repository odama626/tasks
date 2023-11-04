package routes

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/unrolled/render"
)

func webfinger(w http.ResponseWriter, r *http.Request) {
	render := render.New()
	resource := r.URL.Query().Get("resource")

	resourceType, value := strings.Split(resource, ":")

	if resourceType != "acct" {
		return render.JSON(w, http.StatusBadRequest, map[string]string{"message": "unrecognized resource type"})
	}

	fmt.Print("resource", resource)
	render.JSON(w, http.StatusOK, map[string]string{"resource": resource})
}

func ConnectRoute(parent *chi.Mux) {
	parent.Route("/.well-known", func(r chi.Router) {
		r.Get("/webfinger", webfinger)
	})

	parent.Route("/users", func(r chi.Router) {
	})
}
