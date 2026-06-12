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

// getAll
//
//	@Tags		posts
//	@Summary	Get all posts
//	@Description	Returns a filtered list of posts
//	@Produce	json
//	@Success	200	{object}	[]post.Row
//	@Failure	500	{object}	string	"Internal Server Error"
//	@Router		/api/posts [get]
func getAll(s ui.UIService) (any, error) {
	u, err := s.GetCurrentUser()
	if err != nil {
		return nil, err
	}

	f, err := parseFilterParams(s)
	if err != nil {
		return nil, err
	}
	f.MemberUserId = &u.Id

	return s.GetService().(*service).getPosts(s.GetRequest().Context(), f)
}

// getPost
//
//	@Tags		posts
//	@Summary	Get post by ID
//	@Description	Returns a single post by its UUID
//	@Produce	json
//	@Param		id	path		string	true	"Post UUID"
//	@Success	200	{object}	post.Row
//	@Failure	400	{object}	string	"Bad Request"
//	@Failure	500	{object}	string	"Internal Server Error"
//	@Router		/api/posts/{id} [get]
func getPost(s ui.UIService) (any, error) {
	id, err := s.GetPathParameterAsString("id")
	if err != nil {
		return nil, err
	}

	return s.GetService().(*service).getPost(s.GetRequest().Context(), uuid.MustParse(id))
}

// add
//
//	@Tags		posts
//	@Summary	Create post
//	@Description	Creates a new post for the current user
//	@Accept		json
//	@Produce	json
//	@Param		payload	body	post.CreatePostInput	true	"Post data"
//	@Success	200
//	@Failure	400	{object}	string	"Bad Request"
//	@Failure	500	{object}	string	"Internal Server Error"
//	@Router		/api/posts/create [post]
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

// updatePost
//
//	@Tags		posts
//	@Summary	Update post
//	@Description	Updates fields of an existing post, only allowed for the post author or admins
//	@Accept		json
//	@Produce	json
//	@Param		id		path	string				true	"Post UUID"
//	@Param		payload	body	post.UpdatePostInput	true	"Fields to update"
//	@Success	200
//	@Failure	400	{object}	string	"Bad Request"
//	@Failure	403	{object}	string	"Forbidden"
//	@Failure	500	{object}	string	"Internal Server Error"
//	@Router		/api/posts/{id}/update [patch]
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

// deletePost
//
//	@Tags		posts
//	@Summary	Delete post
//	@Description	Deletes a post by ID, only allowed for the post author or admins
//	@Produce	json
//	@Param		id	path	string	true	"Post UUID"
//	@Success	200
//	@Failure	400	{object}	string	"Bad Request"
//	@Failure	403	{object}	string	"Forbidden"
//	@Failure	500	{object}	string	"Internal Server Error"
//	@Router		/api/posts/{id}/delete [delete]
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
