import Foundation
import UIKit
import Combine

/// Service responsible for handling medical analysis data persistence and retrieval
class AnalysisService: ObservableObject {
    /// Shared instance
    static let shared = AnalysisService()
    
    /// Network service for API communication
    private let networkService = NetworkService.shared
    
    /// ML analysis service for image processing
    private let mlService = MLAnalysisService.shared
    
    /// Cancellable storage
    private var cancellables = Set<AnyCancellable>()
    
    /// Published properties
    @Published var savedAnalyses: [AnalysisResponse] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    /// User defaults keys
    private enum UserDefaultsKeys {
        static let localAnalyses = "localSavedAnalyses"
    }
    
    /// Private initializer for singleton
    private init() {
        // Load any locally saved analyses
        loadLocalAnalyses()
        
        // Observe authentication state to load server-side analyses when signed in
        UserService.shared.$isAuthenticated
            .sink { [weak self] isAuthenticated in
                if isAuthenticated {
                    self?.loadAnalysesFromServer()
                }
            }
            .store(in: &cancellables)
    }
    
    /// Analyze an image using the MLAnalysisService and save the result
    /// - Parameters:
    ///   - image: The image to analyze
    ///   - type: The type of analysis to perform
    /// - Returns: A publisher that emits the analysis result or an error
    func analyzeAndSaveImage(_ image: UIImage, type: MLAnalysisService.AnalysisType) -> AnyPublisher<AnalysisResponse, Error> {
        return mlService.analyzeImage(image, type: type)
            .flatMap { [weak self] response -> AnyPublisher<AnalysisResponse, Error> in
                guard let self = self else {
                    return Fail(error: NSError(domain: "AnalysisService", code: 1, 
                                              userInfo: [NSLocalizedDescriptionKey: "Service unavailable"]))
                        .eraseToAnyPublisher()
                }
                
                // Save analysis locally first for immediate feedback
                self.saveAnalysisLocally(response)
                
                // If user is authenticated, save to server as well
                if UserService.shared.isAuthenticated {
                    return self.saveAnalysisToServer(response)
                        .map { _ in response }
                        .eraseToAnyPublisher()
                } else {
                    return Just(response)
                        .setFailureType(to: Error.self)
                        .eraseToAnyPublisher()
                }
            }
            .eraseToAnyPublisher()
    }
    
    /// Save an analysis result to the server
    /// - Parameter analysis: The analysis response to save
    /// - Returns: A publisher that completes when the save is successful or emits an error
    private func saveAnalysisToServer(_ analysis: AnalysisResponse) -> AnyPublisher<Void, Error> {
        let parameters: [String: Any] = [
            "id": analysis.id,
            "type": analysis.type,
            "timestamp": analysis.timestamp,
            "conditions": analysis.conditions.map { condition in
                return [
                    "id": condition.id,
                    "name": condition.name,
                    "description": condition.description,
                    "confidence": condition.confidence,
                    "symptoms": condition.symptoms,
                    "isPotentiallySerious": condition.isPotentiallySerious
                ]
            }
        ]
        
        return networkService.request(
            endpoint: "/api/save-analysis",
            method: .post,
            parameters: parameters
        )
        .map { _ in () }
        .eraseToAnyPublisher()
    }
    
    /// Load all analyses from the server
    private func loadAnalysesFromServer() {
        guard UserService.shared.isAuthenticated else { return }
        
        isLoading = true
        errorMessage = nil
        
        networkService.request(
            endpoint: "/api/analysis-history",
            method: .get,
            parameters: nil
        )
        .decode(type: AnalysisListResponse.self, decoder: JSONDecoder())
        .receive(on: DispatchQueue.main)
        .sink(
            receiveCompletion: { [weak self] completion in
                guard let self = self else { return }
                self.isLoading = false
                
                if case .failure(let error) = completion {
                    self.errorMessage = error.localizedDescription
                }
            },
            receiveValue: { [weak self] response in
                guard let self = self else { return }
                self.isLoading = false
                
                // Merge server analyses with local ones
                let serverAnalysisIds = Set(response.analyses.map { $0.id })
                let localAnalysesToKeep = self.savedAnalyses.filter { !serverAnalysisIds.contains($0.id) }
                
                self.savedAnalyses = response.analyses + localAnalysesToKeep
                self.saveAnalysesLocally()
            }
        )
        .store(in: &cancellables)
    }
    
    /// Delete an analysis from the user's history
    /// - Parameter id: The ID of the analysis to delete
    /// - Returns: A publisher that completes when the deletion is successful or emits an error
    func deleteAnalysis(id: String) -> AnyPublisher<Void, Error> {
        // Remove from local cache immediately for responsive UI
        savedAnalyses.removeAll { $0.id == id }
        saveAnalysesLocally()
        
        // If user is authenticated, delete from server as well
        if UserService.shared.isAuthenticated {
            return networkService.request(
                endpoint: "/api/analysis/\(id)",
                method: .delete,
                parameters: nil
            )
            .map { _ in () }
            .eraseToAnyPublisher()
        } else {
            return Just(())
                .setFailureType(to: Error.self)
                .eraseToAnyPublisher()
        }
    }
    
    /// Get analyses filtered by type
    /// - Parameter type: The type of analysis to filter by (nil for all types)
    /// - Returns: Array of filtered analysis responses
    func getAnalyses(forType type: MLAnalysisService.AnalysisType? = nil) -> [AnalysisResponse] {
        if let type = type {
            return savedAnalyses.filter { $0.type == type.rawValue }
        } else {
            return savedAnalyses
        }
    }
    
    /// Refresh analyses from the server
    func refreshAnalyses() {
        loadAnalysesFromServer()
    }
    
    /// Clear all stored analyses
    func clearAllAnalyses() {
        savedAnalyses = []
        UserDefaults.standard.removeObject(forKey: UserDefaultsKeys.localAnalyses)
        
        // If user is authenticated, clear from server as well
        if UserService.shared.isAuthenticated {
            networkService.request(
                endpoint: "/api/clear-analyses",
                method: .post,
                parameters: nil
            )
            .sink(
                receiveCompletion: { _ in },
                receiveValue: { _ in }
            )
            .store(in: &cancellables)
        }
    }
    
    // MARK: - Helper Methods
    
    /// Save an analysis response to the local cache
    /// - Parameter analysis: The analysis response to save
    func saveAnalysisLocally(_ analysis: AnalysisResponse) {
        // Add to the beginning for most recent first
        if let index = savedAnalyses.firstIndex(where: { $0.id == analysis.id }) {
            savedAnalyses[index] = analysis
        } else {
            savedAnalyses.insert(analysis, at: 0)
        }
        
        saveAnalysesLocally()
        
        // If the user is authenticated, save to server as well
        if UserService.shared.isAuthenticated {
            saveAnalysisToServer(analysis)
                .sink(
                    receiveCompletion: { completion in
                        if case .failure(let error) = completion {
                            print("Failed to save analysis to server: \(error.localizedDescription)")
                        }
                    },
                    receiveValue: { _ in
                        print("Analysis saved to server successfully")
                    }
                )
                .store(in: &cancellables)
        }
    }
    
    /// Save all analyses to UserDefaults
    private func saveAnalysesLocally() {
        do {
            let encoder = JSONEncoder()
            let data = try encoder.encode(savedAnalyses)
            UserDefaults.standard.set(data, forKey: UserDefaultsKeys.localAnalyses)
        } catch {
            print("Failed to save analyses locally: \(error.localizedDescription)")
        }
    }
    
    /// Load analyses from UserDefaults
    private func loadLocalAnalyses() {
        guard let data = UserDefaults.standard.data(forKey: UserDefaultsKeys.localAnalyses) else {
            return
        }
        
        do {
            let decoder = JSONDecoder()
            let analyses = try decoder.decode([AnalysisResponse].self, from: data)
            savedAnalyses = analyses
        } catch {
            print("Failed to load analyses from UserDefaults: \(error.localizedDescription)")
        }
    }
}

/// Response model for analysis list
struct AnalysisListResponse: Codable {
    let analyses: [AnalysisResponse]
}