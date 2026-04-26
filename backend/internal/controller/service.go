package controller

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"reflect"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
)

type Service interface {
	GetRequest() *http.Request
	GetResponse() http.ResponseWriter
	GetService() any
	GetPathParameterAsString(name string) (string, error)
	GetPathParamAsInt(name string) (int, error)
	GetUrlParamAsString(name string) (string, error)
	GetBodyAs(model interface{}) error
	GetUrlParamAsStrings(name string) ([]string, error)
	BindUrlParams(target any, prefix string) error
	GetBasicSortingAndPagingParams() BasicQueryParams
}

type CoreService struct {
	Request  *http.Request
	Response http.ResponseWriter
	Service  any
}

func (s *CoreService) GetRequest() *http.Request {
	return s.Request
}

func (s *CoreService) GetResponse() http.ResponseWriter {
	return s.Response
}

func (s *CoreService) GetService() any {
	return s.Service
}

func (s *CoreService) GetPathParameterAsString(name string) (string, error) {
	param := chi.URLParam(s.GetRequest(), name)
	if param == "" {
		return "", fmt.Errorf("failed to get path parameter - %s: not found", name)
	}

	return param, nil
}

func (s *CoreService) GetPathParamAsInt(name string) (int, error) {
	paramStr := chi.URLParam(s.Request, name)
	if paramStr == "" {
		return 0, fmt.Errorf("path parameter '%s' not found", name)
	}

	return strconv.Atoi(paramStr)
}

func (s *CoreService) GetUrlParamAsString(name string) (string, error) {
	params, ok := s.Request.URL.Query()[name]
	if !ok {
		return "", fmt.Errorf("failed to get URL parameter - %s: not found", name)
	}

	return params[0], nil
}

func (s *CoreService) GetBodyAs(model interface{}) error {
	rv := reflect.ValueOf(model)
	if rv.Kind() != reflect.Ptr || rv.IsNil() {
		return &json.InvalidUnmarshalError{Type: reflect.TypeOf(model)}
	}

	body, err := io.ReadAll(s.Request.Body)
	if err != nil {
		return err
	}

	return json.Unmarshal(body, &model)
}

func (s *CoreService) GetUrlParamAsStrings(name string) ([]string, error) {
	paramsStrings, ok := s.Request.URL.Query()[name]
	if !ok {
		return nil, fmt.Errorf("URL parameter '%s' not found", name)
	}

	var arr []string
	for _, paramStr := range paramsStrings { // ["1,2", "3,4"]
		values := strings.Split(paramStr, ",")
		arr = append(arr, values...)
	}

	return arr, nil
}

func (s *CoreService) GetSorting() (string, string) {
	by, _ := s.GetUrlParamAsString("orderBy")
	direction, _ := s.GetUrlParamAsString("order")

	return by, direction
}

func (s *CoreService) GetPaging() (int, int) {
	num, _ := s.GetPathParamAsInt("pageNumber")
	size, _ := s.GetPathParamAsInt("pageSize")

	return num, size
}

func (s *CoreService) GetSearching() (string, string) {
	by, _ := s.GetUrlParamAsString("searchBy")
	v, _ := s.GetUrlParamAsString("searchValue")

	return by, v
}

func (s *CoreService) GetDateRange() (string, string) {
	from, _ := s.GetUrlParamAsString("from")
	to, _ := s.GetUrlParamAsString("to")

	return from, to
}

func (s *CoreService) GetBasicSortingAndPagingParams() BasicQueryParams {
	sortBy, sort := s.GetSorting()
	pageNumber, pageSize := s.GetPaging()
	searchBy, searchValue := s.GetSearching()
	from, to := s.GetDateRange()

	return BasicQueryParams{
		PageNumber:  pageNumber,
		PageSize:    pageSize,
		SortBy:      sortBy,
		Sort:        sort,
		SearchBy:    searchBy,
		SearchValue: searchValue,
		From:        from,
		To:          to,
	}
}

func (s *CoreService) BindUrlParams(target any, prefix string) error {
	return s.bindUrlParamsRecursive(target, prefix)
}

func (s *CoreService) bindUrlParamsRecursive(target any, prefix string) error {
	val := reflect.ValueOf(target)
	if val.Kind() != reflect.Ptr || val.IsNil() {
		return errors.New("target must be a non-nil pointer")
	}
	val = val.Elem()
	typ := val.Type()

	for i := 0; i < val.NumField(); i++ {
		field := val.Field(i)
		fieldType := typ.Field(i)

		jsonTag := fieldType.Tag.Get("json")
		if jsonTag == "" || !field.CanSet() {
			continue
		}

		required := fieldType.Tag.Get("required") == "true"

		fullKey := jsonTag
		if prefix != "" {
			fullKey = prefix + "[" + jsonTag + "]"
		}

		if field.Type() == reflect.TypeOf(time.Time{}) {
			v, err := s.GetUrlParamAsString(fullKey)
			if err != nil {
				if required {
					return fmt.Errorf("required param '%s' missing: %w", fullKey, err)
				}
				continue
			}
			layouts := []string{
				time.RFC3339Nano,
				time.RFC3339,
				"2006-01-02",
				"2006-01-02 15:04:05",
			}
			var t time.Time
			var parseErr error
			for _, layout := range layouts {
				t, parseErr = time.Parse(layout, v)
				if parseErr == nil {
					field.Set(reflect.ValueOf(t))
					break
				}
			}
			if parseErr != nil {
				return fmt.Errorf("param '%s' invalid time format: %w", fullKey, parseErr)
			}
			continue
		}

		if field.Kind() == reflect.Struct && field.Type().Name() != "Time" {
			if err := s.bindUrlParamsRecursive(field.Addr().Interface(), fullKey); err != nil {
				return err
			}
			continue
		}

		if field.Kind() == reflect.String {
			v, err := s.GetUrlParamAsString(fullKey)
			if err != nil {
				if required {
					return fmt.Errorf("required param '%s' missing: %w", fullKey, err)
				}
				continue
			}
			field.SetString(v)
			continue
		}

		if field.Kind() == reflect.Int || field.Kind() == reflect.Int64 || field.Kind() == reflect.Int32 {
			v, err := s.GetUrlParamAsString(fullKey)
			if err != nil {
				if required {
					return fmt.Errorf("required param '%s' missing: %w", fullKey, err)
				}
				continue
			}
			iv, convErr := strconv.Atoi(v)
			if convErr != nil {
				return fmt.Errorf("param '%s' invalid int: %w", fullKey, convErr)
			}
			field.SetInt(int64(iv))
			continue
		}

		if field.Kind() == reflect.Float64 || field.Kind() == reflect.Float32 {
			v, err := s.GetUrlParamAsString(fullKey)
			if err != nil {
				if required {
					return fmt.Errorf("required param '%s' missing: %w", fullKey, err)
				}
				continue
			}
			fv, convErr := strconv.ParseFloat(v, 64)
			if convErr != nil {
				return fmt.Errorf("param '%s' invalid float: %w", fullKey, convErr)
			}
			field.SetFloat(fv)
			continue
		}

		if field.Kind() == reflect.Bool {
			v, err := s.GetUrlParamAsString(fullKey)
			if err != nil {
				if required {
					return fmt.Errorf("required param '%s' missing: %w", fullKey, err)
				}
				continue
			}
			bv, convErr := strconv.ParseBool(v)
			if convErr != nil {
				return fmt.Errorf("param '%s' invalid bool: %w", fullKey, convErr)
			}
			field.SetBool(bv)
			continue
		}

		if field.Kind() == reflect.Slice {
			vals, err := s.GetUrlParamAsStrings(fullKey)
			if err != nil {
				if required {
					return fmt.Errorf("required param '%s' missing: %w", fullKey, err)
				}
				continue
			}
			if vals != nil {
				sliceVal := reflect.MakeSlice(field.Type(), len(vals), len(vals))
				elemKind := field.Type().Elem().Kind()
				for idx, valStr := range vals {
					elem := sliceVal.Index(idx)
					switch elemKind {
					case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
						iv, convErr := strconv.ParseInt(valStr, 10, 64)
						if convErr != nil {
							return fmt.Errorf("param '%s[%d]' invalid int: %w", fullKey, idx, convErr)
						}
						elem.SetInt(iv)
					case reflect.Float32, reflect.Float64:
						fv, convErr := strconv.ParseFloat(valStr, 64)
						if convErr != nil {
							return fmt.Errorf("param '%s[%d]' invalid float: %w", fullKey, idx, convErr)
						}
						elem.SetFloat(fv)
					case reflect.Bool:
						bv, convErr := strconv.ParseBool(valStr)
						if convErr != nil {
							return fmt.Errorf("param '%s[%d]' invalid bool: %w", fullKey, idx, convErr)
						}
						elem.SetBool(bv)
					default:
						elem.Set(reflect.ValueOf(valStr).Convert(field.Type().Elem()))
					}
				}
				field.Set(sliceVal)
			}
		}
	}

	if v, ok := target.(interface{ Validate() error }); ok {
		if err := v.Validate(); err != nil {
			return err
		}
	}

	return nil
}
