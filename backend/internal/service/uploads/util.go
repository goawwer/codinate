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

func SaveFileOnServer(file multipart.File, header *multipart.FileHeader, entityType string, fileId uuid.UUID) (string, error) {
	defer func() {
		if err := file.Close(); err != nil {
			logger.Errorf("failed to close file while saving on server: %v", err)
		}
	}()

	filename := fmt.Sprintf("%s-%d%s", fileId, time.Now().Unix(), filepath.Ext(header.Filename))
	fileDir := filepath.Join(viper.GetString("UPLOADS_DIR"), "files", entityType)
	filePath := filepath.Join(fileDir, filepath.Base(filename))

	if err := os.MkdirAll(fileDir, 0777); err != nil {
		return "", err
	}

	dst, err := os.OpenFile(filePath, os.O_CREATE|os.O_RDWR, 0644)
	if err != nil {
		return "", err
	}
	defer dst.Close()

	if _, err = io.Copy(dst, file); err != nil {
		_ = os.Remove(filePath)
		return "", err
	}

	return filename, nil
}

func SaveImageFileOnServer(file multipart.File, header *multipart.FileHeader, entityType string, fileId uuid.UUID) (string, error) {
	defer func() {
		if err := file.Close(); err != nil {
			logger.Errorf("failed to close file while saving on server: %v", err)
		}
	}()

	filename := fmt.Sprintf("%s-%d%s", fileId, time.Now().Unix(), filepath.Ext(header.Filename))
	imageDir := filepath.Join(viper.GetString("UPLOADS_DIR"), "pictures", entityType)
	imagePath := filepath.Join(imageDir, filepath.Base(filename))

	if err := os.MkdirAll(imageDir, 0777); err != nil {
		return "", err
	}

	findCommand := exec.Command("find", ".", "-name", fmt.Sprintf("%d-*.*", fileId), "-delete")
	findCommand.Dir = imageDir
	if err := findCommand.Run(); err != nil && !errors.Is(err, exec.ErrNotFound) {
		return "", err
	}

	dst, err := os.OpenFile(imagePath, os.O_CREATE|os.O_RDWR, 0644)
	if err != nil {
		return "", err
	}

	defer dst.Close()

	if err = compressImageDependingOnExtension(file, header, dst, viper.GetInt("UPLOADS_PICTURE_MAX_WIDTH"), viper.GetInt("UPLOADS_PICTURE_MAX_HEIGHT")); err != nil {
		_ = os.Remove(imagePath)
		return "", err
	}

	return filename, nil
}

func compressImageDependingOnExtension(file multipart.File, header *multipart.FileHeader, w io.Writer, width int, height int) error {
	var err error
	var src image.Image
	mime := header.Header.Get("Content-Type")

	switch mime {
	case "image/jpeg":
		src, err = jpeg.Decode(file)
	case "image/png":
		src, err = png.Decode(file)
	case "image/gif":
		src, err = gif.Decode(file)
	default:
		return fmt.Errorf("image compression for mime type %s is not implemented", mime)
	}
	if err != nil {
		return err
	}

	resized := image.NewRGBA(image.Rect(0, 0, width, height))

	draw.CatmullRom.Scale(resized, resized.Bounds(), src, src.Bounds(), draw.Over, nil)

	switch mime {
	case "image/jpeg":
		err = jpeg.Encode(w, resized, &jpeg.Options{Quality: 80})
		return err
	case "image/png":
		return png.Encode(w, resized)
	default:
		return gif.Encode(w, resized, nil)
	}
}
