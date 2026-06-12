package middleware

import (
	"fmt"

	"github.com/spf13/viper"
)

func InitializeAuth() {
	cfg, err := loadAuthConfig()
	if err != nil {
		panic("failed to load authentication config")
	}

	auth = newTokenWrapper(cfg)
}

func newTokenWrapper(cfg *config) *tokenWrapper {
	method := resolveSignMethod(cfg.TokeSignMethod)
	access, refresh, session, err := resolveAuthDurations(cfg)
	if err != nil {
		panic("failed to generate durations in auth config")
	}

	return &tokenWrapper{
		secretKey:                  []byte(cfg.SecretKey),
		signMethod:                 method,
		accessTokenExpiresDuration: access,
		refreshTokeExpiresDuration: refresh,
		sessionExpiresDuration:     session,
	}
}

func loadAuthConfig() (*config, error) {
	setupDefaults()

	var cfg config

	if err := viper.Unmarshal(&cfg); err != nil {
		return nil, err
	}

	if _, ok := allowedAlgs[cfg.TokeSignMethod]; !ok {
		return nil, fmt.Errorf("unsupported signing method")
	}

	return &cfg, nil
}

func setupDefaults() {
	viper.SetDefault("TOKEN_SIGN_METHOD", "HS256")
	viper.SetDefault("MAX_ACCESS_TOKEN_DURATION", "5m")
	viper.SetDefault("MAX_REFRESH_TOKEN_DURATION", "168h")
	viper.SetDefault("MAX_SESSION_DURATION", "720h")
}
