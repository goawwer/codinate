package logger

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/natefinch/lumberjack"
	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
)

func init() {
	prepareStdLogrus()
}

func Initialize() {
	initLogger(true)
}

func loadLogger() (*config, error) {
	var cfg config

	if err := viper.Unmarshal(&cfg); err != nil {
		return nil, fmt.Errorf("failed to unmarshal config: %w", err)
	}

	setupDefaults()

	return &cfg, nil
}

func initLogger(panicIfAlreadyInitialized bool) {
	if initialized() {
		if !panicIfAlreadyInitialized {
			return
		}
		panic("logger already initialized")
	}

	cfg, err := loadLogger()
	if err != nil {
		panic(fmt.Sprint(err.Error()))
	}

	loggerConfig = cfg

	mainInfoLogger = createLogger(cfg, "info.log", logrus.InfoLevel)
	mainDebugLogger = createLogger(cfg, "debug/debug.log", logrus.DebugLevel)
	mainErrorLogger = createLogger(cfg, "error/error.log", logrus.ErrorLevel)
	mainFatalLogger = createLogger(cfg, "fatal/fatal.log", logrus.FatalLevel)
	mainSqlLogger = createLogger(cfg, "sql/sql.log", logrus.DebugLevel)
	mainHttpLogger = createLogger(cfg, "http/http.log", logrus.DebugLevel)
}

func setupDefaults() {
	viper.SetDefault("LOG_DIRECTORY", ".logs/")
	viper.SetDefault("LOG_MAX_SIZE", "4")
	viper.SetDefault("LOG_MAX_BACKUPS", "3")
}

func initialized() bool {
	return mainDebugLogger != nil || mainInfoLogger != nil || mainErrorLogger != nil || mainSqlLogger != nil || mainHttpLogger != nil
}

func createLogger(cfg *config, name string, level logrus.Level) *logrus.Logger {
	logFile := filepath.Join(filepath.FromSlash(cfg.Directory), name)
	timeFormat := "02-01-2006 15:04:05.0000"

	fileLogger := &lumberjack.Logger{
		Filename:   logFile,
		MaxSize:    cfg.MaxSize,
		MaxAge:     cfg.MaxAge,
		MaxBackups: cfg.MaxBackups,
		LocalTime:  cfg.LocalTime,
		Compress:   cfg.Compress,
	}

	logger := logrus.New()

	// file logger
	logger.SetOutput(fileLogger)
	logger.SetFormatter(&formatter{
		LogFormat:       "%time%: %lvl% - %msg%",
		TimestampFormat: timeFormat,
	})
	logger.SetLevel(level)

	// console logger
	logger.AddHook(&ColorConsoleHook{
		Formatter: &formatter{
			LogFormat:       "%time%: %lvl% - %msg%",
			TimestampFormat: timeFormat,
			UseColors:       cfg.UseConsoleColors,
		},
	})

	return logger
}

func Debug(args ...any) {
	mainDebugLogger.Debug(args...)
}

func Debugf(format string, args ...any) {
	mainDebugLogger.Debugf(format, args...)
}

func Info(args ...any) {
	if mainInfoLogger != mainDebugLogger {
		mainDebugLogger.Debug(args...)
	}

	mainInfoLogger.Info(args...)
}

func Infof(format string, args ...any) {
	if mainInfoLogger != mainDebugLogger {
		mainDebugLogger.Debugf(format, args...)
	}

	mainInfoLogger.Infof(format, args...)
}

func Warn(args ...any) {
	mainDebugLogger.Warn(args...)
}

func Warnf(format string, args ...any) {
	mainDebugLogger.Warnf(format, args...)
}

func WarnWithFields(fields map[string]any, msg string) {
	mainDebugLogger.WithFields(fields).Warn(msg)
}

func Error(args ...any) {
	if mainErrorLogger != mainInfoLogger {
		mainInfoLogger.Error(args...)
	}
	if mainErrorLogger != mainDebugLogger {
		mainDebugLogger.Error(args...)
	}

	mainErrorLogger.Error(args...)
}

func Errorf(format string, args ...any) {
	if mainErrorLogger != mainInfoLogger {
		mainInfoLogger.Errorf(format, args...)
	}
	if mainErrorLogger != mainDebugLogger {
		mainDebugLogger.Errorf(format, args...)
	}

	mainErrorLogger.Errorf(format, args...)
}

func ErrorWithFields(fields map[string]any, msg string) {
	if mainErrorLogger != mainDebugLogger {
		mainDebugLogger.WithFields(fields).Error(msg)
	}

	mainErrorLogger.WithFields(fields).Error(msg)
}

func ErrorfWithFields(fields map[string]any, format string, msg any) {
	if mainErrorLogger != mainDebugLogger {
		mainDebugLogger.WithFields(fields).Error(msg)
	}

	mainErrorLogger.WithFields(fields).Errorf(format, msg)
}

func Fatal(args ...any) {
	mainFatalLogger.Fatal(args...)
}

func Fatalf(format string, args ...any) {
	mainFatalLogger.Fatalf(format, args...)
}

func Sqlf(format string, args ...any) {
	mainSqlLogger.Debugf(format, args...)
}

type ColorConsoleHook struct {
	Formatter logrus.Formatter
}

func (h *ColorConsoleHook) Levels() []logrus.Level {
	return logrus.AllLevels
}

func (h *ColorConsoleHook) Fire(e *logrus.Entry) error {
	line, err := h.Formatter.Format(e)
	if err != nil {
		return err
	}

	_, err = os.Stdout.Write(line)
	return err
}

type StdLogrusHook struct{}

func (h *StdLogrusHook) Levels() []logrus.Level {
	return logrus.AllLevels
}

func (h *StdLogrusHook) Fire(e *logrus.Entry) error {
	e.Data["BAD"] = "ERROR: DO NOT USE DEFAULT LOGRUS"
	switch e.Level {
	case logrus.DebugLevel:
		e.Data["BAD"] = "ERROR: DO NOT USE DEFAULT LOGRUS DEBUG"
	case logrus.InfoLevel:
		e.Data["BAD"] = "ERROR: DO NOT USE DEFAULT LOGRUS INFO"
	case logrus.WarnLevel:
		e.Data["BAD"] = "ERROR: DO NOT USE DEFAULT LOGRUS WARN"
	case logrus.ErrorLevel:
		e.Data["BAD"] = "ERROR: DO NOT USE DEFAULT LOGRUS ERROR"
	}

	return nil
}

func prepareStdLogrus() {
	logDir := os.Getenv("LOG_DIR")
	logFile := filepath.Join(filepath.FromSlash(logDir), "std_logrus/std.log")

	loggerOut := lumberjack.Logger{
		Filename:   logFile,
		MaxSize:    5,
		MaxBackups: 2,
	}

	logrus.StandardLogger().AddHook(new(StdLogrusHook))
	logrus.SetOutput(&loggerOut)
}
