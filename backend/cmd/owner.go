package cmd

import (
	"context"
	"fmt"
	"os"

	"github.com/goawwer/codinate/config"
	"github.com/goawwer/codinate/internal/adapter/database"
	models "github.com/goawwer/codinate/internal/adapter/model"
	"github.com/goawwer/codinate/internal/adapter/model/enum"
	"github.com/goawwer/codinate/internal/adapter/repository"
	"github.com/goawwer/codinate/pkg/logger"
	"github.com/goawwer/codinate/pkg/util"
	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
	"golang.org/x/term"
)

func createOwner(cfgPath string) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	config.Initialize(cfgPath)
	logger.Initialize()
	logger.SetConsoleMinLevel(logrus.WarnLevel)

	name := viper.GetString("OWNER_NAME")
	surname := viper.GetString("OWNER_SURNAME")
	username := viper.GetString("OWNER_USERNAME")
	email := viper.GetString("OWNER_EMAIL")

	if name == "" || surname == "" || username == "" || email == "" {
		fmt.Println("Error: OWNER_NAME, OWNER_SURNAME, OWNER_USERNAME, OWNER_EMAIL must be set in .env")
		return
	}

	fmt.Printf("Creating owner: %s %s (%s)\n", name, surname, email)
	fmt.Print("Password: ")
	passwordBytes, err := term.ReadPassword(int(os.Stdin.Fd()))
	fmt.Println()
	if err != nil {
		fmt.Printf("Error reading password: %v\n", err)
		return
	}
	if len(passwordBytes) == 0 {
		fmt.Println("Error: password cannot be empty")
		return
	}

	if err := database.Initialize(ctx); err != nil {
		logger.Fatalf("serve function: %v", err)
	}
	defer database.CloseMasterDatabase()

	hashedPassword, err := util.CreateHashPassword(string(passwordBytes))
	if err != nil {
		fmt.Printf("Error: failed to hash password: %v\n", err)
		return
	}

	if err := repository.GetUserRepo().Create(ctx, &models.User{
		Name:           name,
		Surname:        surname,
		Username:       username,
		Email:          email,
		HashedPassword: hashedPassword,
		Permission:     enum.OwnerPermissionRole,
		RoleId:         1,
	}); err != nil {
		fmt.Printf("Error: failed to create owner: %v\n", err)
		return
	}

	fmt.Println("Owner successfully created")
}
