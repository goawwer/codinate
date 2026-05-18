package repository

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/goawwer/codinate/internal/adapter/database"
	"github.com/goawwer/codinate/internal/adapter/dto/post"
	"github.com/goawwer/codinate/internal/adapter/model"
	"github.com/goawwer/codinate/pkg/logger"
	"github.com/goawwer/codinate/pkg/util"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
)

type PostRepo interface {
	GetAllPosts(ctx context.Context, f *post.Filters) ([]post.Row, error)
	GetPostBy(ctx context.Context, id uuid.UUID) (post.Row, error)
	CreatePost(ctx context.Context, input model.Post) (uuid.UUID, error)
	GetPostAuthorId(ctx context.Context, postId uuid.UUID) (uuid.UUID, error)
	UpdatePostBy(ctx context.Context, postId uuid.UUID, input post.UpdatePostInput) error
	DeletePostBy(ctx context.Context, id uuid.UUID) error
}

type postRepoImpl struct {
	*database.CoreRepository
}

func GetPostRepo() PostRepo {
	return &postRepoImpl{database.GetCoreRepository()}
}

func (r *postRepoImpl) GetAllPosts(ctx context.Context, f *post.Filters) ([]post.Row, error) {
	var qb QueryFiltersBuilder
	res := make([]post.Row, 0)

	parentJoin := ""
	if f.ParentType != "" && f.ParentId != 0 {
		parentJoin = fmt.Sprintf(
			"JOIN post_parents pp ON pp.post_id = p.id AND pp.parent_type = '%s' AND pp.parent_id = %d",
			f.ParentType, f.ParentId,
		)
	}

	err := r.SelectContext(ctx, &res, `
		SELECT
			p.id,
			u.name       AS author_name,
			u.surname    AS author_surname,
			u.avatar     AS author_picture,
			u.username   AS author_username,
			p.title,
			p.body,
			COALESCE(
				(SELECT json_agg(json_build_object('id', f.id, 'name', f.name))
				 FROM files f
				 WHERE f.id = ANY(p.attached_files_ids)),
				'[]'::json
			) AS attached_files,
			p.created_at,
			p.updated_at
		FROM posts p
		LEFT JOIN users u ON p.author_id = u.id
		`+parentJoin+`
		`+qb.
		FilterWithOperator("p.created_at::TIMESTAMP", f.DateRange.From, ">=").
		FilterWithOperator("p.created_at::TIMESTAMP", f.DateRange.To, "<").
		Like("p.title", f.SearchBy.Value).
		Order("p.created_at", f.SortBy.Direction, "p.created_at", "DESC").
		Limit(f.Paging.GetOffset(), f.Paging.GetLimit()).
		Build(),
	)

	return res, err
}

func (r *postRepoImpl) GetPostBy(ctx context.Context, id uuid.UUID) (post.Row, error) {
	var res post.Row

	err := r.QueryRowContext(ctx, `
		SELECT
			p.id,
			u.name       AS author_name,
			u.surname    AS author_surname,
			u.avatar     AS author_picture,
			u.username   AS author_username,
			p.title,
			p.body,
			COALESCE(
				(SELECT json_agg(json_build_object('id', f.id, 'name', f.name))
				 FROM files f
				 WHERE f.id = ANY(p.attached_files_ids)),
				'[]'::json
			) AS attached_files,
			p.created_at,
			p.updated_at
		FROM posts p
		LEFT JOIN users u ON p.author_id = u.id
		WHERE p.id = $1
	`, id).StructScan(&res)

	return res, err
}

func (r *postRepoImpl) CreatePost(ctx context.Context, input model.Post) (uuid.UUID, error) {
	mentionIDs := util.ExtractMentionIDs(input.Body)

	var id uuid.UUID
	err := r.RunInTransaction(ctx, func(tx *sqlx.Tx) error {
		if err := tx.QueryRowxContext(ctx, `
			INSERT INTO posts (id, author_id, post_type, title, body, attached_files_ids)
			VALUES ($1, $2, $3, $4, $5, $6::uuid[])
			RETURNING id
		`,
			input.Id, input.AuthorId,
			input.PostType, input.Title, input.Body,
			pq.Array(input.AttachedFilesIds),
		).Scan(&id); err != nil {
			return err
		}

		for _, parent := range input.Parents {
			if _, err := tx.ExecContext(ctx, `
				INSERT INTO post_parents (post_id, parent_type, parent_id)
				VALUES ($1, $2, $3)
			`, id, parent.ParentType, parent.ParentId); err != nil {
				return err
			}
		}

		for _, mentionedID := range mentionIDs {
			if _, err := tx.ExecContext(ctx, `
				INSERT INTO mentions (entity_type, entity_id, mentioned_user_id)
				VALUES ('post', $1, $2)
				ON CONFLICT DO NOTHING
			`, id, mentionedID); err != nil {
				return err
			}
		}
		return nil
	})

	if err == nil {
		go notifyPostCreated(input, id, mentionIDs)
	}

	return id, err
}

func notifyPostCreated(input model.Post, postId uuid.UUID, mentionIDs []uuid.UUID) {
	ctx := context.Background()
	notifRepo := GetNotificationRepo()

	postRelated, _ := json.Marshal(map[string]any{
		"postId":    postId.String(),
		"postTitle": input.Title,
	})

	for _, parent := range input.Parents {
		memberIDs, err := notifRepo.GetMembersForParent(ctx, string(parent.ParentType), int(parent.ParentId), input.AuthorId)
		if err != nil {
			logger.Errorf("notifyPostCreated: get members for %s %d: %v", parent.ParentType, parent.ParentId, err)
			continue
		}

		related, _ := json.Marshal(map[string]any{
			"postId":     postId.String(),
			"postTitle":  input.Title,
			"parentType": string(parent.ParentType),
			"parentId":   parent.ParentId,
		})

		for _, memberId := range memberIDs {
			n := model.Notification{
				Id:               uuid.New(),
				UserId:           memberId,
				ActorId:          input.AuthorId,
				NotificationType: "post",
				Related:          related,
				Title:            "New post published",
				Body:             fmt.Sprintf(`"%s"`, input.Title),
			}
			if err := notifRepo.Create(ctx, n); err != nil {
				logger.Errorf("notifyPostCreated: create post notification: %v", err)
			}
		}
	}

	for _, mentionedId := range mentionIDs {
		if mentionedId == input.AuthorId {
			continue
		}
		n := model.Notification{
			Id:               uuid.New(),
			UserId:           mentionedId,
			ActorId:          input.AuthorId,
			NotificationType: "mention",
			Related:          postRelated,
			Title:            "You were mentioned",
			Body:             fmt.Sprintf(`in post "%s"`, input.Title),
		}
		if err := notifRepo.Create(ctx, n); err != nil {
			logger.Errorf("notifyPostCreated: create mention notification: %v", err)
		}
	}
}

func (r *postRepoImpl) GetPostAuthorId(ctx context.Context, postId uuid.UUID) (uuid.UUID, error) {
	var authorId uuid.UUID

	err := r.QueryRowContext(ctx, "SELECT author_id FROM posts WHERE id = $1", postId).Scan(&authorId)

	return authorId, err
}

func (r *postRepoImpl) UpdatePostBy(ctx context.Context, postId uuid.UUID, input post.UpdatePostInput) error {
	return r.RunInTransaction(ctx, func(tx *sqlx.Tx) error {
		colsMap := util.GetDBColumnsFiltersValuesMap(nil, model.Post{}, &input)

		if input.AttachedFiles != nil {
			fileIds, err := util.ParseAttachedFileIds(*input.AttachedFiles)
			if err != nil {
				return err
			}
			colsMap["attached_files_ids"] = pq.Array(fileIds)
		}

		if len(colsMap) > 0 {
			var qb QueryFiltersBuilder
			clause := qb.Update(colsMap).Eq("id::uuid", postId).Build()
			if _, err := tx.ExecContext(ctx, "UPDATE posts "+clause, qb.Args()...); err != nil {
				return err
			}
		}

		if input.Body != nil {
			mentionIDs := util.ExtractMentionIDs(*input.Body)
			if _, err := tx.ExecContext(ctx, "DELETE FROM mentions WHERE entity_type = 'post' AND entity_id = $1", postId); err != nil {
				return err
			}
			for _, mentionedID := range mentionIDs {
				if _, err := tx.ExecContext(ctx, `
					INSERT INTO mentions (entity_type, entity_id, mentioned_user_id)
					VALUES ('post', $1, $2)
					ON CONFLICT DO NOTHING
				`, postId, mentionedID); err != nil {
					return err
				}
			}
		}

		if input.Parents != nil {
			if _, err := tx.ExecContext(ctx, "DELETE FROM post_parents WHERE post_id = $1", postId); err != nil {
				return err
			}
			for _, parent := range *input.Parents {
				if _, err := tx.ExecContext(ctx, `
					INSERT INTO post_parents (post_id, parent_type, parent_id)
					VALUES ($1, $2, $3)
				`, postId, parent.ParentType, parent.ParentId); err != nil {
					return err
				}
			}
		}

		return nil
	})
}

func (r *postRepoImpl) DeletePostBy(ctx context.Context, id uuid.UUID) error {

	err := r.RunInTransaction(ctx, func(tx *sqlx.Tx) error {
		if _, err := tx.ExecContext(ctx, `
   			DELETE FROM post_parents
      		WHERE post_id = $1
		`, id); err != nil {
			return err
		}

		_, err := tx.ExecContext(ctx, `
			DELETE FROM posts
			WHERE id = $1
		`, id)

		return err
	})

	return err
}
