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

// list
//
//	@Tags		notifications
//	@Summary	List notifications
//	@Description	Returns notifications for the current user, optionally filtered by a since timestamp
//	@Produce	json
//	@Param		since	query		string	false	"RFC3339 timestamp to fetch notifications after"
//	@Success	200	{object}	[]notification.Row
//	@Failure	401	{object}	string	"Unauthorized"
//	@Failure	500	{object}	string	"Internal Server Error"
//	@Router		/api/notifications [get]
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

// unreadCount
//
//	@Tags		notifications
//	@Summary	Get unread notification count
//	@Description	Returns the number of unread notifications for the current user
//	@Produce	json
//	@Success	200	{object}	notification.UnreadCount
//	@Failure	401	{object}	string	"Unauthorized"
//	@Failure	500	{object}	string	"Internal Server Error"
//	@Router		/api/notifications/unread-count [get]
func unreadCount(s ui.UIService) (any, error) {
	u, err := s.GetCurrentUser()
	if err != nil {
		return nil, err
	}

	return s.GetService().(*service).unreadCount(s.GetRequest().Context(), u.Id)
}

// markAllAsRead
//
//	@Tags		notifications
//	@Summary	Mark all notifications as read
//	@Description	Marks all notifications for the current user as read
//	@Produce	json
//	@Success	200
//	@Failure	401	{object}	string	"Unauthorized"
//	@Failure	500	{object}	string	"Internal Server Error"
//	@Router		/api/notifications/read-all [post]
func markAllAsRead(s ui.UIService) (any, error) {
	u, err := s.GetCurrentUser()
	if err != nil {
		return nil, err
	}

	return nil, s.GetService().(*service).markAllAsRead(s.GetRequest().Context(), u.Id)
}

// markAsRead
//
//	@Tags		notifications
//	@Summary	Mark notification as read
//	@Description	Marks a specific notification as read for the current user
//	@Produce	json
//	@Param		id	path	string	true	"Notification UUID"
//	@Success	200
//	@Failure	400	{object}	string	"Bad Request"
//	@Failure	401	{object}	string	"Unauthorized"
//	@Failure	500	{object}	string	"Internal Server Error"
//	@Router		/api/notifications/{id}/read [post]
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
