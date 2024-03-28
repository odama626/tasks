package routes

import (
	"fmt"
	"io"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/render"
	"github.com/odama626/tasks/server/crypto"
	"github.com/odama626/tasks/server/httpError"
	"github.com/odama626/tasks/server/models"
	"github.com/vmihailenco/msgpack/v5"
)

func register(w http.ResponseWriter, r *http.Request) {
	account := &models.Account{}
	signature := r.Header.Get("signature")

	payload, err := io.ReadAll(r.Body)

	if err != nil {
		render.Render(w, r, httpError.InvalidRequest(err))
		return
	}
	err = msgpack.Unmarshal(payload, account)

	fmt.Println(account.SigningKeys.PublicKey)
	if err != nil {
		render.Render(w, r, httpError.InvalidRequest(err))
		return
	}

	err = crypto.VerifySignature(account.SigningKeys.PublicKey, payload, signature)
	if err != nil {
		render.Render(w, r, httpError.InvalidRequest(err))
		return
	}
}

func ConnectAccountRoutes(router chi.Router) {
	router.Post("/register", register)
}
