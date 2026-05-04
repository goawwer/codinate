package worklog

import (
	"reflect"

	"github.com/goawwer/codinate/internal/adapter/dto/worklog"
	"github.com/goawwer/codinate/internal/adapter/model/enum"
	"github.com/goawwer/codinate/internal/controller/ui"
	"github.com/google/uuid"
)

func Register() {
	ui.RegisterGet("/worklogs/{user_id}/all", enum.AnyUser, reflect.TypeOf(service{}), all)
	ui.RegisterPost("/worklogs/{user_id}/add", enum.AnyUser, reflect.TypeOf(service{}), add)
}

func add(s ui.UIService) (any, error) {
	userId, err := s.GetPathParameterAsString("user_id")
	if err != nil {
		return nil, err
	}

	var input worklog.CreateLogInput
	if err := s.GetBodyAs(&input); err != nil {
		return nil, err
	}

	return s.GetService().(*service).add(s.GetRequest().Context(), uuid.MustParse(userId), input)
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

func parseFilterParams(s ui.UIService) (*worklog.Filters, error) {
	var f ui.FilterService[worklog.InputFilters, worklog.Filters]

	return f.GetResolvedFilters(s, (*worklog.InputFilters).ResolveFilters)
}
