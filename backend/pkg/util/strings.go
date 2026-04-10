package util

import "unicode"

func IsAnyStringEmpty(s ...string) bool {
	for idx := range s {
		if len(s[idx]) == 0 {
			return true
		}
	}

	return false
}

func StringUncapitalize(str string) string {
	for i, v := range str {
		return string(unicode.ToLower(v)) + str[i+1:]
	}
	return ""
}

func StringCapitalize(str string) string {
	for i, v := range str {
		return string(unicode.ToUpper(v)) + str[i+1:]
	}
	return ""
}
