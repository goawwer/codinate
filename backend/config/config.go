package config

import (
	"fmt"

	"github.com/spf13/viper"
)

func Initialize(configPath string) {
	if configPath != "" {
		viper.SetConfigFile(configPath)
		viper.SetConfigType("env")

		if err := viper.ReadInConfig(); err != nil {
			panic(fmt.Errorf("error reading config file %s: %w", configPath, err))
		}
	}

	viper.AutomaticEnv()

	for _, key := range []string{
		"SERV_HOST", "SERV_PORT", "SERV_REDIRECT_URL",
		"SECRET_KEY", "TOKEN_SIGN_METHOD",
		"MAX_ACCESS_TOKEN_DURATION", "MAX_REFRESH_TOKEN_DURATION", "MAX_SESSION_DURATION",
		"LOG_DIR", "LOG_MAX_SIZE", "LOG_MAX_AGE", "LOG_MAX_BACKUPS",
		"LOG_LOCAL_TIME", "LOG_COMPRESS", "LOG_USE_CONSOLE_COLORS",
		"UPLOADS_DIR", "UPLOADS_MAX_SIZE_MB", "UPLOADS_PICTURE_MAX_WIDTH", "UPLOADS_PICTURE_MAX_HEIGHT",
		"OWNER_NAME", "OWNER_SURNAME", "OWNER_USERNAME", "OWNER_EMAIL",
	} {
		if err := viper.BindEnv(key); err != nil {
			panic(fmt.Errorf("failed to bind env %s: %w", key, err))
		}
	}

	viper.SetDefault("SERV_HOST", "0.0.0.0")
	viper.SetDefault("SERV_PORT", "8080")
	viper.SetDefault("DB_HOST", "localhost")
	viper.SetDefault("DB_PORT", 5432)
	viper.SetDefault("LOG_DIR", "./logs")
	viper.SetDefault("LOG_MAX_SIZE", 10)
	viper.SetDefault("LOG_MAX_AGE", 3)
	viper.SetDefault("LOG_MAX_BACKUPS", 3)
	viper.SetDefault("LOG_LOCAL_TIME", true)
	viper.SetDefault("LOG_COMPRESS", false)

	required := []string{"DB_NAME", "DB_USER", "DB_PASSWORD"}
	for k := range required {
		if !viper.IsSet(required[k]) {
			panic("required config parameters are not set")
		}
	}
}
