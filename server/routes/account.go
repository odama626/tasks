package routes

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"

	"github.com/georgysavva/scany/v2/pgxscan"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/render"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/odama626/tasks/server/crypto"
	"github.com/odama626/tasks/server/httpError"
	"github.com/odama626/tasks/server/models"
	"github.com/vmihailenco/msgpack/v5"
)

func Bind(body io.ReadCloser, v interface{}) error {
	payload, err := io.ReadAll(body)

	if err != nil {
		return err
	}
	err = msgpack.Unmarshal(payload, v)

	if err != nil {
		return err
	}

	return nil
}

func GetDb(ctx context.Context) *pgxpool.Pool {
	return ctx.Value("db").(*pgxpool.Pool)
}

func register(w http.ResponseWriter, r *http.Request) {
	account := &models.Account{}
	signature := r.Header.Get("signature")

	payload, err := io.ReadAll(r.Body)

	if err != nil {
		render.Render(w, r, httpError.InvalidRequest(err))
		return
	}
	err = msgpack.Unmarshal(payload, account)

	if err != nil {
		render.Render(w, r, httpError.InvalidRequest(err))
		return
	}

	err = crypto.VerifySignature(account.SigningKeys.PublicKey, payload, signature)
	if err != nil {
		render.Render(w, r, httpError.InvalidRequest(err))
		return
	}

	ctx := r.Context()
	db := GetDb(ctx)

	existing := models.Account{}

	fmt.Println(account.Username)

	err = pgxscan.Get(ctx, db, &existing, `Select id  from accounts where username = $1 limit 1`, account.Username)

	if pgxscan.NotFound(err) {
		// fall through
	} else if err != nil {
		render.Render(w, r, httpError.Internal(err))
		return
	} else {
		render.Status(r, 400)
		render.Render(w, r, httpError.InvalidRequestWithData(
			errors.New("Failed to create record"),
			map[string]interface{}{"username": "The username is invalid or already in use."},
		))
		return
	}

	result := models.Account{}

	query := `INSERT into accounts
		(name, username, password_salt, encryption_private_key_hash, encryption_public_key, signing_private_key_hash, signing_public_key) VALUES (
			@name, @username, @password_salt,  @encryption_private_key_hash, @encryption_public_key, @signing_private_key_hash, @signing_public_key
		) returning *`

	args := pgx.NamedArgs{
		"name":                        account.Name,
		"username":                    account.Username,
		"password_salt":               account.PasswordSalt,
		"encryption_private_key_hash": account.EncryptionKeys.PrivateKeyHash,
		"encryption_public_key":       account.EncryptionKeys.PublicKey,
		"signing_private_key_hash":    account.SigningKeys.PrivateKeyHash,
		"signing_public_key":          account.SigningKeys.PublicKey,
	}

	err = pgxscan.Get(ctx, db, &result, query, args)

	if err != nil {
		render.Render(w, r, httpError.Internal(err))
		return
	}
	payload, err = msgpack.Marshal(result)

	if err != nil {
		render.Render(w, r, httpError.Internal(err))
		return
	}

	w.WriteHeader(200)
	w.Write(payload)
}

type LoginPayload struct {
	Username string `json:"username"`
}

func Login(w http.ResponseWriter, r *http.Request) {
	account := &models.Account{}
	payload := &LoginPayload{}

	signature := r.Header.Get("signature")

	rawPayload, err := io.ReadAll(r.Body)

	if err != nil {
		render.Render(w, r, httpError.InvalidRequest(err))
		return
	}

	err = msgpack.Unmarshal(rawPayload, payload)

	if err != nil {
		render.Render(w, r, httpError.InvalidRequest(err))
		return
	}

	ctx := r.Context()
	db := GetDb(ctx)

	err = pgxscan.Get(ctx, db, &account, `select * from accounts where username = $1`, payload.Username)

	if err != nil {
		render.Render(w, r, httpError.InvalidRequest(err))
		return
	}

	err = crypto.VerifySignature(account.SigningKeys.PublicKey, rawPayload, signature)

	if err != nil {
		render.Render(w, r, httpError.InvalidRequest(err))
	}
}

func getByUsername(w http.ResponseWriter, r *http.Request) {
	username := chi.URLParam(r, "username")

	account := models.Account{}

	ctx := r.Context()
	db := GetDb(ctx)

	err := pgxscan.Get(ctx, db, &account, `select * from accounts where username = $1`, username)

	if err != nil {
		render.Render(w, r, httpError.InvalidRequest(errors.New("Failed to authenticate")))
		return
	}

	payload, err := msgpack.Marshal(account)

	if err != nil {
		render.Render(w, r, httpError.Internal(err))
	}

	w.Write(payload)

}

type DeleteAccountPayload struct {
	Username string `msgpack:"username"`
}

func deleteAccount(w http.ResponseWriter, r *http.Request) {
	payload := &DeleteAccountPayload{}
	ctx := r.Context()
	db := GetDb(ctx)

	rawPayload, err := io.ReadAll(r.Body)

	if err != nil {
		render.Render(w, r, httpError.InvalidRequest(err))
		return
	}

	err = msgpack.Unmarshal(rawPayload, payload)

	if err = VerifySignature(rawPayload, r); err != nil {
		fmt.Println(err)
		render.Render(w, r, httpError.InvalidRequest(errors.New("Invalid Signature")))
		return
	}

	_, err = db.Exec(ctx, `delete from accounts where username = $1`, payload.Username)

	if err != nil {
		render.Render(w, r, httpError.Internal(err))
		return
	}

	w.WriteHeader(200)
}

func ConnectAccountRoutes(router chi.Router) {
	router.Post("/register", register)
	router.Post("/delete", deleteAccount)
	router.Get("/username/{username}", getByUsername)
}
