package models

import "net/http"

type Account struct {
	Id           string  `json:"id" db:"id"`
	Name         string  `json:"name" db:"name"`
	Username     string  `json:"username" db:"username"`
	AvatarUri    *string `json:"avatarUri": db:"avatar_uri"`
	PrimaryColor *int    `json:"primaryColor" db:"primary_color"`
	AccentColor  *int    `json:"accentColor" db:"accent_color"`

	SigningKeys struct {
		PrivateKeyHash []byte `json:"privateKeyHash" db:"signing_private_key_hash"`
		PublicKey      []byte `json:"publicKey" db:"signing_public_key"`
	} `json:"signingKeys"`

	EncryptionKeys struct {
		PrivateKeyHash []byte `json:"privateKeyHash" db:"encryption_private_key_hash"`
		PublicKey      []byte `json:"publicKey" db:"encryption_public_key"`
	} `json:"encryptionKeys"`

	// SigningPublicKey      []byte `json:"signingPublicKey" db:"signing_public_key"`
	// SigningPrivateKeyHash []byte `json:"signingPrivateKeyHash" db:"signing_private_key_hash"`

	// EncryptionPublicKey      []byte `json:"encryptionPublicKey" db:"encryption_public_key"`
	// EncryptionPrivateKeyHash []byte `json:"encryptionPrivateKeyHash" db:"encryption_private_key_hash"`

	PasswordSalt []byte `json:"passwordSalt" db:"password_salt"`
}

func (u *Account) Bind(r *http.Request) error {
	return nil
}
