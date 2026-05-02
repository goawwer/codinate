package comment

import (
	"time"

	"github.com/goawwer/codinate/internal/adapter/dto/file"
	"github.com/google/uuid"
)

type Row struct {
	Id               uuid.UUID          `db:"id" json:"id"`
	EmployeeId       uuid.UUID          `db:"employee_id" json:"employeeId"`
	EmployeeName     string             `db:"employee_name" json:"employeeName"`
	EmployeeSurname  string             `db:"employee_surname" json:"employeeSurname"`
	EmployeeUsername string             `db:"employee_username" json:"employeeUsername"`
	EmployeePicture  *string            `db:"employee_profile_picture" json:"employeePicture"`
	Body             string             `db:"body" json:"body"`
	AttachedFiles    file.AttachedFiles `db:"attached_files" json:"attachedFiles"`
	CreatedAt        time.Time          `db:"created_at" json:"createdAt"`
	UpdatedAt        time.Time          `db:"updated_at" json:"updatedAt"`
}
