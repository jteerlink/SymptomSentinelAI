import Foundation
import UIKit
import CoreML
import Vision

/// Service for handling ML model operations and image analysis
class MLAnalysisService {
    static let shared = MLAnalysisService()
    
    // MARK: - Properties
    
    /// Network service for API requests
    private let networkService = NetworkService.shared
    
    /// Base URL for API requests
    private let baseUrl = "https://api.symptomsentry.com/v1"
    
    /// Types of analyses available
    enum AnalysisType: String {
        case throat = "Throat"
        case ear = "Ear"
    }
    
    // MARK: - Initialization
    
    private init() {}
    
    // MARK: - Public Methods
    
    /// Analyze an image for potential medical conditions
    /// - Parameters:
    ///   - image: The image to analyze
    ///   - type: The type of analysis (throat/ear)
    ///   - completion: Callback with results or error
    func analyzeImage(image: UIImage, type: String, completion: @escaping (Result<[AnalysisCondition], Error>) -> Void) {
        // Validate image
        let validator = ImageValidationService.shared
        let validationResult = validator.validateImage(image)
        
        if !validationResult.isValid {
            completion(.failure(NSError(
                domain: "MLAnalysisService",
                code: 400,
                userInfo: [NSLocalizedDescriptionKey: validationResult.errorMessage ?? "Invalid image"]
            )))
            return
        }
        
        // Perform on-device analysis for immediate feedback
        performLocalAnalysis(image: image, type: type) { [weak self] localResult in
            guard let self = self else { return }
            
            switch localResult {
            case .success(let localConditions):
                // Return the local results
                completion(.success(localConditions))
                
                // In background, also try the cloud API for more accurate results
                // In a real app, we'd update the UI when cloud results are ready
                self.performCloudAnalysis(image: image, type: type) { _ in
                    // This would update the results in a real app
                }
                
            case .failure(let error):
                // If local analysis fails, try the cloud API
                self.performCloudAnalysis(image: image, type: type) { cloudResult in
                    switch cloudResult {
                    case .success(let cloudConditions):
                        completion(.success(cloudConditions))
                    case .failure(let cloudError):
                        // If both local and cloud analysis fail, return the cloud error
                        completion(.failure(cloudError))
                    }
                }
            }
        }
    }
    
    // Overload for the enum type version
    func analyzeImage(image: UIImage, type: AnalysisType, completion: @escaping (Result<[AnalysisCondition], Error>) -> Void) {
        analyzeImage(image: image, type: type.rawValue.lowercased(), completion: completion)
    }
    
    // MARK: - Private Methods
    
    private func performLocalAnalysis(image: UIImage, type: String, completion: @escaping (Result<[AnalysisCondition], Error>) -> Void) {
        // Here we would use Core ML to analyze the image
        // For this demo, we'll create simulated results
        
        // Simulate processing delay
        DispatchQueue.global().asyncAfter(deadline: .now() + 1.5) {
            // Create mock analysis results
            let mockConditions = self.createMockAnalysisResults(for: type)
            completion(.success(mockConditions))
        }
    }
    
    private func performCloudAnalysis(image: UIImage, type: String, completion: @escaping (Result<[AnalysisCondition], Error>) -> Void) {
        // Get image data
        guard let imageData = ImageValidationService.shared.getImageData(from: image) else {
            completion(.failure(NSError(
                domain: "MLAnalysisService",
                code: 400,
                userInfo: [NSLocalizedDescriptionKey: "Failed to process image data"]
            )))
            return
        }
        
        // Create multipart form data
        let formData = MultipartFormData()
        formData.append(type, name: "type")
        formData.append(imageData, name: "image", fileName: "image.jpg", mimeType: "image/jpeg")
        formData.finalize()
        
        // Make API request
        let url = "\(baseUrl)/analyze"
        networkService.uploadRequest(url: url, method: "POST", data: formData.data, headers: [
            "Content-Type": "multipart/form-data; boundary=\(formData.boundary)"
        ]) { result in
            switch result {
            case .success(let data):
                do {
                    // Parse JSON response
                    if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                       let conditionsData = json["conditions"] as? [[String: Any]] {
                        
                        // Create condition objects
                        var conditions: [AnalysisCondition] = []
                        for conditionData in conditionsData {
                            if let name = conditionData["name"] as? String,
                               let confidence = conditionData["confidence"] as? Double,
                               let description = conditionData["description"] as? String,
                               let severityString = conditionData["severity"] as? String,
                               let severity = ConditionSeverity(rawValue: severityString),
                               let recommendation = conditionData["recommendation"] as? String {
                                
                                let condition = AnalysisCondition(
                                    id: UUID().uuidString,
                                    name: name,
                                    confidence: confidence,
                                    description: description,
                                    severity: severity,
                                    recommendation: recommendation
                                )
                                conditions.append(condition)
                            }
                        }
                        
                        completion(.success(conditions))
                    } else {
                        completion(.failure(NSError(
                            domain: "MLAnalysisService",
                            code: 500,
                            userInfo: [NSLocalizedDescriptionKey: "Invalid API response format"]
                        )))
                    }
                } catch {
                    completion(.failure(error))
                }
                
            case .failure(let error):
                completion(.failure(error))
            }
        }
    }
    
    /// Create mock analysis results for demonstration purposes
    private func createMockAnalysisResults(for type: String) -> [AnalysisCondition] {
        var conditions: [AnalysisCondition] = []
        
        if type.lowercased() == "throat" {
            // Throat conditions
            conditions = [
                AnalysisCondition(
                    id: UUID().uuidString,
                    name: "Strep Throat",
                    confidence: 0.82,
                    description: "Strep throat is a bacterial infection that causes inflammation and pain in the throat.",
                    severity: .moderate,
                    recommendation: "Consider seeing a doctor for a strep test and possible antibiotics."
                ),
                AnalysisCondition(
                    id: UUID().uuidString,
                    name: "Tonsillitis",
                    confidence: 0.67,
                    description: "Inflammation of the tonsils, typically causing sore throat, difficulty swallowing, and swollen lymph nodes.",
                    severity: .moderate,
                    recommendation: "Rest, drink fluids, and consider seeing a doctor if symptoms persist."
                ),
                AnalysisCondition(
                    id: UUID().uuidString,
                    name: "Common Cold",
                    confidence: 0.45,
                    description: "Viral infection causing sore throat, congestion, and cough.",
                    severity: .mild,
                    recommendation: "Rest, stay hydrated, and use over-the-counter medications for symptom relief."
                )
            ]
        } else if type.lowercased() == "ear" {
            // Ear conditions
            conditions = [
                AnalysisCondition(
                    id: UUID().uuidString,
                    name: "Otitis Media",
                    confidence: 0.76,
                    description: "Middle ear infection often caused by bacteria or viruses.",
                    severity: .moderate,
                    recommendation: "Consult a doctor, especially if pain is severe or persists."
                ),
                AnalysisCondition(
                    id: UUID().uuidString,
                    name: "Earwax Buildup",
                    confidence: 0.89,
                    description: "Excessive earwax accumulation that can cause hearing difficulty.",
                    severity: .mild,
                    recommendation: "Consider over-the-counter earwax removal drops or see a healthcare provider."
                ),
                AnalysisCondition(
                    id: UUID().uuidString,
                    name: "Swimmer's Ear",
                    confidence: 0.42,
                    description: "Infection of the outer ear canal often caused by water exposure.",
                    severity: .moderate,
                    recommendation: "Keep ear dry, use prescribed ear drops if available, see doctor if pain increases."
                )
            ]
        }
        
        // Sort by confidence (highest first)
        return conditions.sorted { $0.confidence > $1.confidence }
    }
}

// MARK: - MultipartFormData

/// Helper class for creating multipart form data for API requests
class MultipartFormData {
    var data = Data()
    let boundary: String
    
    init() {
        boundary = "Boundary-\(UUID().uuidString)"
    }
    
    /// Add a text field to the form data
    func append(_ value: String, name: String) {
        data.append("--\(boundary)\r\n".data(using: .utf8)!)
        data.append("Content-Disposition: form-data; name=\"\(name)\"\r\n\r\n".data(using: .utf8)!)
        data.append("\(value)\r\n".data(using: .utf8)!)
    }
    
    /// Add a file to the form data
    func append(_ fileData: Data, name: String, fileName: String, mimeType: String) {
        data.append("--\(boundary)\r\n".data(using: .utf8)!)
        data.append("Content-Disposition: form-data; name=\"\(name)\"; filename=\"\(fileName)\"\r\n".data(using: .utf8)!)
        data.append("Content-Type: \(mimeType)\r\n\r\n".data(using: .utf8)!)
        data.append(fileData)
        data.append("\r\n".data(using: .utf8)!)
    }
    
    /// Finalize the form data
    func finalize() {
        data.append("--\(boundary)--\r\n".data(using: .utf8)!)
    }
}