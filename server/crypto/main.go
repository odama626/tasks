package crypto

import (
	"crypto"
	"crypto/rsa"
	"crypto/sha512"
	"encoding/base64"
	"encoding/json"

	"github.com/lestrrat-go/jwx/jwk"
)

func ParsePublicKey(jwkPublicKey interface{}) (*rsa.PublicKey, error) {

	json, err := json.Marshal(jwkPublicKey)

	if err != nil {
		return nil, err
	}

	jwkKey, err := jwk.ParseKey(json)
	if err != nil {
		return nil, err
	}
	var publicKey rsa.PublicKey

	err = jwkKey.Raw(&publicKey)

	if err != nil {
		return nil, err
	}

	return &publicKey, nil
}

func VerifySignature(jwkPublicKey interface{}, payload []byte, encodedSignature string) error {
	signature, err := base64.StdEncoding.DecodeString(encodedSignature)
	if err != nil {
		return err
	}

	publicKey, err := ParsePublicKey(jwkPublicKey)

	if err != nil {
		return err
	}

	hashed := sha512.Sum512(payload)

	return rsa.VerifyPKCS1v15(publicKey, crypto.SHA512, hashed[:], signature)
}
