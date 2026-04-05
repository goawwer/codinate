package logger

import "github.com/sirupsen/logrus"

type config struct {
	LocalTime        bool   `mapstructure:"LOG_LOCAL_TIME"`
	Compress         bool   `mapstructure:"LOG_COMPRESS"`
	UseConsoleColors bool   `mapstructure:"LOG_USE_CONSOLE_COLORS"`
	MaxSize          int    `mapstructure:"LOG_MAX_SIZE"`
	MaxAge           int    `mapstructure:"LOG_MAX_AGE"`
	MaxBackups       int    `mapstructure:"LOG_MAX_BACKUPS"`
	Directory        string `mapstructure:"LOG_DIR"`
}

var (
	loggerConfig *config

	mainDebugLogger *logrus.Logger
	mainInfoLogger  *logrus.Logger
	mainErrorLogger *logrus.Logger
	mainFatalLogger *logrus.Logger
	mainSqlLogger   *logrus.Logger
	mainHttpLogger  *logrus.Logger
)
