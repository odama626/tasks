package routes

import "github.com/go-chi/chi/v5"

type User struct {
}

// type composition https://attilaolah.eu/2014/09/10/json-and-struct-composition-in-go/
type UserRequest struct {
	*User
}

// chi router example https://github.com/go-chi/chi/blob/master/_examples/rest/main.go#L319
func UserRouter(r chi.Router) {

}
