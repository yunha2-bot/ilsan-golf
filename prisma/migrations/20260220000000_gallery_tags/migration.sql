-- 갤러리 태그(앨범/필터) 컬럼 추가
ALTER TABLE `GalleryItem` ADD COLUMN `tags` VARCHAR(500) NOT NULL DEFAULT '';
