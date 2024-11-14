package models

import "net/http"

type Account struct {
	Id           string  `msgpack:"id" json:"id" db:"id"`
	Name         string  `msgpack:"name" json:"name" db:"name"`
	Username     string  `msgpack:"username" json:"username" db:"username"`
	AvatarUri    *string `msgpack:"avatarUri": json:"avatarUri": db:"avatar_uri"`
	PrimaryColor *int    `msgpack:"primaryColor" json:"primaryColor" db:"primary_color"`
	AccentColor  *int    `msgpack:"accentColor" json:"accentColor" db:"accent_color"`

	SigningKeys struct {
		PrivateKeyHash []byte      `msgpack:"privateKeyHash" json:"privateKeyHash" db:"signing_private_key_hash"`
		PublicKey      interface{} `msgpack:"publicKey" json:"publicKey" db:"signing_public_key"`
	} `json:"signingKeys" msgpack:"signingKeys" db:""`

	EncryptionKeys struct {
		PrivateKeyHash []byte      `msgpack:"privateKeyHash" json:"privateKeyHash" db:"encryption_private_key_hash"`
		PublicKey      interface{} `msgpack:"publicKey" json:"publicKey" db:"encryption_public_key"`
	} `msgpack:"encryptionKeys" json:"encryptionKeys" db:""`

	PasswordSalt []byte `msgpack:"passwordSalt" json:"passwordSalt" db:"password_salt"`
}

func (u *Account) Bind(r *http.Request) error {
	return nil
}
