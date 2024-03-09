package models

import "net/http"

type Account struct {
	Id           string `json:"id" db:"id"`
	Name         string `json:"name" db:"name"`
	Username     string `json:"username" db:"username"`
	AvatarUri    string `json:"avatarUri": db:"avatar_uri"`
	PrimaryColor int    `json:"primaryColor" db:"primary_color"`
	AccentColor  int    `json:"accentColor" db:"accent_color"`

	PublicKey      []byte `json:"publicKey" db:"public_key"`
	PrivateKeyHash []byte `json:"privateKeyHash" db:"private_key_hash"`
	PasswordSalt   []byte `db:"password_salt"`
}

func (u *Account) Bind(r *http.Request) error {
	return nil
}
