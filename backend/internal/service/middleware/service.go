package middleware

import (
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"net/http"
	"slices"
	"time"

	"github.com/goawwer/codinate/internal/adapter/dto"
	"github.com/goawwer/codinate/internal/adapter/model/enum"
	"github.com/goawwer/codinate/pkg/logger"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

func GenerateTokenPair(ctx context.Context, input RefreshParams) (*TokenPair, error) {
	accessToken, accessExp, err := generateAccessSignedToken(input.UserID, input.Permission)
	if err != nil {
		logger.ErrorWithFields(map[string]any{
			"token": accessToken,
			"exp":   accessExp,
			"error": err,
		}, "Failed to generate signed access token")

		return nil, err
	}

	newTokenID, refreshToken, refreshExp, err := generateRefreshToken(input)
	if err != nil {
		logger.ErrorWithFields(map[string]any{
			"token": accessToken,
			"exp":   accessExp,
			"error": err,
		}, "Failed to generate refresh access token")

		return nil, err
	}

	hash := generateRefreshTokenHash(auth.secretKey, []byte(refreshToken))
	newEncodedHash := base64.StdEncoding.EncodeToString(hash)
	if err = storeRefreshToken(ctx, input, newTokenID, newEncodedHash, refreshExp); err != nil {
		logger.ErrorWithFields(map[string]any{
			"Middleware": "GenerateTokenPair()",
		}, "failed to store refresh token")

		return nil, err
	}

	return &TokenPair{
		AccessToken:     accessToken,
		AccessTokenExp:  accessExp,
		RefreshToken:    refreshToken,
		RefreshTokenExp: refreshExp,
	}, nil
}

func ParseTokenToClaims(tokenString string) (*CustomClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &CustomClaims{}, func(t *jwt.Token) (any, error) {
		return auth.secretKey, nil
	})

	if err != nil || !token.Valid {
		logger.ErrorfWithFields(map[string]any{
			"Middleware": "ParseTokenToClaims()",
		}, "failed to parse with claims: %v", err)
		return nil, errTokenInvalid
	}

	claims, ok := token.Claims.(*CustomClaims)
	if !ok {
		logger.Debug("not valid claims in token")
		return nil, errTokenInvalid
	}

	if claims.ExpiresAt == nil || claims.ExpiresAt.Time.Before(time.Now()) {
		logger.Debug("token expired")
		return nil, errTokenExpired
	}

	return claims, nil
}

func HandleMiddlewareWithAccessToken(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var claims *CustomClaims

		accessCookie, err := r.Cookie("access")
		if err == nil {
			claims, err = ParseTokenToClaims(accessCookie.Value)
			if err == nil {
				ctx := context.WithValue(r.Context(), claimsKey, claims)
				next.ServeHTTP(w, r.WithContext(ctx))
				return
			}

			if !errors.Is(err, errTokenExpired) {
				http.Error(w, http.StatusText(http.StatusUnauthorized), http.StatusUnauthorized)
				return
			}
		}

		tokenPair, err := HandleRefreshToken(r)
		if err != nil {
			http.Error(w, http.StatusText(http.StatusUnauthorized), http.StatusUnauthorized)
			return
		}

		SetAuthCookieByTokenPair(w, tokenPair)

		claims, err = ParseTokenToClaims(tokenPair.AccessToken)
		if err != nil {
			http.Error(w, http.StatusText(http.StatusUnauthorized), http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), claimsKey, claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func HandleRefreshToken(r *http.Request) (*TokenPair, error) {
	cookie, err := r.Cookie("refresh")
	if err != nil {
		if errors.Is(err, errTokenExpired) {
			logger.Error("refresh token expired")
		} else {
			logger.Errorf("invalid token: %v", err)
		}

		return nil, errTokenInvalid
	}

	claims, err := ParseTokenToClaims(cookie.Value)
	if err != nil || claims.TokenType != "refresh" {
		logger.Error("invalid refresh token: ", err)
		return nil, err
	}

	oldHash := generateRefreshTokenHash(auth.secretKey, []byte(cookie.Value))
	oldEncodedHash := base64.StdEncoding.EncodeToString(oldHash)

	return GenerateTokenPair(r.Context(), RefreshParams{
		uuid.MustParse(claims.UserID),
		uuid.MustParse(claims.TokenID),
		claims.Permission,
		oldEncodedHash,
	})
}

func GetClaimsFromRequest(r *http.Request) (*CustomClaims, error) {
	claims, ok := r.Context().Value(claimsKey).(*CustomClaims)

	fmt.Printf("%+v", claims)

	if !ok {
		return nil, errors.New("failed to get claims")
	}

	return claims, nil
}

func RoleValidator(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		claims, ok := r.Context().Value(claimsKey).(*CustomClaims)
		if !ok || claims == nil {
			logger.Error("Error on role validation: claims not found")
			http.Error(w, http.StatusText(http.StatusUnauthorized), http.StatusUnauthorized)
			return
		}

		allowedRoles, ok := r.Context().Value(RolesKey).([]enum.PermissionRole)
		if !ok || len(allowedRoles) == 0 {
			logger.Debug("no role limits")
			next.ServeHTTP(w, r)
			return
		}

		if slices.Contains(allowedRoles, dto.ResolveUserRole(claims.Permission)) {
			next.ServeHTTP(w, r)
			return
		}

		logger.Errorf("Error on request Role validation: Forbidden UserId: %v User PermissionRole: %s Req_Roles: %v", claims.UserID, claims.Permission, allowedRoles)
		http.Error(w, http.StatusText(http.StatusForbidden), http.StatusForbidden)
	})
}

func SetAuthCookieByTokenPair(w http.ResponseWriter, token *TokenPair) {
	http.SetCookie(w, &http.Cookie{
		Name:     "access",
		Value:    token.AccessToken,
		HttpOnly: true,
		Path:     "/",
		Expires:  token.AccessTokenExp,
	})

	http.SetCookie(w, &http.Cookie{
		Name:     "refresh",
		Value:    token.RefreshToken,
		HttpOnly: true,
		Path:     "/",
		Expires:  token.RefreshTokenExp,
	})
}

func HandleLogout(w http.ResponseWriter, r *http.Request) error {
	defer clearAuthCookies(w)

	cookie, err := r.Cookie("refresh")
	if err != nil {
		if errors.Is(err, errTokenExpired) {
			logger.Error("refresh token expired")
		} else {
			logger.Errorf("invalid token: %v", err)
		}

		return errTokenInvalid
	}

	claims, err := ParseTokenToClaims(cookie.Value)
	if err != nil || claims.TokenType != "refresh" {
		logger.Error("invalid refresh token: ", err)
		return err
	}

	tokenID, err := uuid.Parse(claims.TokenID)
	if err != nil {
		logger.Errorf("failed to parse token ID on logout: %v", err)
		return fmt.Errorf("failed to parse token ID on logout: %w", err)
	}

	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	errCh := make(chan error, 1)
	go func() {
		errCh <- removeTokenBy(r.Context(), tokenID)
	}()

	select {
	case err := <-errCh:
		if err != nil {
			logger.Errorf("failed to delete refresh token while logout: %v", err)
		}
	case <-ctx.Done():
		logger.Errorf("timeout deleting refresh token on logout: %v", ctx.Err())
	}

	return nil
}
