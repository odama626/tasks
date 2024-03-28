package crypto

import (
	"crypto"
	"crypto/rsa"
	"crypto/sha512"
	"encoding/base64"

	"github.com/lestrrat-go/jwx/jwk"
)

func VerifySignature(jwkPublicKey interface{}, payload []byte, encodedSignature string) error {
	signature, err := base64.StdEncoding.DecodeString(encodedSignature)
	if err != nil {
		return err
	}

	jwkKey, err := jwk.PublicKeyOf(jwkPublicKey)
	if err != nil {
		return err
	}
	var publicKey rsa.PublicKey

	err = jwkKey.Raw(&publicKey)

	if err != nil {
		return err
	}

	hashed := sha512.Sum512(payload)

	return rsa.VerifyPKCS1v15(&publicKey, crypto.SHA512, hashed[:], signature)
}
