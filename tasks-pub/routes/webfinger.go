package routes

import (
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/unrolled/render"
)

func Webfinger(w http.ResponseWriter, r *http.Request) {

	render := render.New()
	resourceString := r.URL.Query().Get("resource")

	if !strings.HasPrefix(resourceString, "acct:") {
		render.JSON(w, http.StatusBadRequest, map[string]string{"message": "unrecognized resource type"})
		return
	}

	resource := resourceString[5:]

	identifier := strings.Split(resource, "@")

	fmt.Println(identifier)

	if identifier[1] != os.Getenv("DOMAIN") {
		render.JSON(w, http.StatusBadRequest, map[string]string{"message": "user not associated with domain"})
		return
	}

	w.Write([]byte(fmt.Sprintf(`{"subject": "%s", "links": [{ "rel": "self", "type": "application/activity+json", "href": "https://%s/users/%s" }]}`, resource, identifier[1], identifier[0])))
}
