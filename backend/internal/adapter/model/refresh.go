package model

import (
	"time"

	"github.com/google/uuid"
)

type Refresh struct {
	ID               uuid.UUID `db:"id"`
	UserID           uuid.UUID `db:"user_id"`
	Hash             string    `db:"hash"`
	CreatedAt        time.Time `db:"created_at"`
	ExpiresAt        time.Time `db:"expires_at"`
	SessionExpiresAt time.Time `db:"session_expires_at"`
}
