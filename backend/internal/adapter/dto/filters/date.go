package filters

import (
	"time"
)

type DateRange struct {
	From time.Time `json:"from" required:"true"`
	To   time.Time `json:"to" required:"true"`
}

func parseDate(s string) time.Time {
	for _, layout := range []string{time.RFC3339Nano, time.RFC3339, "2006-01-02"} {
		if t, err := time.Parse(layout, s); err == nil {
			return t
		}
	}
	return time.Time{}
}

func NewDateRange(dateFrom, dateTo string) *DateRange {
	dateTimeFrom := parseDate(dateFrom)
	dateTimeTo := parseDate(dateTo)

	if !dateTimeTo.IsZero() {
		dateTimeTo = dateTimeTo.Add(24 * time.Hour).Add(-1 * time.Millisecond)
	}

	d := &DateRange{
		From: dateTimeFrom,
		To:   dateTimeTo,
	}

	return d
}

func (d *DateRange) IsSet() bool {
	return !d.From.IsZero() && !d.To.IsZero()
}

func (d *DateRange) IsSetButNotBoth() bool {
	return !d.From.IsZero() && d.To.IsZero() || d.From.IsZero() && !d.To.IsZero()
}
