package comment

import (
	"context"
	"errors"
	"slices"

	"github.com/goawwer/codinate/internal/adapter/dto"
	"github.com/goawwer/codinate/internal/adapter/dto/comment"
	"github.com/goawwer/codinate/internal/adapter/model"
	"github.com/goawwer/codinate/internal/adapter/model/enum"
	"github.com/goawwer/codinate/internal/adapter/repository"
	"github.com/goawwer/codinate/pkg/util"
	"github.com/google/uuid"
)

type service struct{}

func (s *service) getAll(ctx context.Context, entityId uuid.UUID) ([]comment.Row, error) {
	return repository.GetCommentRepo().GetAllBy(ctx, entityId)
}

func (s *service) addComment(ctx context.Context, input comment.CreateCommentInput, userId uuid.UUID) (uuid.UUID, error) {
	attachedFileIds, err := util.ParseAttachedFileIds(input.AttachedFiles)
	if err != nil {
		return uuid.Nil, err
	}

	return repository.GetCommentRepo().Create(ctx, model.Comment{
		EntityType:       dto.ResolveCommentEntityType(input.EntityType),
		EntityId:         uuid.MustParse(input.EntityId),
		UserId:           userId,
		Body:             input.Body,
		AttachedFilesIds: attachedFileIds,
	})
}

func (s *service) updateCommentBy(
	ctx context.Context,
	input comment.UpdateCommentInput,
	userRole enum.PermissionRole,
	authorId, commentId uuid.UUID) error {
	isAuthor, err := repository.GetCommentRepo().IsAuthor(ctx, authorId, commentId)
	if err != nil {
		return err
	}

	if !isAuthor || !slices.Contains(enum.AtLeastAdmin, userRole) {
		return errors.New("failed to update comment you are not the author and you don't have permissions")
	}

	attachedFileIds, err := util.ParseAttachedFileIds(input.AttachedFiles)
	if err != nil {
		return err
	}

	return repository.GetCommentRepo().Update(ctx, model.Comment{
		Id:               commentId,
		Body:             input.Body,
		AttachedFilesIds: attachedFileIds,
	})
}

func (s *service) deleteBy(ctx context.Context, userRole enum.PermissionRole, authorId, commentId uuid.UUID) error {
	isAuthor, err := repository.GetCommentRepo().IsAuthor(ctx, authorId, commentId)
	if err != nil {
		return err
	}

	if !isAuthor || !slices.Contains(enum.AtLeastAdmin, userRole) {
		return errors.New("failed to delete comment you are not the author and you don't have permissions")
	}

	return repository.GetCommentRepo().Delete(ctx, commentId)
}
