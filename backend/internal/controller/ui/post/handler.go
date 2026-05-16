package post

import (
	"reflect"

	"github.com/goawwer/codinate/internal/adapter/dto/post"
	"github.com/goawwer/codinate/internal/adapter/model/enum"
	"github.com/goawwer/codinate/internal/controller/ui"
	"github.com/google/uuid"
)

func Register() {
	ui.RegisterGet("/posts", enum.AnyUser, reflect.TypeOf(service{}), getAll)
	ui.RegisterGet("/posts/{id}", enum.AnyUser, reflect.TypeOf(service{}), getPost)
	ui.RegisterPost("/posts/create", enum.AnyUser, reflect.TypeOf(service{}), add)
	ui.RegisterPatch("/posts/{id}/update", enum.AnyUser, reflect.TypeOf(service{}), updatePost)
	ui.RegisterDelete("/posts/{id}/delete", enum.AnyUser, reflect.TypeOf(service{}), deletePost)
}

func getAll(s ui.UIService) (any, error) {
	f, err := parseFilterParams(s)
	if err != nil {
		return nil, err
	}

	return s.GetService().(*service).getPosts(s.GetRequest().Context(), f)
}

func getPost(s ui.UIService) (any, error) {
	id, err := s.GetPathParameterAsString("id")
	if err != nil {
		return nil, err
	}

	return s.GetService().(*service).getPost(s.GetRequest().Context(), uuid.MustParse(id))
}

func add(s ui.UIService) (any, error) {
	user, err := s.GetCurrentUser()
	if err != nil {
		return nil, err
	}

	var input post.CreatePostInput

	if err := s.GetBodyAs(&input); err != nil {
		return nil, err
	}

	return s.GetService().(*service).addPost(s.GetRequest().Context(), input, user.Id)
}

func updatePost(s ui.UIService) (any, error) {
	u, err := s.GetCurrentUser()
	if err != nil {
		return nil, err
	}

	postId, err := s.GetPathParameterAsString("id")
	if err != nil {
		return nil, err
	}

	var input post.UpdatePostInput
	if err := s.GetBodyAs(&input); err != nil {
		return nil, err
	}

	return nil, s.GetService().(*service).updatePostBy(
		s.GetRequest().Context(), uuid.MustParse(postId), u.Id, u.Permission, input,
	)
}

func deletePost(s ui.UIService) (any, error) {
	u, err := s.GetCurrentUser()
	if err != nil {
		return nil, err
	}

	postId, err := s.GetPathParameterAsString("id")
	if err != nil {
		return nil, err
	}

	return nil, s.GetService().(*service).deletePostBy(
		s.GetRequest().Context(), uuid.MustParse(postId), u.Id, u.Permission,
	)
}

func parseFilterParams(s ui.UIService) (*post.Filters, error) {
	var f ui.FilterService[post.InputFilters, post.Filters]

	return f.GetResolvedFilters(s, (*post.InputFilters).ResolveFilters)
}
