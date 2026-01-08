import { supabase } from '../lib/supabase'

export const DocumentService = {
    // Fetch logs for a specific user (Client Portal)
    async getUserDocuments(userId) {
        try {
            const { data, error } = await supabase
                .from('user_documents')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })

            if (error) throw error
            return data || []
        } catch (e) {
            console.error('Error fetching user docs:', e)
            return []
        }
    },

    // Fetch ALL logs (Admin Portal)
    async getAllDocuments() {
        try {
            const { data, error } = await supabase
                .from('user_documents')
                .select(`
                    *,
                    profiles:user_id (full_name, email, mobile, organization)
                `)
                .order('created_at', { ascending: false })

            if (error) throw error
            return data || []
        } catch (e) {
            console.error('Error fetching all docs:', e)
            return []
        }
    },

    // Log that a user sent a file via Email
    async logEmailDocument(userId, fileName, docType = 'email_attachment') {
        try {
            const { data, error } = await supabase
                .from('user_documents')
                .insert([
                    {
                        user_id: userId,
                        name: fileName,
                        doc_type: docType,
                        file_url: 'sent_via_email',
                        status: 'pending'
                    }
                ])
                .select()

            if (error) throw error
            return data
        } catch (e) {
            console.error("Supabase log failed", e)
            throw e
        }
    },

    // Upload to Supabase Storage with dynamic folder structure
    async uploadFile(userId, file, profileData) {
        try {
            // 1. Construct Folder Name
            let folderName = ''
            const cleanName = (profileData.full_name || 'User').replace(/[^a-zA-Z0-9]/g, '_')

            if (profileData.organization) {
                const cleanOrg = profileData.organization.replace(/[^a-zA-Z0-9]/g, '_')
                folderName = `${cleanOrg}_${cleanName}`
            } else {
                folderName = cleanName
            }

            // 2. Construct File Path
            const timestamp = Date.now()
            const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_')
            const filePath = `${userId}/${folderName}/${timestamp}_${cleanFileName}`

            // 3. Upload to 'user-documents' bucket
            const { data, error } = await supabase.storage
                .from('user-documents')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                })

            if (error) throw error

            // 4. Generate URL (Signed for 10 years access)
            const { data: signedData } = await supabase.storage
                .from('user-documents')
                .createSignedUrl(filePath, 315360000)

            const publicUrl = signedData?.signedUrl

            // 5. Record in DB
            const { data: docRecord, error: dbError } = await supabase
                .from('user_documents')
                .insert([{
                    user_id: userId,
                    name: file.name,
                    file_url: publicUrl,
                    status: 'pending',
                    doc_type: 'uploaded'
                }])
                .select()

            if (dbError) throw dbError
            return docRecord[0]

        } catch (e) {
            console.error('Upload Error:', e)
            throw e
        }
    },

    // Upload completed work for a service
    async uploadCompletedServiceFile(userId, serviceRequestId, file, profileData) {
        try {
            const cleanName = (profileData.full_name || 'User').replace(/[^a-zA-Z0-9]/g, '_')
            const timestamp = Date.now()
            const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_')
            const filePath = `${userId}/COMPLETED/${serviceRequestId}/${timestamp}_${cleanFileName}`

            const { data, error } = await supabase.storage
                .from('user-documents')
                .upload(filePath, file)

            if (error) throw error

            const { data: signedData } = await supabase.storage
                .from('user-documents')
                .createSignedUrl(filePath, 315360000)

            const publicUrl = signedData?.signedUrl

            // Update the service request with the file URL
            const { error: dbError } = await supabase
                .from('user_services')
                .update({ completed_file_url: publicUrl, status: 'completed' })
                .eq('id', serviceRequestId)

            if (dbError) throw dbError
            return publicUrl

        } catch (e) {
            console.error('Work Upload Error:', e)
            throw e
        }
    },

    async deleteDocument(id, fileUrl) {
        try {
            // 1. If file stored in Supabase (not just email log), delete from Storage first
            // URL pattern: .../client-docs/FOLDER/FILE?token...
            // Or signed url: /storage/v1/object/sign/client-docs/...

            if (fileUrl && fileUrl.includes('user-documents')) {
                // Try to extract path
                // Decode URI component to handle %20 etc
                const decoded = decodeURIComponent(fileUrl)

                // Typical Signed URL: https://.../storage/v1/object/sign/user-documents/Folder/File?token=...
                // We need 'Folder/File'
                const parts = decoded.split('/user-documents/')
                if (parts.length > 1) {
                    // Take the part after user-documents/ and before '?'
                    let storagePath = parts[1].split('?')[0]

                    const { error: storageError } = await supabase.storage
                        .from('user-documents')
                        .remove([storagePath])

                    if (storageError) console.warn("Storage delete warning:", storageError)
                }
            }

            // 2. Delete from DB
            const { error } = await supabase
                .from('user_documents')
                .delete()
                .eq('id', id)

            if (error) throw error
        } catch (e) {
            console.error('Error deleting doc:', e)
            throw e
        }
    },

    // Download files as ZIP
    async downloadAsZip(documents, zipName = 'documents') {
        try {
            const JSZip = (await import('jszip')).default
            const { saveAs } = (await import('file-saver'))

            const zip = new JSZip()
            const folder = zip.folder("Documents")

            let count = 0
            const promises = documents
                .filter(doc => doc.file_url && doc.file_url !== 'sent_via_email')
                .map(async (doc) => {
                    try {
                        // Use CORS mode to allow fetching from Supabase Storage
                        const response = await fetch(doc.file_url, { mode: 'cors' })
                        if (!response.ok) throw new Error(`HTTP ${response.status}`)
                        const blob = await response.blob()
                        const fileName = doc.name || `doc_${doc.id}.pdf`
                        folder.file(fileName, blob)
                        count++
                    } catch (err) {
                        console.error("Failed to download file for zip:", doc.name, err)
                        folder.file(`${doc.name}_ERROR.txt`, `Failed to download: ${err.message}`)
                    }
                })

            await Promise.all(promises)

            if (count > 0) {
                const content = await zip.generateAsync({ type: "blob" })
                saveAs(content, `${zipName}_taxfriendindia.zip`)
            } else {
                alert("No accessible files found to zip. Check console for errors. (CORS or Invalid URL)")
            }

        } catch (e) {
            console.error("Zip Error:", e)
            alert(`Failed to create Zip: ${e.message}. Ensure 'jszip' is loaded.`)
        }
    }
}
