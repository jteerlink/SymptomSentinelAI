import XCTest
@testable import SymptomSentryAI

class ImageUploadTests: XCTestCase {
    
    var imageValidationService: ImageValidationService!
    var networkService: NetworkService!
    var testBundle: Bundle!
    
    override func setUpWithError() throws {
        try super.setUpWithError()
        imageValidationService = ImageValidationService()
        networkService = NetworkService()
        testBundle = Bundle(for: type(of: self))
    }
    
    override func tearDownWithError() throws {
        imageValidationService = nil
        networkService = nil
        testBundle = nil
        try super.tearDownWithError()
    }
    
    // MARK: - Image Validation Tests
    
    func testImageSizeValidation() throws {
        // Test valid image size (under 5MB)
        let validSizeImage = createTestImage(size: 100, color: .blue)
        let validSizeData = validSizeImage.jpegData(compressionQuality: 0.8)!
        
        var result = imageValidationService.validateImageSize(data: validSizeData)
        XCTAssertTrue(result.isValid, "Valid size image should pass validation")
        
        // Generate a large image (over 5MB)
        let largeSizeData = Data(count: 6 * 1024 * 1024) // 6MB of random data
        
        result = imageValidationService.validateImageSize(data: largeSizeData)
        XCTAssertFalse(result.isValid, "Oversized image should fail validation")
        XCTAssertTrue(result.errorMessage?.contains("5MB") ?? false, "Error should mention size limit")
    }
    
    func testImageFormatValidation() throws {
        // Valid JPEG format
        let jpegImage = createTestImage(size: 100, color: .red)
        let jpegData = jpegImage.jpegData(compressionQuality: 0.8)!
        
        var result = imageValidationService.validateImageFormat(data: jpegData)
        XCTAssertTrue(result.isValid, "JPEG image should pass format validation")
        
        // Valid PNG format
        let pngImage = createTestImage(size: 100, color: .green)
        let pngData = pngImage.pngData()!
        
        result = imageValidationService.validateImageFormat(data: pngData)
        XCTAssertTrue(result.isValid, "PNG image should pass format validation")
        
        // Invalid format (text data)
        let invalidData = "This is not an image".data(using: .utf8)!
        
        result = imageValidationService.validateImageFormat(data: invalidData)
        XCTAssertFalse(result.isValid, "Text data should fail format validation")
        XCTAssertTrue(result.errorMessage?.contains("format") ?? false, "Error should mention format issue")
    }
    
    func testValidateFullImage() throws {
        // Create a valid image
        let image = createTestImage(size: 200, color: .blue)
        let imageData = image.jpegData(compressionQuality: 0.8)!
        
        let result = imageValidationService.validateImage(data: imageData)
        XCTAssertTrue(result.isValid, "Valid image should pass full validation")
        XCTAssertNil(result.errorMessage, "No error message for valid image")
    }
    
    // MARK: - Network Upload Tests
    
    func testUploadImageSuccess() throws {
        // Create a mock for NetworkService
        let mockNetworkService = MockNetworkService()
        mockNetworkService.mockUploadResponse = .success(
            UploadResponse(imageUrl: "https://example.com/test.jpg", type: "throat", success: true)
        )
        
        let image = createTestImage(size: 200, color: .red)
        let imageData = image.jpegData(compressionQuality: 0.8)!
        
        let expectation = self.expectation(description: "Upload image")
        
        mockNetworkService.uploadImage(data: imageData, type: "throat") { result in
            switch result {
            case .success(let response):
                XCTAssertTrue(response.success, "Upload should be successful")
                XCTAssertEqual(response.type, "throat", "Type should match")
                XCTAssertFalse(response.imageUrl.isEmpty, "Image URL should not be empty")
            case .failure(let error):
                XCTFail("Upload should not fail: \(error.localizedDescription)")
            }
            expectation.fulfill()
        }
        
        waitForExpectations(timeout: 5, handler: nil)
    }
    
    func testUploadImageFailure() throws {
        // Create a mock for NetworkService
        let mockNetworkService = MockNetworkService()
        mockNetworkService.mockUploadResponse = .failure(NetworkError.serverError("Invalid image format"))
        
        let image = createTestImage(size: 200, color: .red)
        let imageData = image.jpegData(compressionQuality: 0.8)!
        
        let expectation = self.expectation(description: "Upload image failure")
        
        mockNetworkService.uploadImage(data: imageData, type: "throat") { result in
            switch result {
            case .success:
                XCTFail("Upload should fail")
            case .failure(let error):
                if case NetworkError.serverError(let message) = error {
                    XCTAssertEqual(message, "Invalid image format", "Error message should match")
                } else {
                    XCTFail("Unexpected error type: \(error)")
                }
            }
            expectation.fulfill()
        }
        
        waitForExpectations(timeout: 5, handler: nil)
    }
    
    // MARK: - Helper Methods
    
    private func createTestImage(size: CGFloat, color: UIColor) -> UIImage {
        let renderer = UIGraphicsImageRenderer(size: CGSize(width: size, height: size))
        return renderer.image { ctx in
            color.setFill()
            ctx.fill(CGRect(x: 0, y: 0, width: size, height: size))
        }
    }
}

// MARK: - Mock Classes for Testing

class MockNetworkService: NetworkService {
    var mockUploadResponse: Result<UploadResponse, NetworkError>?
    
    override func uploadImage(data: Data, type: String, completion: @escaping (Result<UploadResponse, NetworkError>) -> Void) {
        if let mockResponse = mockUploadResponse {
            completion(mockResponse)
        } else {
            completion(.failure(.networkError("No mock response configured")))
        }
    }
    
    override func getPresignedURL(type: String, fileType: String, completion: @escaping (Result<PresignedURLResponse, NetworkError>) -> Void) {
        completion(.success(PresignedURLResponse(
            presignedUrl: "https://example.com/presigned-url",
            publicUrl: "https://example.com/public-url",
            key: "uploads/throat/test-image.jpg",
            success: true
        )))
    }
}

// Response models to match the backend API
struct UploadResponse: Codable {
    let imageUrl: String
    let type: String
    let success: Bool
    let message: String?
    let timestamp: String?
    
    init(imageUrl: String, type: String, success: Bool, message: String? = nil, timestamp: String? = nil) {
        self.imageUrl = imageUrl
        self.type = type
        self.success = success
        self.message = message
        self.timestamp = timestamp
    }
}

struct PresignedURLResponse: Codable {
    let presignedUrl: String
    let publicUrl: String
    let key: String
    let success: Bool
}