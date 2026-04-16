package shared

import "encoding/json"

type MemberShort struct {
	Id      string `json:"id"`
	Name    string `json:"name"`
	Surname string `json:"surname"`
}

type MembersShort []MemberShort

func (m *MembersShort) Scan(src any) error {
	if src == nil {
		*m = MembersShort{}
		return nil
	}
	var data []byte
	switch v := src.(type) {
	case []byte:
		data = v
	case string:
		data = []byte(v)
	}
	return json.Unmarshal(data, m)
}
