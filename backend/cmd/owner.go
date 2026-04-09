package cmd

import (
	"context"
	"fmt"

	"github.com/goawwer/codinate/config"
	"github.com/goawwer/codinate/internal/adapter/database"
	models "github.com/goawwer/codinate/internal/adapter/model"
	"github.com/goawwer/codinate/internal/adapter/repository"
	"github.com/goawwer/codinate/pkg/logger"
	"github.com/goawwer/codinate/pkg/util"
)

type ownerParams struct {
	cfgPath  string
	name     string
	surname  string
	email    string
	username string
	password string
}

func createOwner(params ownerParams) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	config.Initialize(params.cfgPath)
	logger.Initialize()

	if err := database.Initialize(ctx); err != nil {
		logger.Fatalf("serve function: %v", err)
	}

	defer func() {
		database.CloseMasterDatabase()
	}()

	hashedPassword, err := util.CreateHashPassword(params.password)
	if err != nil {
		logger.Errorf("failed to generate hash for password: %v", err)
		panic("failed to generate hash for password")
	}

	if err := repository.GetUserRepo().CreateUser(ctx, &models.User{
		Name:           params.name,
		Surname:        params.surname,
		Username:       params.username,
		Email:          params.email,
		HashedPassword: hashedPassword,
		Role:           "owner",
	}); err != nil {
		panic(fmt.Sprintf("failed to create owner: %v", err))
	}

	logger.Debug("Owner successfully created")
}
