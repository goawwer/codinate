package auth

import (
	"context"
	"database/sql"
	"errors"

	"github.com/goawwer/codinate/internal/adapter/repository"
	"github.com/goawwer/codinate/pkg/logger"
	"github.com/goawwer/codinate/pkg/util"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type InvalidCredentialsError struct{}

func (InvalidCredentialsError) Error() string {
	return "invalid credentials"
}

func getUserAtLogin(ctx context.Context, input loginInput) (uuid.UUID, string, error) {
	if util.IsAnyStringEmpty(input.Password, input.Username) {
		return uuid.Nil, "", InvalidCredentialsError{}
	}

	userID, role, storedPassword, err := repository.GetAuthRepo().GetLoginInfoByUsername(ctx, input.Username)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return uuid.Nil, "", InvalidCredentialsError{}
		}

		logger.Errorf("failed to get login info from repo: %v", err)
		return uuid.Nil, "", err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(storedPassword), []byte(input.Password)); err != nil {
		logger.Errorf("failed to compare stored: %s, and input: %s passwords - %v", storedPassword, input.Password, err)
		return uuid.Nil, "", err
	}

	return userID, role, nil
}
