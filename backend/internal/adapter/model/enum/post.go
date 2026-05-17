package enum

type PostType string

const (
	PostBasic        PostType = "basic"
	PostAnnouncement PostType = "announcement"
	PostPoll         PostType = "poll"
)

type PostParentType string

const (
	PostParentProject PostParentType = "project"
	PostParentTeam    PostParentType = "team"
)
