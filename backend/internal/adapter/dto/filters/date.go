package filters

import (
	"time"
)

type DateRange struct {
	From time.Time `json:"from" required:"true"`
	To   time.Time `json:"to" required:"true"`
}

func NewDateRange(dateFrom, dateTo string) *DateRange {
	dateTimeFrom, _ := time.Parse("2006-01-02T15:04:05-07:00", dateFrom)
	dateTimeTo, _ := time.Parse("2006-01-02T15:04:05-07:00", dateTo)

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
