package repository

import (
	"fmt"
	"reflect"
	"strings"
	"time"

	"github.com/goawwer/codinate/pkg/util"
)

type QueryFiltersBuilder struct {
	query           string
	whereConditions []string
	orderCondition  string
	limitCondition  string
	updateCondition []string
}

type Filter struct {
	Arg any
	Op  string
}

func (qb *QueryFiltersBuilder) Build() string {
	if len(qb.updateCondition) > 0 {
		qb.query = fmt.Sprintf("SET %s\n", strings.Join(qb.updateCondition, ", "))
	}

	if len(qb.whereConditions) > 0 {
		qb.query += fmt.Sprintf("WHERE %s\n", strings.Join(qb.whereConditions, " AND "))
	}

	if qb.orderCondition != "" {
		qb.query += qb.orderCondition
	}

	if qb.limitCondition != "" {
		qb.query += qb.limitCondition
	}

	return qb.query
}

func (qb *QueryFiltersBuilder) Update(params map[string]any) *QueryFiltersBuilder {
	for c, v := range params {
		rv := reflect.ValueOf(v)

		if rv.Kind() == reflect.Ptr {
			if rv.IsNil() {
				continue
			}
			rv = rv.Elem()
		}

		if rv.IsZero() {
			continue
		}

		qb.updateCondition = append(qb.updateCondition, fmt.Sprintf("%s = '%v'", c, rv.Interface()))
	}
	return qb
}

func (qb *QueryFiltersBuilder) Eq(column string, value any) *QueryFiltersBuilder {
	qb.Add(column, Filter{Arg: value, Op: "="})
	return qb
}

func (qb *QueryFiltersBuilder) Eqs(params map[string]any) *QueryFiltersBuilder {
	for col, val := range params {
		qb.Add(col, Filter{Arg: val, Op: "="})
	}
	return qb
}

func (qb *QueryFiltersBuilder) In(params map[string]any) *QueryFiltersBuilder {
	for c, v := range params {
		qb.Add(c, Filter{
			Arg: v,
			Op:  "IN",
		})
	}

	return qb
}

func (qb *QueryFiltersBuilder) Like(colum string, arg any) *QueryFiltersBuilder {
	if colum != "" {
		qb.Add(colum, Filter{Arg: fmt.Sprintf("%%%s%%", arg.(string)), Op: "ILIKE"})
	}
	return qb
}

func (qb *QueryFiltersBuilder) FilterWithOperator(column string, arg any, operator string, prefix ...string) *QueryFiltersBuilder {
	pr := ""
	if len(prefix) > 0 {
		pr = prefix[0]
	}

	qb.Add(pr+column, Filter{Arg: arg, Op: operator})
	return qb
}

func (qb *QueryFiltersBuilder) FiltersWithOperators(params map[string]Filter) *QueryFiltersBuilder {
	for col, val := range params {
		qb.Add(col, Filter{Arg: val.Arg, Op: qb.checkOperator(val.Op)})
	}
	return qb
}

func (qb *QueryFiltersBuilder) Limit(offset, limit int) *QueryFiltersBuilder {
	qb.limitCondition = fmt.Sprintf("OFFSET %d LIMIT %d\n", offset, limit)
	return qb
}

func (qb *QueryFiltersBuilder) Order(column, dir string, def ...string) *QueryFiltersBuilder {
	if column != "" {
		qb.orderCondition = fmt.Sprintf("ORDER BY %s %s\n", column, dir)
	} else {
		qb.orderCondition = fmt.Sprintf("ORDER BY %s %s\n", def[0], dir)
	}

	return qb
}

func (qb *QueryFiltersBuilder) Add(column string, f Filter) {
	val := reflect.ValueOf(f.Arg)

	switch v := f.Arg.(type) {
	case int:
		if v == 0 {
			return
		}
	case string:
		if v == "" {
			return
		}
	case time.Time:
		if v.IsZero() {
			return
		}

		f.Arg = v.Format(util.SQL_TIMESTAMP)
	default:
		if reflect.ValueOf(f.Arg).IsZero() {
			return
		}
	}

	if strings.ToUpper(f.Op) == "IN" {
		var items []string

		if val.Kind() == reflect.Slice || val.Kind() == reflect.Array {
			for i := 0; i < val.Len(); i++ {
				items = append(items, fmt.Sprintf("'%v'", val.Index(i).Interface()))
			}
			f.Arg = fmt.Sprintf("(%s)", strings.Join(items, ", "))

			qb.whereConditions = append(qb.whereConditions, fmt.Sprintf("%s %s %s", column, f.Op, f.Arg))
			return
		}
	}

	qb.whereConditions = append(qb.whereConditions, fmt.Sprintf("%s %v '%v'", column, f.Op, f.Arg))
}

func (qb *QueryFiltersBuilder) checkOperator(operator ...string) string {
	op := ""
	if len(operator) > 0 {
		op = operator[0]
	}

	return op
}
