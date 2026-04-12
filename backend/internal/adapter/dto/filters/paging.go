package filters

type Page struct {
	Number      int  `json:"pageNumber"`
	Size        int  `json:"pageSize"`
	NoPageLimit bool `json:"noPageLimit"`
}

func NewPaging(number, size int) *Page {
	return &Page{
		Number: number,
		Size:   size,
	}
}

func (p *Page) GetOffset() int {
	if p.Number <= 1 || p.Size < 0 {
		return 0
	}

	return (p.Number - 1) * p.Size
}

func (p *Page) GetLimit() int {
	if p.Size > 0 {
		if p.Size > 100 && !p.NoPageLimit {
			return 100
		}

		return p.Size
	}

	return 20
}
