package server

import (
    "archive/zip"
    "bytes"
    "errors"
    "io"
    "regexp"
    "os"
    "os/exec"
    pdflib "github.com/ledongthuc/pdf"
)

var tagRegex = regexp.MustCompile(`<[^>]+>`)

func ExtractText(ext string, data []byte) (string, error) {
    switch ext {
    case ".txt":
        return string(data), nil
    case ".docx":
        return extractDocx(data)
    case ".pdf":
        if txt, err := extractPdfViaPdftotext(data); err == nil {
            return txt, nil
        }
        return extractPdfViaLibrary(data)
    default:
        return "", errors.New("unsupported file type")
    }
}

func extractDocx(data []byte) (string, error) {
    r := bytes.NewReader(data)
    zr, err := zip.NewReader(r, int64(len(data)))
    if err != nil { return "", err }
    for _, f := range zr.File {
        if f.Name == "word/document.xml" {
            rc, err := f.Open()
            if err != nil { return "", err }
            defer rc.Close()
            b, err := io.ReadAll(rc)
            if err != nil { return "", err }
            s := string(b)
            s = tagRegex.ReplaceAllString(s, " ")
            return s, nil
        }
    }
    return "", errors.New("document.xml not found")
}

func extractPdfViaPdftotext(data []byte) (string, error) {
    // Resolve pdftotext path from env, PATH, or common install locations
    if custom := os.Getenv("PDFTOTEXT_PATH"); custom != "" {
        if _, statErr := os.Stat(custom); statErr == nil {
            return runPdftotext(custom, data)
        }
    }
    pdftotextPath, err := exec.LookPath("pdftotext")
    if err != nil {
        // Homebrew default on Apple Silicon
        if _, statErr := os.Stat("/opt/homebrew/bin/pdftotext"); statErr == nil {
            return runPdftotext("/opt/homebrew/bin/pdftotext", data)
        } else if _, statErr := os.Stat("/usr/local/bin/pdftotext"); statErr == nil { // Intel macOS default
            return runPdftotext("/usr/local/bin/pdftotext", data)
        } else {
            return "", errors.New("pdftotext not found. Please install poppler to enable PDF support")
        }
    }
    return runPdftotext(pdftotextPath, data)
}

func runPdftotext(pdftotextPath string, data []byte) (string, error) {
    tmp, err := os.CreateTemp("", "resume-*.pdf")
    if err != nil { return "", err }
    defer os.Remove(tmp.Name())
    if _, err := tmp.Write(data); err != nil { tmp.Close(); return "", err }
    tmp.Close()
    cmd := exec.Command(pdftotextPath, "-layout", tmp.Name(), "-")
    out, err := cmd.Output()
    if err != nil { return "", err }
    return string(out), nil
}

func extractPdfViaLibrary(data []byte) (string, error) {
    tmp, err := os.CreateTemp("", "resume-*.pdf")
    if err != nil { return "", err }
    defer os.Remove(tmp.Name())
    if _, err := tmp.Write(data); err != nil { tmp.Close(); return "", err }
    tmp.Close()

    f, rdr, err := pdflib.Open(tmp.Name())
    if err != nil { return "", err }
    defer f.Close()

    var buf bytes.Buffer
    r, err := rdr.GetPlainText()
    if err != nil { return "", err }
    _, _ = buf.ReadFrom(r)
    return buf.String(), nil
}