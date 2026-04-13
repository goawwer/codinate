package uploads

import (
	"context"
	"fmt"

	"github.com/goawwer/codinate/pkg/logger"
	"github.com/spf13/viper"
)

type config struct {
	FilesDir     string `mapstructure:"UPLOADS_DIR"`
	FilesMaxSize int    `mapstructure:"UPLOADS_MAX_SIZE_MB"`
}

func InitializeUploadsDir(ctx context.Context) {
	if _, err := loadFilesConfig(); err != nil {
		panic(fmt.Sprint(err.Error()))
	}
}

func loadFilesConfig() (*config, error) {
	var cfg config

	if err := viper.Unmarshal(&cfg); err != nil {
		logger.Errorf("failed to load files config: %v", err)
		return nil, err
	}

	return &cfg, nil
}
