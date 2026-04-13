package cmd

import (
	"context"

	"github.com/goawwer/codinate/config"
	"github.com/goawwer/codinate/internal/adapter/database"
	"github.com/goawwer/codinate/internal/service/middleware"
	"github.com/goawwer/codinate/internal/service/server"
	"github.com/goawwer/codinate/internal/service/uploads"
	"github.com/goawwer/codinate/internal/service/worker"
	"github.com/goawwer/codinate/pkg/logger"
)

func serve(configPath string) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	config.Initialize(configPath)
	logger.Initialize()
	middleware.InitializeAuth()

	if err := database.Initialize(ctx); err != nil {
		logger.Fatalf("serve function: %v", err)
	}

	defer func() {
		database.CloseMasterDatabase()
	}()

	srv, err := server.New(ctx)
	if err != nil {
		logger.Errorf("failed to start server: %v", err)
	}

	worker.InitRefreshTokensWorker(ctx)
	uploads.InitializeUploadsDir(ctx)
	srv.Start(ctx)
}
