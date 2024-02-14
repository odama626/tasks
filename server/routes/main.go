package routes

import (
	"github.com/labstack/echo/v5"
	"github.com/pocketbase/pocketbase"
)

type CustomContext struct {
	echo.Context
	App *pocketbase.PocketBase
}

func BindRoutes(router *echo.Echo) {

	router.GET("/.well-known/webfinger", webfinger)

	activityPubRouter := router.Group("/ap")

	bindUserRoutes(activityPubRouter)
}
