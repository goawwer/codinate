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

func add(s ui.UIService) (any, error) {
	var input worklog.CreateLogInput

	if err := s.GetBodyAs(&input); err != nil {
		return nil, err
	}

	return s.GetService().(*service).add(s.GetRequest().Context(), input)
}

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

func deleteLog(s ui.UIService) (any, error) {
	id, err := s.GetPathParameterAsString("log_id")
	if err != nil {
		return nil, err
	}

	return nil, s.GetService().(*service).deleteBy(s.GetRequest().Context(), uuid.MustParse(id))
}

func getByTask(s ui.UIService) (any, error) {
	taskId, err := s.GetPathParameterAsString("task_id")
	if err != nil {
		return nil, err
	}
	return s.GetService().(*service).getByTask(s.GetRequest().Context(), uuid.MustParse(taskId))
}

func getLeaderboard(s ui.UIService) (any, error) {
	return s.GetService().(*service).getLeaderboard(s.GetRequest().Context())
}

func recalculateLeaderboard(s ui.UIService) (any, error) {
	return nil, s.GetService().(*service).recalculateLeaderboard(s.GetRequest().Context())
}

func parseFilterParams(s ui.UIService) (*worklog.Filters, error) {
	var f ui.FilterService[worklog.InputFilters, worklog.Filters]

	return f.GetResolvedFilters(s, (*worklog.InputFilters).ResolveFilters)
}
