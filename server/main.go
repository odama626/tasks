package main

import (
	"crypto/aes"
	"crypto/x509"
	"encoding/base64"
	"fmt"
	"log"

	"github.com/labstack/echo/v5"
	"github.com/odama626/tasks/server/routes"
	"github.com/odama626/tasks/server/secure"
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
		fmt.Println(e.Record)
		fmt.Println("Wtffs")
		password := e.Record.PasswordHash()
		fmt.Println("asdfsdfdf")
		fmt.Println(password)

		salt, err := secure.GenerateSalt(32)
		if err != nil {
			fmt.Println(err)
			return err
		}

		fmt.Println("generated salt")

		keyPair, err := secure.CreateKeyPair()
		if err != nil {
			fmt.Println(err)
			return err
		}

		publicKey, err := x509.MarshalPKIXPublicKey(&keyPair.PublicKey)

		if err != nil {
			fmt.Println(err)
			return err
		}

		fmt.Println("set Public key")

		e.Record.Set("publicKey", base64.StdEncoding.EncodeToString(publicKey))

		fmt.Println("public key set")

		key, err := x509.MarshalPKCS8PrivateKey(keyPair)
		if err != nil {
			fmt.Println(err)
			return err
		}

		iv, err := secure.GenerateSalt(aes.BlockSize)
		if err != nil {
			fmt.Println(err)
			return err
		}

		fmt.Println("setting password")

		keyHash, err := secure.EncryptWithPassword([]byte(password), salt, iv, key)

		fmt.Println("set password")

		if err != nil {
			fmt.Println(err)
			return err
		}

		fmt.Println("encrypted keyHash")

		keyStore := map[string]string{
			"keyHash": base64.StdEncoding.EncodeToString(keyHash),
			"iv":      base64.StdEncoding.EncodeToString(iv),
			"salt":    base64.StdEncoding.EncodeToString(salt),
		}

		fmt.Println("blah")

		e.Record.Set("keyStore", keyStore)

		return nil
	})

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
