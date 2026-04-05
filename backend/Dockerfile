FROM golang:1.25-alpine AS builder

WORKDIR /build

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Build with debug disabled via linker flag
# -ldflags for loading development .env file or not
RUN CGO_ENABLED=0 GOOS=linux go build \
    -ldflags="-X 'github.com/goawwer/codinate/common/debug.isEnabled=false'" \
    -o codinate-backend .

FROM alpine:latest

RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app

COPY --from=builder /build/codinate-backend .

RUN mkdir -p /app/logs /app/data

EXPOSE 8080

CMD ["./codinate-backend"]
