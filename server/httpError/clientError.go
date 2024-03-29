package httpError

import (
	"net/http"

	"github.com/go-chi/render"
)

type ErrResponse struct {
	Err            error `json:"-"` // low-level runtime error
	HTTPStatusCode int   `json:"-"` // http response status code

	StatusText string      `json:"status"`            // user-level status message
	AppCode    int64       `json:"code,omitempty"`    // application-specific error code
	Message    string      `json:"message,omitempty"` // application-level error message, for debugging
	Data       interface{} `json:"data,omitempty"`
}

func (e *ErrResponse) Render(w http.ResponseWriter, r *http.Request) error {
	render.Status(r, e.HTTPStatusCode)
	return nil
}

func InvalidRequest(err error) render.Renderer {
	return &ErrResponse{
		Err:            err,
		HTTPStatusCode: 400,
		StatusText:     "Invalid request.",
		Message:        err.Error(),
	}
}

func InvalidRequestWithData(err error, data interface{}) render.Renderer {
	return &ErrResponse{
		Err:            err,
		HTTPStatusCode: 400,
		StatusText:     "Invalid request.",
		Message:        err.Error(),
		Data:           data,
	}
}

func Internal(err error) render.Renderer {
	return &ErrResponse{
		Err:            err,
		HTTPStatusCode: 500,
		StatusText:     "Internal server error.",
		Message:        err.Error(),
	}
}
