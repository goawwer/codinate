package enum

type ReleaseStatus string

const (
	ReleaseStatusActive   ReleaseStatus = "active"
	ReleaseStatusFinished ReleaseStatus = "finished"
	ReleaseStatusArchived ReleaseStatus = "archived"
	ReleaseStatusClosed   ReleaseStatus = "closed"
)
