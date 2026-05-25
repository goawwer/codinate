package comment

import (
	"encoding/json"
	"time"

	"github.com/goawwer/codinate/internal/adapter/dto/file"
	"github.com/google/uuid"
)

type HistoryChange struct {
	Id        uuid.UUID `db:"id" json:"id"`
	FieldName string    `db:"field_name" json:"fieldName"`
	OldValue  any       `db:"old_value" json:"oldValue"`
	NewValue  any       `db:"new_value" json:"newValue"`
}

type HistoryChanges []HistoryChange

func (h *HistoryChanges) Scan(src any) error {
	if src == nil {
		*h = HistoryChanges{}
		return nil
	}
	var data []byte
	switch v := src.(type) {
	case []byte:
		data = v
	case string:
		data = []byte(v)
	}
	return json.Unmarshal(data, h)
}

type Row struct {
	Id               uuid.UUID          `db:"id" json:"id"`
	EntityType       string             `db:"entity_type" json:"entityType"`
	EntityId         uuid.UUID          `db:"entity_id" json:"entityId"`
	EmployeeId       uuid.UUID          `db:"employee_id" json:"employeeId"`
	EmployeeName     string             `db:"employee_name" json:"employeeName"`
	EmployeeSurname  string             `db:"employee_surname" json:"employeeSurname"`
	EmployeeUsername string             `db:"employee_username" json:"employeeUsername"`
	EmployeePicture  *string            `db:"employee_profile_picture" json:"employeePicture"`
	Body             string             `db:"body" json:"body"`
	AttachedFiles    file.AttachedFiles `db:"attached_files" json:"attachedFiles"`
	Changes          HistoryChanges     `db:"changes" json:"changes"`
	CreatedAt        time.Time          `db:"created_at" json:"createdAt"`
	UpdatedAt        time.Time          `db:"updated_at" json:"updatedAt"`
}
