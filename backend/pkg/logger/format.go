package logger

import (
	"fmt"
	"strings"
	"time"

	"github.com/sirupsen/logrus"
)

const (
	ColorReset   = "\033[0m"
	ColorRed     = "\033[31m"
	ColorBoldRed = "\033[1;31m"
	ColorGreen   = "\033[32m"
	ColorYellow  = "\033[33m"
	ColorBlue    = "\033[34m"
	ColorPurple  = "\033[35m"
	ColorCyan    = "\033[36m"
	ColorWhite   = "\033[37m"
	ColorGray    = "\033[90m"
)

var (
	defaultLogFormat       = "[%lvl%]: %time% - %msg%"
	defaultTimeStampFormat = time.RFC3339
)

type formatter struct {
	TimestampFormat string
	LogFormat       string
	UseColors       bool
}

func (f *formatter) Format(entry *logrus.Entry) ([]byte, error) {
	output := f.LogFormat
	if output == "" {
		output = defaultLogFormat
	}

	timestampFormat := f.TimestampFormat
	if timestampFormat == "" {
		timestampFormat = defaultTimeStampFormat
	}

	output = strings.Replace(output, "%time%", entry.Time.Format(timestampFormat), 1)

	output = strings.Replace(output, "%msg%", entry.Message, 1)

	level := strings.ToUpper(entry.Level.String())
	if f.UseColors {
		coloredLevel := colorizeLevel(level)
		if level == "INFO" || level == "WARN" {
			output = strings.Replace(output, "%lvl%", " "+coloredLevel, 1)
		} else {
			output = strings.Replace(output, "%lvl%", coloredLevel, 1)
		}
	} else {
		if level == "INFO" || level == "WARN" {
			output = strings.Replace(output, "%lvl%", " "+level, 1)
		} else {
			output = strings.Replace(output, "%lvl%", level, 1)
		}
	}

	for k, val := range entry.Data {
		switch v := val.(type) {
		case string:
			output += fmt.Sprintf("%s : %s", k, v)
		case int:
			output += fmt.Sprintf("%s : %d", k, v)
		case bool:
			output += fmt.Sprintf("%s : %t", k, v)
		default:
			output += fmt.Sprintf("%s : %s", k, v)
		}
	}

	return []byte(output + "\n"), nil
}

func colorizeLevel(level string) string {
	switch level {
	case "DEBUG":
		return ColorGray + level + ColorReset
	case "INFO":
		return ColorGreen + level + ColorReset
	case "WARN":
		return ColorYellow + level + ColorReset
	case "ERROR":
		return ColorRed + level + ColorReset
	case "FATAL":
		return ColorBoldRed + level + ColorReset
	default:
		return level
	}
}
