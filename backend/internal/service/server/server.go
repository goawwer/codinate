package server

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/goawwer/codinate/internal/controller/router"
	"github.com/goawwer/codinate/pkg/logger"
	"github.com/spf13/viper"
)

type config struct {
	Host        string `mapstructure:"SERV_HOST"`
	Port        int    `mapstructure:"SERV_PORT"`
	RedirectUrl string `mapstructure:"SERV_REDIRECT_URL"`
}

type Server struct {
	*http.Server
}

func New(ctx context.Context) (*Server, error) {
	cfg, err := loadServerConfig()
	if err != nil {
		return nil, err
	}

	approuter := router.InitializeAppRouter()

	srv := http.Server{
		Addr:    fmt.Sprintf("%s:%d", cfg.Host, cfg.Port),
		Handler: approuter,
	}

	return &Server{&srv}, nil
}

func (s *Server) Start(ctx context.Context) {
	go func() {
		logger.Debugf("Server started at addr: %s", s.Addr)

		if err := s.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Fatalf("Error on server: %v", err)
		}
	}()

	sig := make(chan os.Signal, 1)
	signal.Notify(sig, os.Interrupt, syscall.SIGTERM)

	select {
	case <-ctx.Done():
		logger.Info("shutdown by parent context")
	case <-sig:
		logger.Info("shutdown by termination signal, init graceful shutdown")
	}

	shutDownCtx, cancel := context.WithTimeout(context.Background(), time.Second*5)
	defer cancel()

	if err := s.Shutdown(shutDownCtx); err != nil {
		if errors.Is(err, context.DeadlineExceeded) {
			logger.Info("graceful shutdown timed out")
		} else {
			logger.Errorf("failed to graceful shutdown: %v", err)
		}
	} else {
		logger.Info("graceful shutdown complete")
	}
}

func loadServerConfig() (*config, error) {
	var cfg config

	if err := viper.Unmarshal(&cfg); err != nil {
		logger.Errorf("failed to load server config: %v", err)
		return nil, err
	}

	return &cfg, nil
}
