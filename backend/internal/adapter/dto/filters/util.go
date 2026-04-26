package filters

import (
	"strings"
	"time"
)

func resolveSortingDirection(dir string) string {
	if strings.EqualFold(dir, "desc") {
		return "DESC"
	}

	return "ASC"
}

func ResolveDateTime(date string) time.Time {
	dateTime, _ := time.Parse(time.RFC3339Nano, date)

	if !dateTime.IsZero() {
		dateTime = dateTime.Add(24 * time.Hour).Add(-1 * time.Millisecond)
	}

	return dateTime
}
