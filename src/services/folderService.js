import { supabase } from '../lib/supabase'
import { compressFile } from '../utils/compression'

/**
 * FolderService - Handles all folder and file management operations
 * Provides CRUD operations for the flexible folder/file system
 */
export const FolderService = {
    /**
     * Get all folders for a user, optionally filtered by parent
     * @param {string} userId - User UUID
     * @param {string|null} parentId - Parent folder UUID (null for root folders)
     * @returns {Promise<Array>} Array of folder objects
     */
    async getUserFolders(userId, parentId = null) {
        try {
            let query = supabase
                .from('user_folders')
                .select('*')
                .eq('user_id', userId)
                .order('name', { ascending: true })

            if (parentId === null) {
                query = query.is('parent_folder_id', null)
            } else {
                query = query.eq('parent_folder_id', parentId)
            }

            const { data, error } = await query

            if (error) throw error
            return data || []
        } catch (error) {
            console.error('Error fetching folders:', error)
            throw error
        }
    },

    /**
     * Get a single folder by ID with file count
     * @param {string} folderId - Folder UUID
     * @returns {Promise<Object>} Folder object with metadata
     */
    async getFolder(folderId) {
        try {
            const { data, error } = await supabase
                .from('user_folders')
                .select('*')
                .eq('id', folderId)
                .single()

            if (error) throw error

            // Get file count
            const { count } = await supabase
                .from('service_records')
                .select('*', { count: 'exact', head: true })
                .eq('folder_id', folderId)

            return { ...data, file_count: count || 0 }
        } catch (error) {
            console.error('Error fetching folder:', error)
            throw error
        }
    },

    /**
     * Create a new folder
     * @param {string} userId - User UUID
     * @param {string} name - Folder name
     * @param {string|null} parentId - Parent folder UUID (null for root)
     * @param {string} color - Folder color (hex code)
     * @param {string} icon - Lucide icon name
     * @returns {Promise<Object>} Created folder object
     */
    async createFolder(userId, name, parentId = null, color = '#4F46E5', icon = 'Folder') {
        try {
            // Validate folder name
            if (!name || name.trim().length === 0) {
                throw new Error('Folder name cannot be empty')
            }

            // Check for duplicate folder name in same location
            const { data: existing } = await supabase
                .from('user_folders')
                .select('id')
                .eq('user_id', userId)
                .eq('name', name.trim())
                .is('parent_folder_id', parentId)
                .maybeSingle()

            if (existing) {
                throw new Error(`A folder named "${name}" already exists in this location`)
            }

            const { data, error } = await supabase
                .from('user_folders')
                .insert([{
                    user_id: userId,
                    name: name.trim(),
                    parent_folder_id: parentId,
                    color: color,
                    icon: icon
                }])
                .select()
                .single()

            if (error) throw error
            return data
        } catch (error) {
            console.error('Error creating folder:', error)
            throw error
        }
    },

    /**
     * Rename a folder
     * @param {string} folderId - Folder UUID
     * @param {string} newName - New folder name
     * @returns {Promise<Object>} Updated folder object
     */
    async renameFolder(folderId, newName) {
        try {
            if (!newName || newName.trim().length === 0) {
                throw new Error('Folder name cannot be empty')
            }

            const { data, error } = await supabase
                .from('user_folders')
                .update({ name: newName.trim() })
                .eq('id', folderId)
                .select()
                .single()

            if (error) throw error
            return data
        } catch (error) {
            console.error('Error renaming folder:', error)
            throw error
        }
    },

    /**
     * Update folder color
     * @param {string} folderId - Folder UUID
     * @param {string} color - New color (hex code)
     * @returns {Promise<Object>} Updated folder object
     */
    async updateFolderColor(folderId, color) {
        try {
            const { data, error } = await supabase
                .from('user_folders')
                .update({ color })
                .eq('id', folderId)
                .select()
                .single()

            if (error) throw error
            return data
        } catch (error) {
            console.error('Error updating folder color:', error)
            throw error
        }
    },

    /**
     * Update folder icon
     * @param {string} folderId - Folder UUID
     * @param {string} icon - Lucide icon name
     * @returns {Promise<Object>} Updated folder object
     */
    async updateFolderIcon(folderId, icon) {
        try {
            const { data, error } = await supabase
                .from('user_folders')
                .update({ icon })
                .eq('id', folderId)
                .select()
                .single()

            if (error) throw error
            return data
        } catch (error) {
            console.error('Error updating folder icon:', error)
            throw error
        }
    },

    /**
     * Delete a folder (and optionally its contents)
     * @param {string} folderId - Folder UUID
     * @param {boolean} recursive - If true, delete folder contents recursively
     * @returns {Promise<void>}
     */
    async deleteFolder(folderId, recursive = true) {
        try {
            if (!recursive) {
                // Check if folder has files or subfolders
                const { count: fileCount } = await supabase
                    .from('service_records')
                    .select('*', { count: 'exact', head: true })
                    .eq('folder_id', folderId)

                const { count: subfolderCount } = await supabase
                    .from('user_folders')
                    .select('*', { count: 'exact', head: true })
                    .eq('parent_folder_id', folderId)

                if (fileCount > 0 || subfolderCount > 0) {
                    throw new Error('Folder is not empty. Move or delete contents first.')
                }
            }

            // Delete folder (cascades to files and subfolders due to DB constraints)
            const { error } = await supabase
                .from('user_folders')
                .delete()
                .eq('id', folderId)

            if (error) throw error
        } catch (error) {
            console.error('Error deleting folder:', error)
            throw error
        }
    },

    /**
     * Get all files in a folder
     * @param {string|null} folderId - Folder UUID (null for root files)
     * @param {string} userId - User UUID
     * @returns {Promise<Array>} Array of file objects
     */
    async getFilesInFolder(folderId, userId) {
        try {
            let query = supabase
                .from('service_records')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })

            if (folderId === null) {
                query = query.is('folder_id', null)
            } else {
                query = query.eq('folder_id', folderId)
            }

            const { data, error } = await query

            if (error) throw error
            return data || []
        } catch (error) {
            console.error('Error fetching files:', error)
            throw error
        }
    },

    /**
     * Upload a file to a folder
     * @param {string} userId - User UUID
     * @param {string|null} folderId - Folder UUID (null for root)
     * @param {File} file - File object to upload
     * @param {Object} metadata - Additional file metadata
     * @returns {Promise<Object>} Created file record
     */
    async uploadFile(userId, folderId, file, metadata = {}) {
        try {
            // Compress file if possible (e.g. images)
            const fileToUpload = await compressFile(file)

            // Upload to Supabase Storage
            const fileExt = fileToUpload.name.split('.').pop()
            const fileName = `${userId}/files/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('service-archives')
                .upload(fileName, fileToUpload)

            if (uploadError) throw uploadError

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('service-archives')
                .getPublicUrl(fileName)

            // Create file record
            const { data, error } = await supabase
                .from('service_records')
                .insert([{
                    user_id: userId,
                    folder_id: folderId,
                    file_name: file.name, // Keep original name
                    file_url: publicUrl,
                    file_size: fileToUpload.size, // Use new compressed size
                    file_type: fileToUpload.type,
                    tags: metadata.tags || [],
                    description: metadata.description || null,
                    domain: metadata.domain || null,
                    service_names: metadata.service_names || [],
                    sub_type: metadata.sub_type || null,
                    year_type: metadata.year_type || null,
                    year: metadata.year || null,
                    uploaded_by: userId
                }])
                .select()
                .single()

            if (error) throw error
            return data
        } catch (error) {
            console.error('Error uploading file:', error)
            throw error
        }
    },

    /**
     * Move a file to a different folder
     * @param {string} fileId - File UUID
     * @param {string|null} targetFolderId - Target folder UUID (null for root)
     * @returns {Promise<Object>} Updated file object
     */
    async moveFile(fileId, targetFolderId) {
        try {
            const { data, error } = await supabase
                .from('service_records')
                .update({ folder_id: targetFolderId })
                .eq('id', fileId)
                .select()
                .single()

            if (error) throw error
            return data
        } catch (error) {
            console.error('Error moving file:', error)
            throw error
        }
    },

    /**
     * Move multiple files to a folder
     * @param {Array<string>} fileIds - Array of file UUIDs
     * @param {string|null} targetFolderId - Target folder UUID (null for root)
     * @returns {Promise<Array>} Updated file objects
     */
    async moveMultipleFiles(fileIds, targetFolderId) {
        try {
            const { data, error } = await supabase
                .from('service_records')
                .update({ folder_id: targetFolderId })
                .in('id', fileIds)
                .select()

            if (error) throw error
            return data || []
        } catch (error) {
            console.error('Error moving files:', error)
            throw error
        }
    },

    /**
     * Rename a file
     * @param {string} fileId - File UUID
     * @param {string} newName - New file name
     * @returns {Promise<Object>} Updated file object
     */
    async renameFile(fileId, newName) {
        try {
            if (!newName || newName.trim().length === 0) {
                throw new Error('File name cannot be empty')
            }

            const { data, error } = await supabase
                .from('service_records')
                .update({ file_name: newName.trim() })
                .eq('id', fileId)
                .select()
                .single()

            if (error) throw error
            return data
        } catch (error) {
            console.error('Error renaming file:', error)
            throw error
        }
    },

    /**
     * Update file tags
     * @param {string} fileId - File UUID
     * @param {Array<string>} tags - Array of tag strings
     * @returns {Promise<Object>} Updated file object
     */
    async updateFileTags(fileId, tags) {
        try {
            const { data, error } = await supabase
                .from('service_records')
                .update({ tags })
                .eq('id', fileId)
                .select()
                .single()

            if (error) throw error
            return data
        } catch (error) {
            console.error('Error updating file tags:', error)
            throw error
        }
    },

    /**
     * Delete a file (and remove from storage)
     * @param {string} fileId - File UUID
     * @param {string} fileUrl - File URL for storage deletion
     * @returns {Promise<void>}
     */
    async deleteFile(fileId, fileUrl) {
        try {
            // Delete from storage
            if (fileUrl && fileUrl.includes('service-archives')) {
                const decoded = decodeURIComponent(fileUrl)
                const parts = decoded.split('/service-archives/')
                if (parts.length > 1) {
                    const storagePath = parts[1].split('?')[0]
                    await supabase.storage
                        .from('service-archives')
                        .remove([storagePath])
                }
            }

            // Delete from database
            const { error } = await supabase
                .from('service_records')
                .delete()
                .eq('id', fileId)

            if (error) throw error
        } catch (error) {
            console.error('Error deleting file:', error)
            throw error
        }
    },

    /**
     * Search files by name, tags, or description
     * @param {string} userId - User UUID
     * @param {string} query - Search query
     * @returns {Promise<Array>} Matching files
     */
    async searchFiles(userId, query) {
        try {
            const searchTerm = `%${query.toLowerCase()}%`

            const { data, error } = await supabase
                .from('service_records')
                .select('*')
                .eq('user_id', userId)
                .or(`file_name.ilike.${searchTerm},description.ilike.${searchTerm}`)
                .order('created_at', { ascending: false })

            if (error) throw error
            return data || []
        } catch (error) {
            console.error('Error searching files:', error)
            throw error
        }
    },

    /**
     * Get a signed URL for a file (valid for 1 hour)
     * @param {string} filePathUrl - Full URL or path of the file
     * @returns {Promise<string>} Signed URL
     */
    async getSignedUrl(filePathUrl, options = {}) {
        try {
            if (!filePathUrl) return ''

            // Extract path from URL if needed
            let path = filePathUrl
            if (filePathUrl.includes('service-archives')) {
                const parts = filePathUrl.split('/service-archives/')
                if (parts.length > 1) path = parts[1]
            } else if (filePathUrl.includes('user-documents')) {
                const parts = filePathUrl.split('/user-documents/')
                if (parts.length > 1) path = parts[1]
            }

            // Clean path (remove query params if any)
            path = path.split('?')[0]

            const { data, error } = await supabase.storage
                .from('service-archives')
                .createSignedUrl(path, 3600, options) // 1 hour validity, passed options (e.g. download)

            if (error) throw error
            return data.signedUrl
        } catch (error) {
            console.error('Error getting signed URL:', error)
            return filePathUrl // Fallback to original if fail
        }
    },

    /**
     * Get folder breadcrumb path
     * @param {string} folderId - Folder UUID
     * @returns {Promise<Array>} Array of folder objects from root to target
     */
    async getFolderPath(folderId) {
        try {
            if (!folderId) return [{ id: null, name: 'Root' }]

            const path = []
            let currentId = folderId

            while (currentId) {
                const { data, error } = await supabase
                    .from('user_folders')
                    .select('id, name, parent_folder_id')
                    .eq('id', currentId)
                    .single()

                if (error) throw error

                path.unshift(data)
                currentId = data.parent_folder_id
            }

            path.unshift({ id: null, name: 'Root' })
            return path
        } catch (error) {
            console.error('Error getting folder path:', error)
            throw error
        }
    }
}
