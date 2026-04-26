package project

import (
	"database/sql/driver"
	"encoding/json"
)

type ProjectLink struct {
	Title string `json:"title"`
	URL   string `json:"url"`
}

type ProjectLinks []ProjectLink

func (l *ProjectLinks) Scan(src any) error {
	if src == nil {
		*l = ProjectLinks{}
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

func (l ProjectLinks) Value() (driver.Value, error) {
	if l == nil {
		return "[]", nil
	}
	b, err := json.Marshal(l)
	return string(b), err
}
