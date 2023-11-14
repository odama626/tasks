package routes

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/json"
	"encoding/pem"
	"errors"
	"fmt"
	"net/http"
	"os"
	"tasks-pub/httpError"
	"tasks-pub/jsonld"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/render"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

type User struct {
	Id            string
	Username      string
	Email         string
	password_hash string
	private_key   string
	Public_key    string
}

// custom marshalling https://medium.com/@anuragv.1020/golangs-custom-json-marshal-79ce2646ba8c
func (u User) MarshalJSON() ([]byte, error) {
	domain := os.Getenv("DOMAIN")
	userUrlPrefix := fmt.Sprintf("https://%s/users/%s/inbox", domain, u.Username)
	println("wtf")

	return json.Marshal(jsonld.UserLd{
		Context:           []string{0: "https://www.w3.org/ns/activitystreams", 1: "https://w3id.org/security/v1"},
		Id:                u.Id,
		Type:              "Person",
		PreferredUsername: u.Username,
		Inbox:             userUrlPrefix + "/inbox",
		Outbox:            userUrlPrefix + "/outbox",
		Endpoints: map[string]string{
			"sharedInbox": fmt.Sprintf("https://%s/inbox", domain),
		},
		PublicKey: jsonld.PublicKey{
			Id:           userUrlPrefix + "#public-key",
			Owner:        userUrlPrefix,
			PublicKeyPem: u.Public_key,
		},
	})
}

// type composition https://attilaolah.eu/2014/09/10/json-and-struct-composition-in-go/
type UserRequest struct {
	*User
	pubic_key string
}

type RegisterRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
	Email    string `json:"email"`
}

func (a *RegisterRequest) Bind(r *http.Request) error {
	return nil
}

func hashPassword(password string) (string, error) {
	passwordBytes := []byte(password)

	hashedPasswordBytes, err := bcrypt.GenerateFromPassword(passwordBytes, bcrypt.DefaultCost)

	return string(hashedPasswordBytes), err
}

func isPasswordCorrect(password string, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

type PemKeyPair struct {
	private string
	public  string
}

func generateKeyPair() (*PemKeyPair, error) {
	bitSize := 4096

	// Generate RSA key.
	key, err := rsa.GenerateKey(rand.Reader, bitSize)
	if err != nil {
		return nil, err
	}

	// Extract public component.
	pub := key.Public()

	// Encode private key to PKCS#1 ASN.1 PEM.
	private := pem.EncodeToMemory(
		&pem.Block{
			Type:  "RSA PRIVATE KEY",
			Bytes: x509.MarshalPKCS1PrivateKey(key),
		},
	)

	// Encode public key to PKCS#1 ASN.1 PEM.
	public := pem.EncodeToMemory(
		&pem.Block{
			Type:  "RSA PUBLIC KEY",
			Bytes: x509.MarshalPKCS1PublicKey(pub.(*rsa.PublicKey)),
		},
	)

	return &PemKeyPair{private: string(private), public: string(public)}, nil
}

func post(w http.ResponseWriter, r *http.Request) {
	body := &RegisterRequest{}

	if err := render.Bind(r, body); err != nil {
		render.Render(w, r, httpError.InvalidRequest(err))
		return
	}

	conn := r.Context().Value("db").(*pgxpool.Pool)

	println("query")

	rows, err := conn.Query(context.Background(), `select id from users where username=$1`, body.Username)
	println("finished query")
	if rows.Next() || rows.Err() != nil {
		render.Render(w, r, httpError.InvalidRequest(errors.New("A user with that username already exists")))
		return
	}

	println("ran next")

	user := User{
		Id:       fmt.Sprintf("https://%s/users/%s", os.Getenv("DOMAIN"), body.Username),
		Email:    body.Email,
		Username: body.Username,
	}

	println("hashing password")

	hash, err := hashPassword(body.Password)

	if err != nil {
		render.Render(w, r, httpError.InvalidRequest(err))
		return
	}

	user.password_hash = hash

	println("hashed password")

	keyPair, err := generateKeyPair()

	if err != nil {
		render.Render(w, r, httpError.Internal(err))
		return
	}

	println("generated keypair")

	user.private_key = keyPair.private
	user.Public_key = keyPair.public

	_, err = conn.Exec(
		context.Background(),
		`insert into users(
			id,
			username,
			email,
			password_hash,
			private_key,
			public_key
		) values ($1, $2, $3, $4, $5, $6)`,
		user.Id,
		user.Username,
		user.Email,
		user.password_hash,
		user.private_key,
		user.Public_key)

	if err != nil {
		render.Render(w, r, httpError.Internal(err))
		return
	}

	render.JSON(w, r, user)
}

// chi router example https://github.com/go-chi/chi/blob/master/_examples/rest/main.go#L319
func UserRouter(r chi.Router) {
	r.Post("/", post)
}
