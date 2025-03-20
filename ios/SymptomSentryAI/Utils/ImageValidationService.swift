import Foundation
import UIKit
import Vision

/// Service for validating images before upload and analysis
class ImageValidationService: ObservableObject {
    // MARK: - Constants
    
    /// Maximum allowed image size in bytes (5MB)
    private let maxImageSizeBytes: Int = 5 * 1024 * 1024
    
    /// Minimum required image dimensions (pixels)
    private let minDimension: CGFloat = 640
    
    /// Maximum allowed image dimensions (pixels)
    private let maxDimension: CGFloat = 4096
    
    /// Minimum required image quality/clarity score (0-1)
    private let minQualityScore: Float = 0.4
    
    // MARK: - Types
    
    /// Result of image validation
    struct ValidationResult {
        let isValid: Bool
        let errorMessage: String?
        
        static let valid = ValidationResult(isValid: true, errorMessage: nil)
        
        static func invalid(message: String) -> ValidationResult {
            return ValidationResult(isValid: false, errorMessage: message)
        }
    }
    
    // MARK: - Methods
    
    /// Validate an image for analysis
    /// - Parameter image: The image to validate
    /// - Returns: A validation result
    func validateImage(_ image: UIImage) async -> ValidationResult {
        // Check image size
        if let imageData = image.jpegData(compressionQuality: 0.8) {
            if imageData.count > maxImageSizeBytes {
                return .invalid(message: "Image size exceeds 5MB limit. Please select a smaller image.")
            }
        }
        
        // Check image dimensions
        let dimensions = image.size
        if dimensions.width < minDimension || dimensions.height < minDimension {
            return .invalid(message: "Image is too small. Please select an image with dimensions of at least 640x640 pixels.")
        }
        
        if dimensions.width > maxDimension || dimensions.height > maxDimension {
            return .invalid(message: "Image is too large. Please select an image with dimensions no larger than 4096x4096 pixels.")
        }
        
        // Check image format
        if image.cgImage == nil {
            return .invalid(message: "Invalid image format. Please select a JPEG or PNG image.")
        }
        
        // Check image quality (focus/blur)
        let qualityResult = await checkImageQuality(image)
        if !qualityResult.isValid {
            return qualityResult
        }
        
        return .valid
    }
    
    /// Check the quality (focus/blur) of an image using Vision framework
    /// - Parameter image: The image to check
    /// - Returns: A validation result
    private func checkImageQuality(_ image: UIImage) async -> ValidationResult {
        guard let cgImage = image.cgImage else {
            return .invalid(message: "Unable to process image. Please select another image.")
        }
        
        // Create Vision request to detect blur/sharpness
        let request = VNImageQualityRequest()
        
        let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
        
        do {
            try handler.perform([request])
            
            if let observations = request.results as? [VNImageQualityObservation] {
                // Process quality metrics
                for observation in observations {
                    if observation.quality < minQualityScore {
                        return .invalid(message: "Image is too blurry or low quality. Please capture a clear, well-lit image.")
                    }
                }
            }
            
            return .valid
        } catch {
            // If Vision processing fails, still allow the image but log the error
            print("Image quality analysis failed: \(error.localizedDescription)")
            return .valid
        }
    }
    
    /// Resize an image to make it suitable for upload and analysis
    /// - Parameters:
    ///   - image: The original image
    ///   - maxDimension: The maximum dimension size
    /// - Returns: A resized image
    func resizeImageIfNeeded(_ image: UIImage, maxDimension: CGFloat = 1024) -> UIImage {
        let originalSize = image.size
        
        // If image is already smaller than max dimension, return it as is
        if originalSize.width <= maxDimension && originalSize.height <= maxDimension {
            return image
        }
        
        // Calculate scaling factor to fit within the maximum dimension
        let widthRatio = maxDimension / originalSize.width
        let heightRatio = maxDimension / originalSize.height
        let scaleFactor = min(widthRatio, heightRatio)
        
        let newSize = CGSize(
            width: originalSize.width * scaleFactor,
            height: originalSize.height * scaleFactor
        )
        
        // Create a new resized image
        UIGraphicsBeginImageContextWithOptions(newSize, false, image.scale)
        image.draw(in: CGRect(origin: .zero, size: newSize))
        let resizedImage = UIGraphicsGetImageFromCurrentImageContext() ?? image
        UIGraphicsEndImageContext()
        
        return resizedImage
    }
    
    /// Improve the quality of an image for analysis (contrast, brightness)
    /// - Parameter image: The original image
    /// - Returns: An enhanced image
    func enhanceImageForAnalysis(_ image: UIImage) -> UIImage {
        guard let cgImage = image.cgImage else { return image }
        
        // Create Core Image context
        let context = CIContext()
        let ciImage = CIImage(cgImage: cgImage)
        
        // Apply enhancements: Auto Adjustments
        let filter = CIFilter(name: "CIAutoEnhance")
        filter?.setValue(ciImage, forKey: kCIInputImageKey)
        
        // Get the output image
        guard let outputImage = filter?.outputImage,
              let enhancedCGImage = context.createCGImage(outputImage, from: outputImage.extent) else {
            return image
        }
        
        return UIImage(cgImage: enhancedCGImage, scale: image.scale, orientation: image.imageOrientation)
    }
}