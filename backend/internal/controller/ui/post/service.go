package post

import (
	"context"
	"errors"
	"slices"

	"github.com/goawwer/codinate/internal/adapter/dto/post"
	"github.com/goawwer/codinate/internal/adapter/model"
	"github.com/goawwer/codinate/internal/adapter/model/enum"
	"github.com/goawwer/codinate/internal/adapter/repository"
	"github.com/goawwer/codinate/pkg/util"
	"github.com/google/uuid"
)

type service struct{}

func (s *service) getPosts(ctx context.Context, f *post.Filters) ([]post.Row, error) {
	return repository.GetPostRepo().GetAllPosts(ctx, f)
}

func (s *service) getPost(ctx context.Context, id uuid.UUID) (post.Row, error) {
	return repository.GetPostRepo().GetPostBy(ctx, id)
}

func (s *service) addPost(ctx context.Context, input post.CreatePostInput, authorId uuid.UUID) (uuid.UUID, error) {
	attachedFileIds, err := util.ParseAttachedFileIds(input.AttachedFiles)
	if err != nil {
		return uuid.Nil, err
	}

	parents := make([]model.PostParent, 0, len(input.Parents))
	for _, p := range input.Parents {
		parents = append(parents, model.PostParent{
			ParentType: p.ParentType,
			ParentId:   p.ParentId,
		})
	}

	return repository.GetPostRepo().CreatePost(ctx, model.Post{
		Id:               uuid.MustParse(input.Id),
		AuthorId:         authorId,
		Parents:          parents,
		PostType:         input.PostType,
		Title:            input.Title,
		Body:             input.Body,
		AttachedFilesIds: attachedFileIds,
	})
}

func (s *service) updatePostBy(ctx context.Context, postId, userId uuid.UUID, userRole enum.PermissionRole, input post.UpdatePostInput) error {
	postAuthorId, err := repository.GetPostRepo().GetPostAuthorId(ctx, postId)
	if err != nil {
		return err
	}

	if postAuthorId != userId && !slices.Contains(enum.AtLeastAdmin, userRole) {
		return errors.New("you don't have permission to update this post")
	}

	return repository.GetPostRepo().UpdatePostBy(ctx, postId, input)
}

func (s *service) deletePostBy(ctx context.Context, postId, userId uuid.UUID, userRole enum.PermissionRole) error {
	postAuthorId, err := repository.GetPostRepo().GetPostAuthorId(ctx, postId)
	if err != nil {
		return err
	}

	if postAuthorId != userId || !slices.Contains(enum.AtLeastAdmin, userRole) {
		return errors.New("you don't have permission to delete current task")
	}

	return repository.GetPostRepo().DeletePostBy(ctx, postId)
}
