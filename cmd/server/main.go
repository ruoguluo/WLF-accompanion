package main

import (
    "log"
    "net/http"
    "os"
    "wlfaccompanion/internal/server"
    "github.com/joho/godotenv"
)

func main() {
    _ = godotenv.Load()
    port := os.Getenv("PORT")
    if port == "" {
        port = "3001"
    }
    r := server.Router()
    s := &http.Server{Addr: ":" + port, Handler: r}
    log.Printf("Go server ready on port %s", port)
    if err := s.ListenAndServe(); err != nil {
        log.Fatal(err)
    }
}