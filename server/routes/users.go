package routes

import (
	"encoding/json"
	"net/http"

	"github.com/labstack/echo/v5"
	"github.com/pocketbase/pocketbase/apis"
)

func getUser(c echo.Context) error {

	app := c.(*CustomContext).App
	username := c.PathParams().Get("username", "")
	uri := c.Request().Host + c.Request().URL.Path

	record, err := app.Dao().FindFirstRecordByData("users", "username", username)

	if err != nil {
		return apis.NewNotFoundError("unable to find user", nil)
	}

	// username := c.PathParam("username")

	return c.JSON(http.StatusOK, map[string]interface{}{
		"@context": []string{"https://w3.org/ns/activitystreams", "https://w3id.org/security/v1"},
		"type":     "Person",
		"inbox":    uri + "/inbox",
		"outbox":   uri + "/outbox",
		"endpoints": map[string]string{
			"sharedInbox": c.Request().Host + "/ap/inbox",
		},
		"id": record.Id,
		"publicKey": map[string]string{
			"id":           uri + "#public-key",
			"owner":        uri,
			"publicKeyPem": "123",
		},
	})
}

type ApActor struct {
}

type ApAction struct {
	Context []string `query:"@context"`
	Type    string   `query:"type"`
	Actor   string   `query:"actor"`
}

func postOutbox(c echo.Context) error {
	// app := c.(*CustomContext).App
	// username := c.PathParams().Get("username", "")

	body := make(map[string]interface{})

	err := json.NewDecoder(c.Request().Body).Decode(&body)

	if err != nil {
		return err
	}

	return nil

}

func bindUserRoutes(router *echo.Group) {
	// TODO: work on inbox and outbox for activities
	// router.GET("/users/:username/inbox", nil)
	router.POST("/users/:username/outbox", postOutbox)
	router.GET("/users/:username", getUser)
}
