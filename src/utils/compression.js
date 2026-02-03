import imageCompression from 'browser-image-compression'

/**
 * Handles file compression before upload
 */
export const compressFile = async (file) => {
    // 1. Check if it's an image
    if (file.type && file.type.startsWith('image/')) {
        try {
            console.log(`Original size: ${file.size / 1024 / 1024} MB`)

            const options = {
                maxSizeMB: 1.0,          // Max size 1MB
                maxWidthOrHeight: 1920,  // Resize large images
                useWebWorker: true,      // Run in background
                initialQuality: 0.8      // Good quality retention
            }

            const compressedFile = await imageCompression(file, options)

            console.log(`Compressed size: ${compressedFile.size / 1024 / 1024} MB`)

            // Should be smaller, else return original
            if (compressedFile.size < file.size) {
                return compressedFile
            }
        } catch (error) {
            console.error('Compression failed:', error)
            // Fallback to original
        }
    }

    // Return original if not image or compression failed/useless
    return file
}
