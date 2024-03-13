package routes

import (
	"fmt"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/render"
	"github.com/odama626/tasks/server/httpError"
	"github.com/odama626/tasks/server/models"
	"github.com/vmihailenco/msgpack/v5"
)

func BindMsgPack(request *http.Request, v render.Binder) error {
	decoder := msgpack.NewDecoder(request.Body)
	return decoder.Decode(v)
}

func register(w http.ResponseWriter, r *http.Request) {
	account := &models.Account{}

	err := BindMsgPack(r, account)

	if err != err {
		render.Render(w, r, httpError.InvalidRequest(err))
		return
	}

	// fmt.Print(account)
	fmt.Println(len(account.PasswordSalt.([]byte)))

}

func ConnectAccountRoutes(router chi.Router) {
	router.Post("/register", register)
}
