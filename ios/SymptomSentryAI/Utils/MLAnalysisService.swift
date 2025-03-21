import Foundation
import UIKit
import Combine

/// Service responsible for handling medical image analysis using the ML backend
class MLAnalysisService: ObservableObject {
    /// Shared instance of the service
    static let shared = MLAnalysisService()
    
    /// Network service for API communication
    private let networkService = NetworkService.shared
    
    /// Analysis types supported by the system
    enum AnalysisType: String, CaseIterable, Identifiable {
        case throat = "throat"
        case ear = "ear"
        
        var id: String { self.rawValue }
        
        var displayName: String {
            switch self {
            case .throat: return "Throat"
            case .ear: return "Ear"
            }
        }
        
        var description: String {
            switch self {
            case .throat: return "Analyze throat images for potential conditions like strep throat or tonsillitis"
            case .ear: return "Analyze ear images for potential conditions like ear infections or blockages"
            }
        }
        
        var iconName: String {
            switch self {
            case .throat: return "waveform.path"
            case .ear: return "ear"
            }
        }
    }
    
    /// Publishers for analysis state
    @Published var isAnalyzing = false
    @Published var analysisError: Error?
    @Published var lastAnalysisResult: AnalysisResponse?
    
    /// Analyze an image and return the result
    /// - Parameters:
    ///   - image: The image to analyze
    ///   - type: The type of analysis to perform
    /// - Returns: A publisher that emits the analysis result or an error
    func analyzeImage(_ image: UIImage, type: AnalysisType) -> AnyPublisher<AnalysisResponse, Error> {
        guard let imageData = image.jpegData(compressionQuality: 0.8) else {
            return Fail(error: NSError(domain: "MLAnalysisService", code: 1, userInfo: [NSLocalizedDescriptionKey: "Failed to convert image to data"]))
                .eraseToAnyPublisher()
        }
        
        isAnalyzing = true
        analysisError = nil
        
        // Prepare the form data for the request
        let parameters = [
            "type": type.rawValue
        ]
        
        return networkService.uploadImage(imageData, to: "/api/analyze", parameters: parameters)
            .decode(type: AnalysisResponse.self, decoder: JSONDecoder())
            .handleEvents(receiveOutput: { [weak self] result in
                self?.isAnalyzing = false
                self?.lastAnalysisResult = result
            }, receiveCompletion: { [weak self] completion in
                self?.isAnalyzing = false
                if case .failure(let error) = completion {
                    self?.analysisError = error
                }
            })
            .eraseToAnyPublisher()
    }
    
    /// Cancel any ongoing analysis
    func cancelAnalysis() {
        // Cancel any pending network requests
        networkService.cancelAllRequests()
        isAnalyzing = false
    }
    
    /// Get the history of analyses for the current user
    /// - Returns: A publisher that emits an array of analysis responses or an error
    /// - Note: This method is maintained for backward compatibility, use AnalysisService instead
    func getAnalysisHistory() -> AnyPublisher<[AnalysisResponse], Error> {
        // Simply return the current analyses from the AnalysisService wrapped in a publisher
        return Just(AnalysisService.shared.savedAnalyses)
            .setFailureType(to: Error.self)
            .eraseToAnyPublisher()
    }
    
    /// Delete an analysis from history
    /// - Parameter id: The ID of the analysis to delete
    /// - Returns: A publisher that completes when the deletion is successful or emits an error
    /// - Note: This method is maintained for backward compatibility, use AnalysisService instead
    func deleteAnalysis(id: String) -> AnyPublisher<Void, Error> {
        // Delegate to the AnalysisService
        return AnalysisService.shared.deleteAnalysis(id: id)
    }
}

/// Network service error
enum NetworkError: Error, LocalizedError {
    case invalidURL
    case invalidResponse
    case httpError(statusCode: Int, message: String)
    case decodingError(Error)
    case connectionError(Error)
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .invalidResponse:
            return "Invalid response"
        case .httpError(let statusCode, let message):
            return "HTTP Error \(statusCode): \(message)"
        case .decodingError:
            return "Error decoding response"
        case .connectionError:
            return "Connection error"
        }
    }
}