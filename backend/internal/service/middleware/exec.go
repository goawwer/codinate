package middleware

import (
	"context"
	"crypto/hmac"
	"fmt"
	"net/http"
	"time"

	models "github.com/goawwer/codinate/internal/adapter/model"
	"github.com/goawwer/codinate/internal/adapter/repository"
	"github.com/goawwer/codinate/pkg/logger"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

func storeRefreshToken(ctx context.Context, oldInput RefreshParams, newTokenID uuid.UUID, newHash string, expAt time.Time) error {
	if oldInput.TokenID == uuid.Nil {
		return repository.GetAuthRepo().CreateRefreshToken(ctx, models.Refresh{
			ID:               newTokenID,
			UserID:           oldInput.UserID,
			Hash:             newHash,
			SessionExpiresAt: time.Now().Add(auth.sessionExpiresDuration),
			ExpiresAt:        expAt,
		})

	}

	existedSessionExpiresAt, err := repository.GetAuthRepo().ConsumeRefreshToken(ctx, models.Refresh{
		ID:     oldInput.TokenID,
		Hash:   oldInput.OldHash,
		UserID: oldInput.UserID,
	})
	if err != nil {
		logger.Errorf("failed to consume refresh token: %v", err)
		return err
	}

	return repository.GetAuthRepo().CreateRefreshToken(ctx, models.Refresh{
		ID:               newTokenID,
		UserID:           oldInput.UserID,
		Hash:             newHash,
		SessionExpiresAt: existedSessionExpiresAt,
		ExpiresAt:        calcRefreshExpiry(auth.refreshTokeExpiresDuration, existedSessionExpiresAt),
	})
}

func calcRefreshExpiry(refreshTTL time.Duration, sessionExpiresAt time.Time) time.Time {
	exp := time.Now().Add(refreshTTL)
	if exp.After(sessionExpiresAt) {
		return sessionExpiresAt
	}

	return exp
}

func generateRefreshTokenHash(secret, token []byte) []byte {
	mac := hmac.New(auth.signMethod.Hash.New, secret)
	mac.Write(token)
	return mac.Sum(nil)
}

func generateAccessSignedToken(userID uuid.UUID, role string) (string, time.Time, error) {
	accessExp := time.Now().Add(auth.accessTokenExpiresDuration)

	claims := CustomClaims{
		UserID:    userID.String(),
		Role:      role,
		TokenType: "access",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(accessExp),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
		},
	}

	accessToken := jwt.NewWithClaims(auth.signMethod, claims)
	signedToken, err := accessToken.SignedString(auth.secretKey)
	if err != nil {
		logger.Errorf("failed to sign access token: %v", err)
		return "", time.Time{}, err
	}

	return signedToken, accessExp, nil
}

func generateRefreshToken(input RefreshParams) (uuid.UUID, string, time.Time, error) {
	refreshExp := time.Now().Add(auth.refreshTokeExpiresDuration)

	claims := CustomClaims{
		UserID:    input.UserID.String(),
		TokenID:   uuid.NewString(),
		Role:      input.Role,
		TokenType: "refresh",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(refreshExp),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
		},
	}

	refreshToken := jwt.NewWithClaims(auth.signMethod, claims)
	signedToken, err := refreshToken.SignedString(auth.secretKey)
	if err != nil {
		logger.Errorf("failed to sign refresh token: %v", err)
		return uuid.Nil, "", time.Time{}, err
	}

	return uuid.MustParse(claims.TokenID), signedToken, refreshExp, nil
}

func resolveSignMethod(alg string) *jwt.SigningMethodHMAC {
	switch alg {
	case "HS256":
		return jwt.SigningMethodHS256
	case "HS384":
		return jwt.SigningMethodHS384
	case "HS512":
		return jwt.SigningMethodHS512
	}

	return nil
}

func resolveAuthDurations(cfg *config) (accessDuration, refreshDuration, sessionDuration time.Duration, err error) {
	accessDuration, err = time.ParseDuration(cfg.AccessTokenExpiresDuration)
	if err != nil {
		return 0, 0, 0, fmt.Errorf("failed to parse access token duration: %v", err)
	}

	refreshDuration, err = time.ParseDuration(cfg.RefreshTokeExpiresDuration)
	if err != nil {
		return 0, 0, 0, fmt.Errorf("failed to parse refresh token duration: %v", err)
	}

	sessionDuration, err = time.ParseDuration(cfg.SessionExpiresDuration)
	if err != nil {
		return 0, 0, 0, fmt.Errorf("failed to parse session duration: %v", err)
	}

	return accessDuration, refreshDuration, sessionDuration, nil
}

func removeTokenBy(ctx context.Context, tokenID uuid.UUID) error {
	return repository.GetAuthRepo().RemoveTokenBy(ctx, tokenID)
}

func clearAuthCookies(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     "access",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
	})
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
	})
}
