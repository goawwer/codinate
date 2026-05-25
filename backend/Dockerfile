FROM golang:1.25-alpine AS builder

WORKDIR /build

COPY go.mod go.sum ./
RUN go mod download

# Install golang-migrate for running migrations at startup
RUN go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build \
    -tags prod \
    -ldflags="-s -w" \
    -o codinate-backend .

FROM alpine:3.21

RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app

COPY --from=builder /build/codinate-backend .
COPY --from=builder /root/go/bin/migrate /usr/local/bin/migrate
COPY --from=builder /build/internal/adapter/migrations ./migrations
COPY docker-entrypoint.sh .
RUN chmod +x docker-entrypoint.sh

RUN mkdir -p /app/logs /app/data

EXPOSE 8080

ENTRYPOINT ["./docker-entrypoint.sh"]
