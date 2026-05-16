package team

import (
	"database/sql/driver"
	"encoding/json"
)

type TeamLink struct {
	Title string `json:"title"`
	URL   string `json:"url"`
}

type TeamLinks []TeamLink

func (l *TeamLinks) Scan(src any) error {
	if src == nil {
		*l = TeamLinks{}
		return nil
	}
	var data []byte
	switch v := src.(type) {
	case []byte:
		data = v
	case string:
		data = []byte(v)
	}
	return json.Unmarshal(data, l)
}

func (l TeamLinks) Value() (driver.Value, error) {
	if l == nil {
		return "[]", nil
	}
	b, err := json.Marshal(l)
	return string(b), err
}
