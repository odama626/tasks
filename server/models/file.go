package models

import "net/http"

type File struct {
	Id      string `json:"id" db:"id"`
	FileUri string `json:"fileUri" db:"file_uri"`
}

func (f *File) Bind(r *http.Request) error {
	return nil
}
