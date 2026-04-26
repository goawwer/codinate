package uploads

import (
	"errors"
	"fmt"
	"image"
	"image/gif"
	"image/jpeg"
	"image/png"
	"io"
	"mime/multipart"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	"github.com/goawwer/codinate/pkg/logger"
	"github.com/google/uuid"
	"github.com/spf13/viper"
	"golang.org/x/image/draw"
)

var ErrFileTooLarge = errors.New("file size exceeds the allowed limit")

func SaveFile(file multipart.File, header *multipart.FileHeader, entityType, entityId string, fileId uuid.UUID) (string, error) {
	defer closeFile(file)

	maxBytes := viper.GetInt64("UPLOADS_MAX_SIZE_MB") << 20
	filename := fileId.String() + filepath.Ext(header.Filename)
	dir := filepath.Join(viper.GetString("UPLOADS_DIR"), entityType, entityId)
	dstPath := filepath.Join(dir, filename)

	if err := os.MkdirAll(dir, 0777); err != nil {
		return "", err
	}

	dst, err := os.OpenFile(dstPath, os.O_CREATE|os.O_RDWR, 0644)
	if err != nil {
		return "", err
	}
	defer dst.Close()

	n, err := io.Copy(dst, io.LimitReader(file, maxBytes+1))
	if err != nil {
		_ = os.Remove(dstPath)
		return "", err
	}
	if n > maxBytes {
		_ = os.Remove(dstPath)
		return "", ErrFileTooLarge
	}

	return filename, nil
}

func SaveAvatar(file multipart.File, header *multipart.FileHeader, entityType string, fileId uuid.UUID) (string, error) {
	defer closeFile(file)

	filename := fmt.Sprintf("%s-%d%s", fileId, time.Now().Unix(), filepath.Ext(header.Filename))
	dir := filepath.Join(viper.GetString("UPLOADS_DIR"), "avatars", entityType)
	dstPath := filepath.Join(dir, filepath.Base(filename))

	if err := os.MkdirAll(dir, 0777); err != nil {
		return "", err
	}

	findCommand := exec.Command("find", ".", "-name", fmt.Sprintf("%d-*.*", fileId), "-delete")
	findCommand.Dir = dir
	if err := findCommand.Run(); err != nil && !errors.Is(err, exec.ErrNotFound) {
		return "", err
	}

	dst, err := os.OpenFile(dstPath, os.O_CREATE|os.O_RDWR, 0644)
	if err != nil {
		return "", err
	}
	defer dst.Close()

	if err = compressImage(file, header, dst,
		viper.GetInt("UPLOADS_PICTURE_MAX_WIDTH"),
		viper.GetInt("UPLOADS_PICTURE_MAX_HEIGHT"),
	); err != nil {
		_ = os.Remove(dstPath)
		return "", err
	}

	return filename, nil
}

func closeFile(f multipart.File) {
	if err := f.Close(); err != nil {
		logger.Errorf("failed to close uploaded file: %v", err)
	}
}

func compressImage(file multipart.File, header *multipart.FileHeader, w io.Writer, width, height int) error {
	mime := header.Header.Get("Content-Type")

	var (
		src image.Image
		err error
	)

	switch mime {
	case "image/jpeg":
		src, err = jpeg.Decode(file)
	case "image/png":
		src, err = png.Decode(file)
	case "image/gif":
		src, err = gif.Decode(file)
	default:
		return fmt.Errorf("unsupported image type: %s", mime)
	}
	if err != nil {
		return err
	}

	resized := image.NewRGBA(image.Rect(0, 0, width, height))
	draw.CatmullRom.Scale(resized, resized.Bounds(), src, src.Bounds(), draw.Over, nil)

	switch mime {
	case "image/jpeg":
		return jpeg.Encode(w, resized, &jpeg.Options{Quality: 80})
	case "image/png":
		return png.Encode(w, resized)
	default:
		return gif.Encode(w, resized, nil)
	}
}
