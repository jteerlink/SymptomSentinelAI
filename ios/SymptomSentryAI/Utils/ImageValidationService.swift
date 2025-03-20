import Foundation
import UIKit

/// Service for validating images before upload or analysis
class ImageValidationService {
    static let shared = ImageValidationService()
    
    // Default size limit of 5MB
    private let defaultMaxSizeBytes = 5 * 1024 * 1024
    
    // Allowed MIME types
    private let allowedMimeTypes = ["image/jpeg", "image/png"]
    
    private init() {}
    
    /// Validate image size and format
    /// - Parameters:
    ///   - image: The UIImage to validate
    ///   - maxSizeBytes: Maximum allowed size in bytes (default: 5MB)
    /// - Returns: A tuple containing (isValid, errorMessage)
    func validateImage(_ image: UIImage, maxSizeBytes: Int? = nil) -> (isValid: Bool, errorMessage: String?) {
        // Check for size limit
        let sizeLimit = maxSizeBytes ?? defaultMaxSizeBytes
        
        // Try JPEG format first (usually smaller)
        if let jpegData = image.jpegData(compressionQuality: 0.8) {
            // Check size
            if jpegData.count > sizeLimit {
                return (false, "Image is too large. Maximum size is 5MB.")
            }
            return (true, nil)
        }
        
        // Try PNG as fallback
        if let pngData = image.pngData() {
            // Check size
            if pngData.count > sizeLimit {
                return (false, "Image is too large. Maximum size is 5MB.")
            }
            return (true, nil)
        }
        
        // If we get here, the image format is not supported
        return (false, "Unsupported image format. Please use JPEG or PNG images.")
    }
    
    /// Get the image data in an appropriate format (JPEG or PNG)
    /// - Parameters:
    ///   - image: The UIImage to convert to data
    ///   - preferredFormat: The preferred format (.jpeg or .png)
    ///   - compressionQuality: JPEG compression quality (0.0 to 1.0)
    /// - Returns: Image data in the appropriate format, or nil if conversion failed
    func getImageData(from image: UIImage, preferredFormat: ImageFormat = .jpeg, compressionQuality: CGFloat = 0.8) -> Data? {
        switch preferredFormat {
        case .jpeg:
            if let jpegData = image.jpegData(compressionQuality: compressionQuality) {
                return jpegData
            }
            // Fall back to PNG if JPEG fails
            return image.pngData()
            
        case .png:
            if let pngData = image.pngData() {
                return pngData
            }
            // Fall back to JPEG if PNG fails
            return image.jpegData(compressionQuality: compressionQuality)
        }
    }
    
    /// Resize an image to fit within a maximum dimension while preserving aspect ratio
    /// - Parameters:
    ///   - image: The image to resize
    ///   - maxDimension: The maximum width or height
    /// - Returns: The resized image
    func resizeImage(_ image: UIImage, maxDimension: CGFloat) -> UIImage {
        let originalSize = image.size
        var newSize = originalSize
        
        // Calculate the new size while preserving aspect ratio
        if originalSize.width > maxDimension || originalSize.height > maxDimension {
            let widthRatio = maxDimension / originalSize.width
            let heightRatio = maxDimension / originalSize.height
            
            // Use the smaller ratio to ensure both dimensions are within the limit
            let ratio = min(widthRatio, heightRatio)
            
            newSize = CGSize(width: originalSize.width * ratio, height: originalSize.height * ratio)
        }
        
        // No need to resize if the image is already smaller than the max dimension
        if newSize == originalSize {
            return image
        }
        
        // Render the new image
        let renderer = UIGraphicsImageRenderer(size: newSize)
        return renderer.image { context in
            image.draw(in: CGRect(origin: .zero, size: newSize))
        }
    }
    
    /// Detect the MIME type of image data
    /// - Parameter data: The image data
    /// - Returns: The MIME type or nil if not a supported image format
    func detectMimeType(from data: Data) -> String? {
        var headerBytes = [UInt8](repeating: 0, count: 8)
        data.copyBytes(to: &headerBytes, count: min(8, data.count))
        
        // Check for JPEG header (starts with FF D8 FF)
        if headerBytes[0] == 0xFF && headerBytes[1] == 0xD8 && headerBytes[2] == 0xFF {
            return "image/jpeg"
        }
        
        // Check for PNG header (89 50 4E 47 0D 0A 1A 0A)
        if headerBytes[0] == 0x89 && headerBytes[1] == 0x50 && headerBytes[2] == 0x4E && headerBytes[3] == 0x47 {
            return "image/png"
        }
        
        return nil
    }
    
    /// Check if the data is a valid image format
    /// - Parameter data: The data to check
    /// - Returns: True if the data is a valid image format, false otherwise
    func isValidImageFormat(_ data: Data) -> Bool {
        guard let mimeType = detectMimeType(from: data) else {
            return false
        }
        
        return allowedMimeTypes.contains(mimeType)
    }
}

/// Image format enum
enum ImageFormat {
    case jpeg
    case png
}

/// Image validation error enum
enum ImageValidationError: Error {
    case invalidFormat
    case tooLarge
    case processingFailed
    
    var localizedDescription: String {
        switch self {
        case .invalidFormat:
            return "Unsupported image format. Please use JPEG or PNG images."
        case .tooLarge:
            return "Image is too large. Maximum size is 5MB."
        case .processingFailed:
            return "Failed to process the image. Please try another image."
        }
    }
}