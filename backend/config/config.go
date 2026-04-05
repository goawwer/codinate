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

	viper.SetDefault("SERV_HOST", "localhost")
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
