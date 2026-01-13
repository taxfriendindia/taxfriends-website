import imageCompression from 'browser-image-compression';

export const compressFile = async (file) => {
    // If not an image, we can't compress it easily client-side with this library
    if (!file.type.startsWith('image/')) {
        return file;
    }

    const options = {
        maxSizeMB: 2, // Target 2MB max
        maxWidthOrHeight: 2048,
        useWebWorker: true,
        initialQuality: 0.8
    };

    try {
        console.log(`Original size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
        const compressedBlob = await imageCompression(file, options);

        // Convert Blob back to File to maintain metadata
        const compressedFile = new File([compressedBlob], file.name, {
            type: file.type,
            lastModified: Date.now(),
        });

        console.log(`Compressed size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
        return compressedFile;
    } catch (error) {
        console.error('Compression Error:', error);
        return file; // Return original on failure
    }
};
