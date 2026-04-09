package auth

import (
	"encoding/json"
	"net/http"

	"github.com/goawwer/codinate/internal/service/middleware"
	"github.com/goawwer/codinate/pkg/logger"
	"github.com/google/uuid"
)

// login
//
//	@Tags			auth
//	@Summary		Login
//	@Description	Post body with username and password
//	@Accept			json
//	@Produce		json
//	@Param			request	body		loginInput	true	"Body with username and password"
//	@Success		200		{object}	nil
//	@Failure		400		{object}	string	"Bad Request"
//	@Failure		500		{object}	string	"Internal Server Error"
//	@Router			/auth/login  [post]
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

// refresh
//
//	@Tags			auth
//	@Summary		Refresh
//	@Description	Take refresh token and generate new token pair & delete exitsting refresh token in database
//	@Accept			json
//	@Produce		json
//	@Success		200	{object}	nil
//	@Failure		400	{object}	string	"Bad Request"
//	@Failure		500	{object}	string	"Internal Server Error"
//	@Router			/auth/refresh  [get]
func refresh(w http.ResponseWriter, r *http.Request) {
	tokenPair, err := middleware.HandleRefreshToken(r)
	if err != nil {
		logger.Infof("failed to handle refresh token on /refresh: %v", err)

		http.Error(w, "failed to restore refresh token", http.StatusInternalServerError)
		return
	}

	middleware.SetAuthCookieByTokenPair(w, tokenPair)
}

// logout
//
//	@Tags			auth
//	@Summary		Logout
//	@Description	Remove access and refresh cookie
//	@Accept			json
//	@Produce		json
//	@Success		200	{object}	nil
//	@Failure		400	{object}	string	"Bad Request"
//	@Failure		500	{object}	string	"Internal Server Error"
//	@Router			/auth/logout  [get]
func logout(w http.ResponseWriter, r *http.Request) {
	if err := middleware.HandleLogout(w, r); err != nil {
		logger.Errorf("failed to handle logout properly: %v", err)
	}
}
