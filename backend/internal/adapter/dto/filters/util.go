package filters

import "strings"

func resolveSortingDirection(dir string) string {
	if strings.EqualFold(dir, "desc") {
		return "DESC"
	}

	return "ASC"
}
