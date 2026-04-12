package user

func resolveDisabledState(v string) *bool {
	switch v {
	case "true":
		b := true
		return &b
	case "false":
		b := false
		return &b
	default:
		return nil
	}
}
