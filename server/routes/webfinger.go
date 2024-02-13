package routes

import (
	"net/http"
	"strings"

	"github.com/labstack/echo/v5"
)

func webfinger(c echo.Context) error {
	resourceString := c.QueryParam("resource")

	if !strings.HasPrefix(resourceString, "acct:") {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "unrecognized resource type"})
	}

	resource := resourceString[5:]

	identifier := strings.Split(resource, "@")

	if identifier[1] != c.Request().Host {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "not authorative for domain " + identifier[1]})
	}

	uri := "//" + c.Request().Host + "/ac/users/" + identifier[0]

	return c.JSON(http.StatusOK, map[string]interface{}{
		"subject": resourceString,
		"aliases": []string{uri},
		"links": []interface{}{map[string]string{
			"rel":  "self",
			"type": "application/activity+json",
			"href": uri,
		}},
	})
}
