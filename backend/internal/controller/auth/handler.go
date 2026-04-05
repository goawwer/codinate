package auth

import (
	"encoding/json"
	"net/http"

	"github.com/goawwer/codinate/internal/service/middleware"
	"github.com/goawwer/codinate/pkg/logger"
	"github.com/google/uuid"
)

func login(w http.ResponseWriter, r *http.Request) {
	var input loginInput

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	userID, role, err := getUserAtLogin(r.Context(), input)
	if err != nil {
		if _, ok := err.(InvalidCredentialsError); ok {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		logger.Errorf("failed to get user at login: %v", err)

		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	tokenPair, err := middleware.GenerateTokenPair(r.Context(), middleware.RefreshParams{
		UserID:  userID,
		Role:    role,
		TokenID: uuid.Nil,
	})
	if err != nil {
		logger.Errorf("failed to generate token pair at login: %v", err)

		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	middleware.SetAuthCookieByTokenPair(w, tokenPair)
}

func refresh(w http.ResponseWriter, r *http.Request) {
	tokenPair, err := middleware.HandleRefreshToken(r)
	if err != nil {
		logger.Infof("failed to handle refresh token on /refresh: %v", err)

		http.Error(w, "failed to restore refresh token", http.StatusInternalServerError)
		return
	}

	middleware.SetAuthCookieByTokenPair(w, tokenPair)
}

func logout(w http.ResponseWriter, r *http.Request) {
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

	http.Redirect(w, r, "/api/auth/login", http.StatusOK)
}
