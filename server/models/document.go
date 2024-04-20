package models

import "net/http"

type Document struct {
	Id string `json:"id" db:"id"`
	// Title     string `json:"title" db:"title"`  doesn't exist, since encrypted
	CreatedBy string `json:"createdBy" db:"created_by"`
	IsDeleted string `json:"isDeleted" db:"is_deleted"`
	FileId    string `json:"fileId" db:"file_id"`
	// should each document have a signing public key?
}

func (d *Document) Bind(r *http.Request) error {
	return nil
}
