package post

import (
	"github.com/goawwer/codinate/internal/adapter/dto/file"
	"github.com/goawwer/codinate/internal/adapter/model/enum"
)

type PostParent struct {
	ParentType enum.PostParentType `json:"postParentType"`
	ParentId   int                 `json:"parentId"`
}

type CreatePostInput struct {
	Id            string                   `json:"id"`
	AuthorId      string                   `json:"authorId"`
	Parents       []PostParent             `json:"parents"`
	PostType      enum.PostType            `json:"postType"`
	Title         string                   `json:"title"`
	Body          string                   `json:"body"`
	AttachedFiles []file.AttachedFileInput `json:"attachedFiles"`
}

type UpdatePostInput struct {
	Parents       *[]PostParent             `json:"parents"`
	PostType      *enum.PostType            `json:"postType"`
	Title         *string                   `json:"title"`
	Body          *string                   `json:"body"`
	AttachedFiles *[]file.AttachedFileInput `json:"attachedFiles"`
}
