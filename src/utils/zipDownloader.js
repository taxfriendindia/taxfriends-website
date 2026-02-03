import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { FolderService } from '../services/folderService'

export const downloadFolderAsZip = async (userId, folderId = null, folderName = 'documents') => {
    try {
        const zip = new JSZip()

        // Helper to recursively fetch and add to zip
        const addToZip = async (currentFolderId, currentPath) => {
            // 1. Get Files in this folder
            const files = await FolderService.getFilesInFolder(currentFolderId, userId)

            for (const file of files) {
                try {
                    // Get signed URL for download
                    const signedUrl = await FolderService.getSignedUrl(file.file_url, { download: true })

                    // Fetch blob
                    const response = await fetch(signedUrl)
                    const blob = await response.blob()

                    // Add to zip
                    currentPath.file(file.file_name, blob)
                } catch (err) {
                    console.error(`Failed to download file ${file.file_name}:`, err)
                    currentPath.file(`${file.file_name}.txt`, `Error downloading file: ${err.message}`)
                }
            }

            // 2. Get Subfolders
            const folders = await FolderService.getUserFolders(userId, currentFolderId)

            for (const folder of folders) {
                const folderRef = currentPath.folder(folder.name)
                await addToZip(folder.id, folderRef)
            }
        }

        await addToZip(folderId, zip)

        // Generate and save
        const content = await zip.generateAsync({ type: 'blob' })
        saveAs(content, `${folderName}.zip`)

    } catch (error) {
        console.error('Zip generation failed:', error)
        throw error
    }
}
