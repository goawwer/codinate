package repository

import (
	"context"
	"crypto/hmac"
	"database/sql"
	"errors"
	"time"

	"github.com/goawwer/codinate/internal/adapter/database"
	"github.com/goawwer/codinate/internal/adapter/models"
	"github.com/goawwer/codinate/pkg/logger"
	"github.com/google/uuid"
)

type AuthRepository interface {
	CreateRefreshToken(ctx context.Context, token models.Refresh) error
	ConsumeRefreshToken(ctx context.Context, token models.Refresh) (time.Time, error)
	GetLoginInfoByUsername(ctx context.Context, name string) (uuid.UUID, string, string, error)
	CleanupExpiredRefreshTokens(ctx context.Context) error
}

type authRepoImpl struct {
	*database.CoreRepository
}

func GetAuthRepo() AuthRepository {
	r := database.GetCoreRepository()
	return &authRepoImpl{r}
}

func (r *authRepoImpl) CreateRefreshToken(ctx context.Context, token models.Refresh) error {
	_, err := r.QueryContext(ctx, `
		INSERT INTO refresh_tokens (id, user_id, hash, expires_at, session_expires_at)
		VALUES ($1, $2, $3, $4, $5)
	`, token.ID, token.UserID, token.Hash, token.ExpiresAt, token.SessionExpiresAt)

	return err
}

func (r *authRepoImpl) ConsumeRefreshToken(ctx context.Context, token models.Refresh) (time.Time, error) {
	var storedToken models.Refresh

	if err := r.QueryRowContext(ctx, `SELECT * FROM refresh_tokens WHERE id = $1 AND user_id = $2`, token.ID, token.UserID).StructScan(&storedToken); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			logger.Debugf("refresh token not found")
			return time.Time{}, errors.New("refresh token not found")
		}

		logger.Errorf("failed to select refresh token: %v", err)
		return time.Time{}, err
	}

	if !hmac.Equal([]byte(storedToken.Hash), []byte(token.Hash)) {
		logger.Debug("provided token hash not equal stored token hash.\nUserID might be stolen - delete stored value")

		_, delErr := r.QueryContext(ctx, `DELETE FROM refresh_tokens WHERE id = $1`, storedToken.ID)
		if delErr != nil {
			return time.Time{}, delErr
		}

		return time.Time{}, errors.New("invalid refresh token hash")
	}

	now := time.Now()

	if storedToken.ExpiresAt.Before(now) || storedToken.SessionExpiresAt.Before(now) {
		logger.Debugf("session expired")
		return time.Time{}, errors.New("session expired")
	}

	var existedSessionExpiresAt time.Time
	err := r.QueryRowContext(ctx, `
		DELETE FROM refresh_tokens WHERE id = $1 RETURNING session_expires_at
	`, storedToken.ID).Scan(&existedSessionExpiresAt)

	return existedSessionExpiresAt, err
}

func (r *authRepoImpl) GetLoginInfoByUsername(ctx context.Context, name string) (uuid.UUID, string, string, error) {
	var userID uuid.UUID
	var password, role string

	err := r.QueryRowContext(ctx, `
		SELECT id, role, hashed_password FROM users WHERE username = $1
	`, name).Scan(&userID, &password, &role)

	return userID, password, role, err
}

func (r *authRepoImpl) CleanupExpiredRefreshTokens(ctx context.Context) error {
	_, err := r.QueryContext(ctx, `
		DELETE FROM refresh_tokens rt
		WHERE rt.session_expires_at < NOW() OR
		rt.id IN (
			select id
				FROM (
    				SELECT
     					rt.id,
         				rt.user_id,
            			ROW_NUMBER() OVER (PARTITION BY rt.user_id ORDER BY rt.expires_at DESC) AS rn
              		FROM refresh_tokens rt
                ) t
            WHERE rn > 1
        )
	`)

	return err
}
