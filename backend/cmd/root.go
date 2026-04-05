package cmd

import (
	"flag"
	"fmt"
	"os"

	"github.com/goawwer/codinate/pkg/debug"
)

var (
	serveCmd    = flag.NewFlagSet("serve", flag.ExitOnError)
	serveConfig = serveCmd.String("config", "", "Path to .env config file (development only)")

	createOwnerCmd      = flag.NewFlagSet("create_owner", flag.ExitOnError)
	createOwnerConfig   = createOwnerCmd.String("config", "", "Path to .env config file (development only)")
	createOwnerName     = createOwnerCmd.String("name", "", "owner's name")
	createOwnerSurname  = createOwnerCmd.String("surname", "", "owner's surname")
	createOwnerEmail    = createOwnerCmd.String("email", "", "owner's email")
	createOwnerUsername = createOwnerCmd.String("username", "", "owner's username")
	createOwnerPassword = createOwnerCmd.String("password", "", "owner's password")
)

func Execute() {
	execute()
}

func execute() {
	if len(os.Args) <= 1 {
		usage("Command not provided")
	}

	switch os.Args[1] {
	case "serve":
		serveCmd.Parse(os.Args[2:])
		validateConfigIfDevelopmentMode(*serveConfig)
		serve(*serveConfig)

	case "create_owner":
		createOwnerCmd.Parse(os.Args[2:])
		fmt.Printf("Args: %v\n", os.Args)
		validateConfigIfDevelopmentMode(*createOwnerConfig)
		createOwner(ownerParams{
			cfgPath:  *createOwnerConfig,
			name:     *createOwnerName,
			surname:  *createOwnerSurname,
			email:    *createOwnerEmail,
			username: *createOwnerUsername,
			password: *createOwnerPassword,
		})

	default:
		fmt.Fprintf(os.Stderr, "Unknown command: %s\n", os.Args[1])
		usage("")
		os.Exit(1)
	}
}

func usage(message string) {
	if message != "" {
		fmt.Println(message)
	}
	fmt.Println("Usage: [command] [options]")
	fmt.Println("\nCommands:")
	fmt.Println("  serve          Start the application server")
	fmt.Println("  create_owner   Create initial owner user")
	fmt.Println("\nOptions (development only):")
	fmt.Println("  -config PATH  Path to .env file (default: ../.env)")
	os.Exit(1)
}

func validateConfigIfDevelopmentMode(configPath string) {
	if debug.IsEnabled && configPath == "" {
		usage("Config path is required for development mode")
	}
}
