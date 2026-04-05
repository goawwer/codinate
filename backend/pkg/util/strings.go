package util

func IsAnyStringEmpty(s ...string) bool {
	for idx := range s {
		if len(s[idx]) == 0 {
			return true
		}
	}

	return false
}
