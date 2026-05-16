package repository

import (
	"context"

	"github.com/goawwer/codinate/internal/adapter/database"
	"github.com/goawwer/codinate/internal/adapter/dto/comment"
	"github.com/goawwer/codinate/internal/adapter/model"
	"github.com/goawwer/codinate/pkg/util"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
)

type CommentRepo interface {
	GetAllBy(ctx context.Context, entityId uuid.UUID) ([]comment.Row, error)
	Create(ctx context.Context, c model.Comment) (uuid.UUID, error)
	Update(ctx context.Context, newComment model.Comment) error
	IsAuthor(ctx context.Context, userId, commentId uuid.UUID) (bool, error)
	Delete(ctx context.Context, commentId uuid.UUID) error
}

type commentRepoImpl struct {
	*database.CoreRepository
}

func GetCommentRepo() CommentRepo {
	r := database.GetCoreRepository()
	return &commentRepoImpl{r}
}

func (r *commentRepoImpl) GetAllBy(ctx context.Context, entityId uuid.UUID) ([]comment.Row, error) {
	res := make([]comment.Row, 0)

	err := r.SelectContext(ctx, &res, `
		SELECT
			c.id,
			c.entity_type,
			c.entity_id,
			u.id as employee_id,
			u.name as employee_name,
			u.surname as employee_surname,
			u.username as employee_username,
			u.avatar as employee_profile_picture,
			c.body,
			COALESCE(
				(SELECT json_agg(json_build_object('id', f.id, 'name', f.name))
				 FROM files f
				 WHERE f.id = ANY(c.attached_files_ids)),
				'[]'::json
			) AS attached_files,
			COALESCE(
				(SELECT json_agg(json_build_object(
					'id',        th.id,
					'fieldName', th.field_name,
					'oldValue',  th.old_value,
					'newValue',  th.new_value
				) ORDER BY th.created_at ASC)
				 FROM task_history th
				 WHERE th.comment_id = c.id),
				'[]'::json
			) AS changes,
			c.created_at,
			c.updated_at
		FROM comments c
		LEFT JOIN users u ON c.user_id = u.id
		WHERE c.entity_id = $1
		ORDER BY c.created_at ASC
	`, entityId)

	return res, err
}

func (r *commentRepoImpl) Create(ctx context.Context, c model.Comment) (uuid.UUID, error) {
	mentionIDs := util.ExtractMentionIDs(c.Body)
	var id uuid.UUID

	err := r.RunInTransaction(ctx, func(tx *sqlx.Tx) error {
		if err := tx.QueryRowxContext(ctx, `
			INSERT INTO comments (
				id, entity_type, entity_id, user_id, body, attached_files_ids
			)
			VALUES (
				$1, $2, $3, $4, $5, $6::uuid[]
			)
			RETURNING id
		`, c.Id, c.EntityType, c.EntityId, c.UserId, c.Body, pq.Array(c.AttachedFilesIds)).Scan(&id); err != nil {
			return err
		}

		for _, mentionedID := range mentionIDs {
			if _, err := tx.ExecContext(ctx, `
				INSERT INTO mentions (entity_type, entity_id, mentioned_user_id)
				VALUES ('comment', $1, $2)
				ON CONFLICT DO NOTHING
			`, id, mentionedID); err != nil {
				return err
			}
		}
		return nil
	})

	return id, err
}

func (r *commentRepoImpl) IsAuthor(ctx context.Context, userId, commentId uuid.UUID) (bool, error) {
	var result bool
	err := r.QueryRowContext(ctx, `
		SELECT EXISTS(
			SELECT 1 FROM comments
			WHERE id = $1 AND user_id = $2
		)
	`, commentId, userId).Scan(&result)
	return result, err
}

func (r *commentRepoImpl) Update(ctx context.Context, newComment model.Comment) error {
	mentionIDs := util.ExtractMentionIDs(newComment.Body)
	strIds := make([]string, len(newComment.AttachedFilesIds))
	for i, id := range newComment.AttachedFilesIds {
		strIds[i] = id.String()
	}

	return r.RunInTransaction(ctx, func(tx *sqlx.Tx) error {
		if _, err := tx.ExecContext(ctx, `
			UPDATE comments
			SET body = $1, attached_files_ids = $2::text[]::uuid[], updated_at = now()
			WHERE id = $3
		`, newComment.Body, pq.Array(strIds), newComment.Id); err != nil {
			return err
		}

		if _, err := tx.ExecContext(ctx, "DELETE FROM mentions WHERE entity_type = 'comment' AND entity_id = $1", newComment.Id); err != nil {
			return err
		}
		for _, mentionedID := range mentionIDs {
			if _, err := tx.ExecContext(ctx, `
				INSERT INTO mentions (entity_type, entity_id, mentioned_user_id)
				VALUES ('comment', $1, $2)
				ON CONFLICT DO NOTHING
			`, newComment.Id, mentionedID); err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *commentRepoImpl) Delete(ctx context.Context, commentId uuid.UUID) error {
	_, err := r.ExecContext(ctx, `
		DELETE FROM comments
		WHERE id = $1
	`, commentId)

	return err
}
