package model

import (
	"time"

	"github.com/goawwer/codinate/internal/adapter/model/enum"
	"github.com/google/uuid"
)

type Comment struct {
	Id               uuid.UUID              `db:"id" json:"id"`
	EntityType       enum.CommentEntityType `db:"entity_type" json:"entityType"`
	EntityId         uuid.UUID              `db:"entity_id" json:"entityId"`
	UserId           uuid.UUID              `db:"user_id" json:"userId"`
	Body             string                 `db:"body" json:"body"`
	AttachedFilesIds    []uuid.UUID `db:"attached_files_ids" json:"attachedFilesIds"`
	NewAttachedFilesIds []uuid.UUID `db:"-" json:"-"`
	CreatedAt        time.Time              `db:"created_at" json:"createdAt"`
	UpdatedAt        time.Time              `db:"updated_at" json:"updatedAt"`
	DeletedAt        time.Time              `db:"deleted_at" json:"deletedAt"`
}
