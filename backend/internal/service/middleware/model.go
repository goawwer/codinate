package middleware

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type config struct {
	SecretKey                  string `mapstructure:"SECRET_KEY"`
	TokeSignMethod             string `mapstructure:"TOKEN_SIGN_METHOD"`
	AccessTokenExpiresDuration string `mapstructure:"MAX_ACCESS_TOKEN_DURATION"`
	RefreshTokeExpiresDuration string `mapstructure:"MAX_REFRESH_TOKEN_DURATION"`
	SessionExpiresDuration     string `mapstructure:"MAX_SESSION_DURATION"`
}

type contextKey string

const (
	claimsKey contextKey = "claims"
	RolesKey  contextKey = "roles"
)

var (
	allowedAlgs = map[string]struct{}{
		"HS256": {},
		"HS384": {},
		"HS512": {},
	}
	auth *tokenWrapper

	errTokenInvalid = errors.New("token invalid")
	errTokenExpired = errors.New("token expired")
)

type tokenWrapper struct {
	secretKey                  []byte
	signMethod                 *jwt.SigningMethodHMAC
	accessTokenExpiresDuration time.Duration
	refreshTokeExpiresDuration time.Duration
	sessionExpiresDuration     time.Duration
}

type TokenPair struct {
	AccessToken     string
	AccessTokenExp  time.Time
	RefreshToken    string
	RefreshTokenExp time.Time
}

type RefreshParams struct {
	UserID     uuid.UUID
	TokenID    uuid.UUID
	Permission string
	OldHash    string
}

type CustomClaims struct {
	UserID     string
	TokenID    string
	Permission string
	TokenType  string
	jwt.RegisteredClaims
}
