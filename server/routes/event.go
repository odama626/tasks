package routes

import (
	"errors"
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

func VerifySignature(body []byte, r *http.Request) error {
	var publicKey interface{}

	signature := r.Header.Get("signature")
	signer := r.Header.Get("signer")

	ctx := r.Context()
	db := GetDb(ctx)

	err := db.QueryRow(ctx, `select signing_public_key from accounts where username = $1`, signer).Scan(&publicKey)

	if err != nil {
		return err
	}

	err = crypto.VerifySignature(publicKey, body, signature)

	if err != nil {
		return err
	}

	return nil

}

func post(w http.ResponseWriter, r *http.Request) {
	event := &models.Event{}

	rawPayload, err := io.ReadAll(r.Body)
	err = msgpack.Unmarshal(rawPayload, event)
	if err != nil {
		render.Render(w, r, httpError.InvalidRequest(err))
		return
	}

	// fmt.Println(event)

	if err := VerifySignature(rawPayload, r); err != nil {
		fmt.Println(err)
		render.Render(w, r, httpError.InvalidRequest(errors.New("Signature Invalid")))
		return
	}

	// fmt.Println(event)

	render.JSON(w, r, map[string]interface{}{"success": true})
}

func ConnectEventRoutes(router chi.Router) {

	router.Post("/", post)
}
