package comment

import (
	"reflect"

	"github.com/goawwer/codinate/internal/adapter/dto/comment"
	"github.com/goawwer/codinate/internal/adapter/model/enum"
	"github.com/goawwer/codinate/internal/controller/ui"
	"github.com/google/uuid"
)

func Register() {
	ui.RegisterGet("/comments/{entity}/{entity_id}", enum.AnyUser, reflect.TypeOf(service{}), all)
	ui.RegisterPost("/comments/add", enum.AnyUser, reflect.TypeOf(service{}), add)
	ui.RegisterPatch("/comments/{id}/update", enum.AnyUser, reflect.TypeOf(service{}), update)
	ui.RegisterDelete("/comments/{id}/delete", enum.AnyUser, reflect.TypeOf(service{}), delete)
}

// all
//
//	@Tags		comments
//	@Summary	Get comments for an entity
//	@Description	Returns all comments for a given entity (e.g. task) by its UUID
//	@Produce	json
//	@Param		entity		path		string			true	"Entity type (e.g. task)"
//	@Param		entity_id	path		string			true	"Entity UUID"
//	@Success	200	{object}	[]comment.Row
//	@Failure	400	{object}	string	"Bad Request"
//	@Failure	500	{object}	string	"Internal Server Error"
//	@Router		/api/comments/{entity}/{entity_id} [get]
func all(s ui.UIService) (any, error) {
	entityId, err := s.GetPathParameterAsString("entity_id")
	if err != nil {
		return nil, err
	}

	return s.GetService().(*service).getAll(s.GetRequest().Context(), uuid.MustParse(entityId))
}

// add
//
//	@Tags		comments
//	@Summary	Add a comment
//	@Description	Creates a new comment on an entity; author is taken from the authenticated user
//	@Accept		json
//	@Produce	json
//	@Param		payload	body		comment.CreateCommentInput	true	"Comment data"
//	@Success	200	{object}	comment.Row
//	@Failure	400	{object}	string	"Bad Request"
//	@Failure	500	{object}	string	"Internal Server Error"
//	@Router		/api/comments/add [post]
func add(s ui.UIService) (any, error) {
	user, err := s.GetCurrentUser()
	if err != nil {
		return nil, err
	}

	var input comment.CreateCommentInput

	if err := s.GetBodyAs(&input); err != nil {
		return nil, err
	}

	return s.GetService().(*service).addComment(s.GetRequest().Context(), input, user.Id)
}

// update
//
//	@Tags		comments
//	@Summary	Update a comment
//	@Description	Updates the body or attachments of a comment; only the author or an admin can update
//	@Accept		json
//	@Produce	json
//	@Param		id		path		string						true	"Comment UUID"
//	@Param		payload	body		comment.UpdateCommentInput	true	"Updated comment data"
//	@Success	200
//	@Failure	400	{object}	string	"Bad Request"
//	@Failure	403	{object}	string	"Forbidden"
//	@Failure	500	{object}	string	"Internal Server Error"
//	@Router		/api/comments/{id}/update [patch]
func update(s ui.UIService) (any, error) {
	user, err := s.GetCurrentUser()
	if err != nil {
		return nil, err
	}

	var input comment.UpdateCommentInput

	commentId, err := s.GetPathParameterAsString("id")
	if err != nil {
		return nil, err
	}

	if err := s.GetBodyAs(&input); err != nil {
		return nil, err
	}

	return nil, s.GetService().(*service).updateCommentBy(
		s.GetRequest().Context(),
		input,
		user.Permission,
		user.Id,
		uuid.MustParse(commentId),
	)
}

// delete
//
//	@Tags		comments
//	@Summary	Delete a comment
//	@Description	Deletes a comment by UUID; only the author or an admin can delete
//	@Produce	json
//	@Param		id	path	string	true	"Comment UUID"
//	@Success	200
//	@Failure	400	{object}	string	"Bad Request"
//	@Failure	403	{object}	string	"Forbidden"
//	@Failure	500	{object}	string	"Internal Server Error"
//	@Router		/api/comments/{id}/delete [delete]
func delete(s ui.UIService) (any, error) {
	user, err := s.GetCurrentUser()
	if err != nil {
		return nil, err
	}

	commentId, err := s.GetPathParameterAsString("id")
	if err != nil {
		return nil, err
	}

	return nil, s.GetService().(*service).deleteBy(
		s.GetRequest().Context(),
		user.Permission,
		user.Id,
		uuid.MustParse(commentId),
	)
}
