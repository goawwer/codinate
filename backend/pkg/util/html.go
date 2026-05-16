package util

import (
	"strings"

	"github.com/google/uuid"
	"golang.org/x/net/html"
)

// ExtractMentionIDs parses an HTML body produced by the rich-text editor and
// returns the unique user IDs found in mention spans
// (<span data-type="mention" data-user="<uuid>">) .
func ExtractMentionIDs(body string) []uuid.UUID {
	if body == "" {
		return nil
	}

	doc, err := html.Parse(strings.NewReader(body))
	if err != nil {
		return nil
	}

	seen := make(map[uuid.UUID]struct{})
	var ids []uuid.UUID

	var walk func(*html.Node)
	walk = func(n *html.Node) {
		if n.Type == html.ElementNode && n.Data == "span" {
			var dataType, dataUser string
			for _, attr := range n.Attr {
				switch attr.Key {
				case "data-type":
					dataType = attr.Val
				case "data-user":
					dataUser = attr.Val
				}
			}
			if dataType == "mention" && dataUser != "" {
				if id, err := uuid.Parse(dataUser); err == nil {
					if _, dup := seen[id]; !dup {
						seen[id] = struct{}{}
						ids = append(ids, id)
					}
				}
			}
		}
		for c := n.FirstChild; c != nil; c = c.NextSibling {
			walk(c)
		}
	}
	walk(doc)

	return ids
}
