package worklog

import (
	"reflect"

	"github.com/goawwer/codinate/internal/adapter/dto/worklog"
	"github.com/goawwer/codinate/internal/adapter/model/enum"
	"github.com/goawwer/codinate/internal/controller/ui"
	"github.com/google/uuid"
)

func Register() {
	ui.RegisterPost("/worklogs/add", enum.AnyUser, reflect.TypeOf(service{}), add)
	ui.RegisterGet("/worklogs/leaderboard", enum.AnyUser, reflect.TypeOf(service{}), getLeaderboard)
	ui.RegisterPost("/worklogs/leaderboard/recalculate", enum.AtLeastAdmin, reflect.TypeOf(service{}), recalculateLeaderboard)
	ui.RegisterGet("/worklogs/{user_id}/all", enum.AnyUser, reflect.TypeOf(service{}), all)
	ui.RegisterGet("/worklogs/tasks/{task_id}", enum.AnyUser, reflect.TypeOf(service{}), getByTask)
	ui.RegisterPatch("/worklogs/{log_id}/update", enum.AnyUser, reflect.TypeOf(service{}), update)
	ui.RegisterDelete("/worklogs/{log_id}/delete", enum.AnyUser, reflect.TypeOf(service{}), deleteLog)
}

// add
//
//	@Tags		worklogs
//	@Summary	Add worklog
//	@Description	Creates a new time log entry for a task
//	@Accept		json
//	@Produce	json
//	@Param		payload	body	worklog.CreateLogInput	true	"Worklog data"
//	@Success	200
//	@Failure	400	{object}	string	"Bad Request"
//	@Failure	500	{object}	string	"Internal Server Error"
//	@Router		/api/worklogs/add [post]
func add(s ui.UIService) (any, error) {
	var input worklog.CreateLogInput

	if err := s.GetBodyAs(&input); err != nil {
		return nil, err
	}

	return s.GetService().(*service).add(s.GetRequest().Context(), input)
}

// all
//
//	@Tags		worklogs
//	@Summary	Get all worklogs for a user
//	@Description	Returns a filtered list of worklogs for a specific user
//	@Produce	json
//	@Param		user_id	path		string	true	"User UUID"
//	@Success	200	{object}	[]worklog.Row
//	@Failure	400	{object}	string	"Bad Request"
//	@Failure	500	{object}	string	"Internal Server Error"
//	@Router		/api/worklogs/{user_id}/all [get]
func all(s ui.UIService) (any, error) {
	userId, err := s.GetPathParameterAsString("user_id")
	if err != nil {
		return nil, err
	}

	f, err := parseFilterParams(s)
	if err != nil {
		return nil, err
	}

	return s.GetService().(*service).getAll(s.GetRequest().Context(), uuid.MustParse(userId), f)
}

// update
//
//	@Tags		worklogs
//	@Summary	Update worklog
//	@Description	Updates an existing worklog entry
//	@Accept		json
//	@Produce	json
//	@Param		log_id	path	string					true	"Worklog UUID"
//	@Param		payload	body	worklog.UpdateLogInput	true	"Fields to update"
//	@Success	200
//	@Failure	400	{object}	string	"Bad Request"
//	@Failure	500	{object}	string	"Internal Server Error"
//	@Router		/api/worklogs/{log_id}/update [patch]
func update(s ui.UIService) (any, error) {
	id, err := s.GetPathParameterAsString("log_id")
	if err != nil {
		return nil, err
	}

	var input worklog.UpdateLogInput

	if err := s.GetBodyAs(&input); err != nil {
		return nil, err
	}

	return nil, s.GetService().(*service).update(s.GetRequest().Context(), uuid.MustParse(id), input)
}

// deleteLog
//
//	@Tags		worklogs
//	@Summary	Delete worklog
//	@Description	Deletes a worklog entry by its UUID
//	@Produce	json
//	@Param		log_id	path	string	true	"Worklog UUID"
//	@Success	200
//	@Failure	400	{object}	string	"Bad Request"
//	@Failure	500	{object}	string	"Internal Server Error"
//	@Router		/api/worklogs/{log_id}/delete [delete]
func deleteLog(s ui.UIService) (any, error) {
	id, err := s.GetPathParameterAsString("log_id")
	if err != nil {
		return nil, err
	}

	return nil, s.GetService().(*service).deleteBy(s.GetRequest().Context(), uuid.MustParse(id))
}

// getByTask
//
//	@Tags		worklogs
//	@Summary	Get worklogs by task
//	@Description	Returns all worklogs associated with a specific task
//	@Produce	json
//	@Param		task_id	path		string	true	"Task UUID"
//	@Success	200	{object}	[]worklog.TaskRow
//	@Failure	400	{object}	string	"Bad Request"
//	@Failure	500	{object}	string	"Internal Server Error"
//	@Router		/api/worklogs/tasks/{task_id} [get]
func getByTask(s ui.UIService) (any, error) {
	taskId, err := s.GetPathParameterAsString("task_id")
	if err != nil {
		return nil, err
	}
	return s.GetService().(*service).getByTask(s.GetRequest().Context(), uuid.MustParse(taskId))
}

// getLeaderboard
//
//	@Tags		worklogs
//	@Summary	Get worklog leaderboard
//	@Description	Returns users ranked by total logged minutes
//	@Produce	json
//	@Success	200	{object}	[]worklog.LeaderboardEntry
//	@Failure	500	{object}	string	"Internal Server Error"
//	@Router		/api/worklogs/leaderboard [get]
func getLeaderboard(s ui.UIService) (any, error) {
	return s.GetService().(*service).getLeaderboard(s.GetRequest().Context())
}

// recalculateLeaderboard
//
//	@Tags		worklogs
//	@Summary	Recalculate worklog leaderboard
//	@Description	Triggers a recalculation of the leaderboard rankings (admin only)
//	@Produce	json
//	@Success	200
//	@Failure	401	{object}	string	"Unauthorized"
//	@Failure	500	{object}	string	"Internal Server Error"
//	@Router		/api/worklogs/leaderboard/recalculate [post]
func recalculateLeaderboard(s ui.UIService) (any, error) {
	return nil, s.GetService().(*service).recalculateLeaderboard(s.GetRequest().Context())
}

func parseFilterParams(s ui.UIService) (*worklog.Filters, error) {
	var f ui.FilterService[worklog.InputFilters, worklog.Filters]

	return f.GetResolvedFilters(s, (*worklog.InputFilters).ResolveFilters)
}
