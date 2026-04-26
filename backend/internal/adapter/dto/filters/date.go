package filters

import (
	"time"
)

type DateRange struct {
	From time.Time `json:"from" required:"true"`
	To   time.Time `json:"to" required:"true"`
}

func NewDateRange(dateFrom, dateTo string) *DateRange {
	dateTimeFrom, _ := time.Parse(time.RFC3339Nano, dateFrom)
	dateTimeTo, _ := time.Parse(time.RFC3339Nano, dateTo)

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
