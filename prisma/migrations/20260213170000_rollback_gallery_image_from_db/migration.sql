-- Rollback: 갤러리 이미지 DB 저장 취소. fileData·contentType 제거, filePath 복원
ALTER TABLE `GalleryItem` DROP COLUMN `fileData`,
    DROP COLUMN `contentType`,
    MODIFY COLUMN `filePath` VARCHAR(191) NOT NULL;
