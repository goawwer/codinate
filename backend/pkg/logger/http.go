package logger

import (
	"fmt"
	"net/http"
	"time"

	"github.com/go-chi/chi/middleware"
	"github.com/sirupsen/logrus"
)

type HttpMiddlewareLogger struct {
	*logrus.Logger
}

type HttpLoggerEntry struct {
	*logrus.Entry
}

func NewHttpLooger() func(next http.Handler) http.Handler {
	return middleware.RequestLogger(&HttpMiddlewareLogger{mainHttpLogger})
}

func (l *HttpMiddlewareLogger) NewLogEntry(r *http.Request) middleware.LogEntry {
	entry := &HttpLoggerEntry{
		Entry: logrus.NewEntry(mainHttpLogger),
	}

	logFields := logrus.Fields{}

	if loggerConfig.LocalTime {
		logFields[" ts"] = time.Now().Local().Format(time.RFC1123)
	} else {
		logFields[" ts"] = time.Now().UTC().Format(time.RFC1123)
	}

	if reqID := middleware.GetReqID(r.Context()); reqID != "" {
		logFields[" req_id"] = reqID
	}

	logFields[" req_method"] = r.Method
	logFields[" req_uri"] = r.RequestURI
	logFields[" remote_addr"] = r.RemoteAddr
	logFields[" user_agent"] = r.UserAgent()

	entry.Entry = entry.Entry.WithFields(logFields)
	entry.Entry.Debugln("Request start ")

	return entry
}

func (l *HttpLoggerEntry) Write(status, bytes int, header http.Header, elapsed time.Duration, extra interface{}) {
	l.Entry = l.Entry.WithFields(logrus.Fields{
		" resp_status": status,
		" resp_bytes":  bytes,
		" resp_ms":     elapsed,
	})

	l.Entry.Debugln("Request complete")
}

func (l *HttpLoggerEntry) Panic(v interface{}, stack []byte) {
	l.Entry = l.Entry.WithFields(logrus.Fields{
		"stack": string(stack),
		"panic": fmt.Sprintf("%+v", v),
	})

	l.Entry.Debugln("Request panic")
}
