package main

import (
	"fmt"
	"log"

	"github.com/labstack/echo/v5"
	"github.com/odama626/tasks/server/routes"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
)

type KeyStore struct {
}

// func generateKeyStore(password string) (*KeyStore, error) {
// 	store := KeyStore{}

// 	key, err := argon2.CreateHash(password, &argon2.Params{Iterations: 20})

// 	if err != nil {
// 		return nil, err
// 	}

// 	block, err := aes.NewCipher([]byte(key))

// 	if err != nil {
// 		return nil, err
// 	}

// 	cipherText := make([]byte, aes.BlockSize+len(password))

// 	iv := make([]byte,32)
// 	_, err = rand.Read(iv)

// 	stream := cipher.NewCFBEncrypter(block, iv)

// 	if err != nil {
// 		return nil, err
// 	}

// 	return &store, nil

// }

func main() {
	app := pocketbase.New()

	// serves static files from the provided public dir (if exists)
	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		e.Router.Use(func(next echo.HandlerFunc) echo.HandlerFunc {
			return func(c echo.Context) error {
				cc := &routes.CustomContext{c, app}
				return next(cc)
			}
		})

		routes.BindRoutes(e.Router)
		return nil
	})

	app.OnRecordBeforeCreateRequest("users").Add(func(e *core.RecordCreateEvent) error {
		// fmt.Println(e.Record.Get("password"))
		// password := e.Record.Get("password").(string)

		// keyStore := generateKeyStore(password)

		fmt.Println(e.Record)

		// e.Record.Set()

		return nil
	})

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
