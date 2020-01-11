package main

import (
  "fmt"
  "log"
  "os"

  "github.com/urfave/cli"
)

func main() {
  app := cli.NewApp()
  app.Name = "hello"
  app.Usage = "Says hi to you."
  app.Action = func(c *cli.Context) error {
    fmt.Println("Hi!")
    return nil
  }

  err := app.Run(os.Args)
  if err != nil {
    log.Fatal(err)
  }
}