package models

import "net/http"

type Page struct {
	Id        string `json:"id" db:"id"`
	Title     string `json:"title" db:"title"`
	CreatedBy string `json:"createdBy" db:"created_by"`
	IsDeleted string `json:"isDeleted" db:"is_deleted"`
	FileId    string `json:"fileId" db:"file_id"`
}

func (p *Page) Bind(r *http.Request) error {
	return nil
}
