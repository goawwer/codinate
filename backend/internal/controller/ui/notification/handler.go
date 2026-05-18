package notification

import (
	"reflect"
	"time"

	"github.com/goawwer/codinate/internal/adapter/model/enum"
	"github.com/goawwer/codinate/internal/controller/ui"
	"github.com/google/uuid"
)

func Register() {
	ui.RegisterGet("/notifications", enum.AnyUser, reflect.TypeOf(service{}), list)
	ui.RegisterGet("/notifications/unread-count", enum.AnyUser, reflect.TypeOf(service{}), unreadCount)
	ui.RegisterPost("/notifications/read-all", enum.AnyUser, reflect.TypeOf(service{}), markAllAsRead)
	ui.RegisterPost("/notifications/{id}/read", enum.AnyUser, reflect.TypeOf(service{}), markAsRead)
}

func list(s ui.UIService) (any, error) {
	u, err := s.GetCurrentUser()
	if err != nil {
		return nil, err
	}

	var since *time.Time
	if sinceStr, err := s.GetUrlParamAsString("since"); err == nil && sinceStr != "" {
		if t, err := time.Parse(time.RFC3339Nano, sinceStr); err == nil {
			since = &t
		}
	}

	return s.GetService().(*service).list(s.GetRequest().Context(), u.Id, since)
}

func unreadCount(s ui.UIService) (any, error) {
	u, err := s.GetCurrentUser()
	if err != nil {
		return nil, err
	}

	return s.GetService().(*service).unreadCount(s.GetRequest().Context(), u.Id)
}

func markAllAsRead(s ui.UIService) (any, error) {
	u, err := s.GetCurrentUser()
	if err != nil {
		return nil, err
	}

	return nil, s.GetService().(*service).markAllAsRead(s.GetRequest().Context(), u.Id)
}

func markAsRead(s ui.UIService) (any, error) {
	u, err := s.GetCurrentUser()
	if err != nil {
		return nil, err
	}

	id, err := s.GetPathParameterAsString("id")
	if err != nil {
		return nil, err
	}

	return nil, s.GetService().(*service).markAsRead(s.GetRequest().Context(), uuid.MustParse(id), u.Id)
}
