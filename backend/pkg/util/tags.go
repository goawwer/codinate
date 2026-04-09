package util

import (
	"errors"
	"fmt"
	"reflect"
)

func GetDBColumn(entity any, fieldName string, defaultValues map[string]string) (string, error) {
	if v, ok := defaultValues[StringCapitalize(fieldName)]; ok {
		return v, nil
	}

	return getDbFieldByEntity(entity, fieldName)
}

func GetDBColumnsFiltersValuesMap(customNames map[string]string, source any, f any) map[string]any {
	v := reflect.ValueOf(f).Elem()
	t := v.Type()

	res := make(map[string]any, v.NumField())

	for i := 0; i < v.NumField(); i++ {
		field := t.Field(i)
		value := v.Field(i)

		if value.IsZero() {
			continue
		}

		dbCol, err := GetDBColumn(source, field.Name, customNames)
		if err != nil {
			continue
		}

		res[dbCol] = value.Interface()
	}

	return res
}

func getDbFieldByEntity(entity any, fieldName string) (string, error) {
	entityType := reflect.TypeOf(entity)

	if entityType.Kind() == reflect.Ptr {
		entityType = entityType.Elem()
	}

	if entityType.Kind() != reflect.Struct {
		return "", errors.New("provided entity is not struct, cannot find tags values")
	}

	field, ok := entityType.FieldByName(fieldName)
	if !ok {
		field, ok = entityType.FieldByName(StringCapitalize(fieldName))
		if !ok {
			return "", fmt.Errorf("field '%s' not found for %s", fieldName, entityType)
		}
	}

	column, ok := LookForTagOption(field.Tag, "db", "")
	if !ok {
		return "", fmt.Errorf("failed to get column from 'db' tag of field - %s not found for - %s", fieldName, entityType)
	}

	return column, nil
}
