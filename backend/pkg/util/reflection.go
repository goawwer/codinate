package util

import (
	"reflect"
	"strings"
)

func LookForTagOption(tag reflect.StructTag, key string, option string) (string, bool) {
	tagValue, ok := tag.Lookup(key)
	if !ok {
		return "", false
	}

	tagValue = strings.ReplaceAll(tagValue, " ", "")
	tagValueSplit := strings.Split(tagValue, ",")
	for _, tagOption := range tagValueSplit {
		index := strings.Index(tagOption, option)
		if index == -1 {
			continue
		}

		result := tagOption[(index + len(option)):]
		if strings.HasPrefix(result, ":") {
			return result[1:], true
		}
		return result, true
	}

	return "", false
}
