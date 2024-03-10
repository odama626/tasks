package routes

import (
	"fmt"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/render"
	"github.com/odama626/tasks/server/httpError"
	"github.com/odama626/tasks/server/models"
	"github.com/ugorji/go/codec"
)

func BindMsgPack(request *http.Request, v render.Binder) error {

	// ... assume b contains the bytes to decode from
	h := new(codec.MsgpackHandle)
	var dec *codec.Decoder = codec.NewDecoder(request.Body, h)
	return dec.Decode(v) //v2 or v8, or a pointer to v1, v3, v4, v5, v6, v7
}

func register(w http.ResponseWriter, r *http.Request) {
	account := &models.Account{}

	err := BindMsgPack(r, account)

	if err != err {
		render.Render(w, r, httpError.InvalidRequest(err))
		return
	}

	fmt.Print(account.EncryptionPrivateKeyHash)

}

func ConnectAccountRoutes(router chi.Router) {
	router.Post("/register", register)
}
