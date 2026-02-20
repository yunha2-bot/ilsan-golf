-- AlterTable: 갤러리 이미지를 DB(LONGBLOB)에 저장할 수 있도록 컬럼 추가. 기존 항목은 filePath로 유지
ALTER TABLE `GalleryItem` ADD COLUMN `fileData` LONGBLOB NULL,
    ADD COLUMN `contentType` VARCHAR(191) NULL,
    MODIFY COLUMN `filePath` VARCHAR(191) NOT NULL DEFAULT '';
