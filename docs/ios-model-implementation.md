# iOS Model Implementation Guide

This document provides the Swift models and structures that should be used to interact with the SymptomSentryAI backend API.

## Data Models

### User Model

```swift
import Foundation

struct User: Codable, Identifiable, Equatable {
    let id: String
    let email: String
    let name: String
    var subscription: SubscriptionType
    var analysisCount: Int
    var lastResetDate: Date?
    
    enum CodingKeys: String, CodingKey {
        case id
        case email
        case name
        case subscription
        case analysisCount
        case lastResetDate
    }
    
    init(id: String, email: String, name: String, subscription: SubscriptionType = .free, 
         analysisCount: Int = 0, lastResetDate: Date? = nil) {
        self.id = id
        self.email = email
        self.name = name
        self.subscription = subscription
        self.analysisCount = analysisCount
        self.lastResetDate = lastResetDate
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        
        id = try container.decode(String.self, forKey: .id)
        email = try container.decode(String.self, forKey: .email)
        name = try container.decode(String.self, forKey: .name)
        
        // Handle different formats for subscription (string or enum)
        if let subscriptionString = try? container.decode(String.self, forKey: .subscription) {
            subscription = SubscriptionType(rawValue: subscriptionString) ?? .free
        } else {
            subscription = try container.decode(SubscriptionType.self, forKey: .subscription)
        }
        
        analysisCount = try container.decode(Int.self, forKey: .analysisCount)
        
        // Handle date decoding with fallback
        if let dateString = try? container.decode(String.self, forKey: .lastResetDate),
           let date = ISO8601DateFormatter().date(from: dateString) {
            lastResetDate = date
        } else {
            lastResetDate = try? container.decode(Date.self, forKey: .lastResetDate)
        }
    }
    
    static func == (lhs: User, rhs: User) -> Bool {
        return lhs.id == rhs.id
    }
}

enum SubscriptionType: String, Codable, Equatable {
    case free = "free"
    case premium = "premium"
    
    var analysisLimit: Int {
        switch self {
        case .free:
            return 5  // 5 analyses per month for free tier
        case .premium:
            return Int.max  // Unlimited analyses for premium tier
        }
    }
    
    var displayName: String {
        switch self {
        case .free:
            return "Basic"
        case .premium:
            return "Premium"
        }
    }
}
```

### Analysis Model

```swift
import Foundation

struct Analysis: Codable, Identifiable, Equatable {
    let id: String
    let type: AnalysisType
    let conditions: [Condition]
    let timestamp: Date
    let userId: String?
    
    enum CodingKeys: String, CodingKey {
        case id
        case type
        case conditions
        case timestamp
        case userId = "user_id"
    }
    
    init(id: String, type: AnalysisType, conditions: [Condition], timestamp: Date = Date(), userId: String? = nil) {
        self.id = id
        self.type = type
        self.conditions = conditions
        self.timestamp = timestamp
        self.userId = userId
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        
        id = try container.decode(String.self, forKey: .id)
        
        // Handle type decoding with fallback
        if let typeString = try? container.decode(String.self, forKey: .type) {
            type = AnalysisType(rawValue: typeString) ?? .throat
        } else {
            type = try container.decode(AnalysisType.self, forKey: .type)
        }
        
        conditions = try container.decode([Condition].self, forKey: .conditions)
        
        // Handle date decoding with fallback
        if let timestampString = try? container.decode(String.self, forKey: .timestamp),
           let date = ISO8601DateFormatter().date(from: timestampString) {
            timestamp = date
        } else if let timeInterval = try? container.decode(TimeInterval.self, forKey: .timestamp) {
            timestamp = Date(timeIntervalSince1970: timeInterval)
        } else {
            timestamp = Date()
        }
        
        userId = try container.decodeIfPresent(String.self, forKey: .userId)
    }
    
    static func == (lhs: Analysis, rhs: Analysis) -> Bool {
        return lhs.id == rhs.id
    }
}

enum AnalysisType: String, Codable, Equatable {
    case throat = "throat"
    case ear = "ear"
    
    var displayName: String {
        switch self {
        case .throat:
            return "Throat"
        case .ear:
            return "Ear"
        }
    }
    
    var imageName: String {
        switch self {
        case .throat:
            return "throat-icon"
        case .ear:
            return "ear-icon"
        }
    }
}
```

### Condition Model

```swift
import Foundation

struct Condition: Codable, Identifiable, Equatable {
    let id: String
    let name: String
    let confidence: Double
    let description: String
    let symptoms: [String]
    let isPotentiallySerious: Bool
    let recommendConsultation: Bool
    let treatmentInfo: String?
    
    enum CodingKeys: String, CodingKey {
        case id
        case name
        case confidence
        case description
        case symptoms
        case isPotentiallySerious
        case recommendConsultation
        case treatmentInfo
    }
    
    var confidencePercentage: String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .percent
        formatter.maximumFractionDigits = 0
        return formatter.string(from: NSNumber(value: confidence)) ?? "\(Int(confidence * 100))%"
    }
    
    var confidenceColor: UIColor {
        switch confidence {
        case 0.8...1.0:
            return UIColor.systemRed
        case 0.6..<0.8:
            return UIColor.systemOrange
        case 0.4..<0.6:
            return UIColor.systemYellow
        default:
            return UIColor.systemGreen
        }
    }
    
    static func == (lhs: Condition, rhs: Condition) -> Bool {
        return lhs.id == rhs.id
    }
}
```

## API Response Models

These models align with the backend API responses and can be used to decode API results.

### Authentication Response Models

```swift
struct AuthResponse: Codable {
    let token: String
    let user: User
}

struct LoginRequest: Codable {
    let email: String
    let password: String
}

struct RegisterRequest: Codable {
    let email: String
    let password: String
    let name: String
}
```

### Analysis Response Models

```swift
struct AnalysisAPIResponse: Codable {
    let id: String?
    let type: String?
    let timestamp: String?
    let conditions: [Condition]?
    let user: String?
    let error: Bool?
    let message: String?
    let debug_info: DebugInfo?
    
    struct DebugInfo: Codable {
        let data_source: String?
        let image_data_length: Int?
        let processing_time: Int?
    }
    
    func toAnalysisResponse() -> AnalysisResponse? {
        guard let id = id,
              let type = type,
              let typeEnum = AnalysisType(rawValue: type),
              let conditions = conditions else {
            return nil
        }
        
        let dateFormatter = ISO8601DateFormatter()
        let date: Date
        if let timestamp = timestamp, let parsedDate = dateFormatter.date(from: timestamp) {
            date = parsedDate
        } else {
            date = Date()
        }
        
        return AnalysisResponse(
            id: id,
            type: typeEnum,
            timestamp: date,
            conditions: conditions,
            userId: user
        )
    }
}

struct AnalysisResponse: Codable {
    let id: String
    let type: AnalysisType
    let timestamp: Date
    let conditions: [Condition]
    let userId: String?
    
    var primaryCondition: Condition? {
        return conditions.first
    }
    
    var secondaryCondition: Condition? {
        return conditions.count > 1 ? conditions[1] : nil
    }
}

struct SaveAnalysisRequest: Codable {
    let id: String
    let type: String
    let conditions: [Condition]
}

struct SaveAnalysisResponse: Codable {
    let message: String
    let analysis: Analysis
    let subscription: SubscriptionStatus
    
    struct SubscriptionStatus: Codable {
        let subscription: String
        let analysisCount: Int
        let analysisLimit: Int
        let analysisRemaining: Int
        let lastResetDate: String
    }
}
```

### User Profile Models

```swift
struct UserProfileResponse: Codable {
    let user: User
}

struct UpdateProfileRequest: Codable {
    let name: String?
    let email: String?
}

struct UpdateSubscriptionRequest: Codable {
    let subscription: String
    let paymentToken: String?
}
```

## Network Service Implementation

```swift
import Foundation
import Combine

class NetworkService {
    private let baseURL: URL
    private let session: URLSession
    private var authToken: String?
    
    init(baseURL: URL, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.session = session
    }
    
    func setAuthToken(_ token: String?) {
        self.authToken = token
    }
    
    // MARK: - JSON Requests
    
    func request<T: Decodable>(
        _ endpoint: String,
        method: HTTPMethod = .get,
        parameters: [String: Any]? = nil,
        headers: [String: String]? = nil
    ) -> AnyPublisher<T, Error> {
        guard let url = URL(string: endpoint, relativeTo: baseURL) else {
            return Fail(error: URLError(.badURL)).eraseToAnyPublisher()
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        
        // Set default headers
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        
        // Add auth token if available
        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        // Add custom headers
        headers?.forEach { key, value in
            request.setValue(value, forHTTPHeaderField: key)
        }
        
        // Add parameters
        if let parameters = parameters {
            do {
                request.httpBody = try JSONSerialization.data(withJSONObject: parameters)
            } catch {
                return Fail(error: error).eraseToAnyPublisher()
            }
        }
        
        return session.dataTaskPublisher(for: request)
            .tryMap { data, response -> Data in
                guard let httpResponse = response as? HTTPURLResponse else {
                    throw URLError(.badServerResponse)
                }
                
                if !(200...299).contains(httpResponse.statusCode) {
                    // Attempt to parse error message from response
                    if let errorResponse = try? JSONDecoder().decode(ErrorResponse.self, from: data) {
                        throw NetworkError.apiError(
                            statusCode: httpResponse.statusCode,
                            message: errorResponse.message
                        )
                    } else {
                        throw NetworkError.httpError(statusCode: httpResponse.statusCode)
                    }
                }
                
                return data
            }
            .decode(type: T.self, decoder: JSONDecoder())
            .eraseToAnyPublisher()
    }
    
    // MARK: - File Upload
    
    func uploadImage(
        _ imageData: Data,
        to endpoint: String,
        parameters: [String: String]? = nil
    ) -> AnyPublisher<Data, Error> {
        guard let url = URL(string: endpoint, relativeTo: baseURL) else {
            return Fail(error: URLError(.badURL)).eraseToAnyPublisher()
        }
        
        // Generate a unique boundary string
        let boundary = "Boundary-\(UUID().uuidString)"
        
        var request = URLRequest(url: url)
        request.httpMethod = HTTPMethod.post.rawValue
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        
        // Add auth token if available
        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        // Prepare the body
        var body = Data()
        
        // Add parameters
        parameters?.forEach { key, value in
            body.append("--\(boundary)\r\n".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"\(key)\"\r\n\r\n".data(using: .utf8)!)
            body.append("\(value)\r\n".data(using: .utf8)!)
        }
        
        // Add image data
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"image\"; filename=\"image.jpg\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: image/jpeg\r\n\r\n".data(using: .utf8)!)
        body.append(imageData)
        body.append("\r\n".data(using: .utf8)!)
        
        // Add final boundary
        body.append("--\(boundary)--\r\n".data(using: .utf8)!)
        
        request.httpBody = body
        
        return session.dataTaskPublisher(for: request)
            .tryMap { data, response -> Data in
                guard let httpResponse = response as? HTTPURLResponse else {
                    throw URLError(.badServerResponse)
                }
                
                if !(200...299).contains(httpResponse.statusCode) {
                    // Attempt to parse error message from response
                    if let errorResponse = try? JSONDecoder().decode(ErrorResponse.self, from: data) {
                        throw NetworkError.apiError(
                            statusCode: httpResponse.statusCode,
                            message: errorResponse.message
                        )
                    } else {
                        throw NetworkError.httpError(statusCode: httpResponse.statusCode)
                    }
                }
                
                return data
            }
            .eraseToAnyPublisher()
    }
}

// MARK: - Supporting Types

enum HTTPMethod: String {
    case get = "GET"
    case post = "POST"
    case put = "PUT"
    case delete = "DELETE"
}

enum NetworkError: Error, LocalizedError {
    case invalidURL
    case httpError(statusCode: Int)
    case apiError(statusCode: Int, message: String)
    case decodingError(Error)
    case unknown(Error)
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .httpError(let statusCode):
            return "HTTP Error: \(statusCode)"
        case .apiError(_, let message):
            return message
        case .decodingError(let error):
            return "Decoding error: \(error.localizedDescription)"
        case .unknown(let error):
            return "Unknown error: \(error.localizedDescription)"
        }
    }
}

struct ErrorResponse: Codable {
    let error: Bool
    let message: String
    let code: String?
    let details: String?
}
```

## Usage Examples

### Authentication

```swift
// Login example
func login(email: String, password: String) -> AnyPublisher<User, Error> {
    let parameters = [
        "email": email,
        "password": password
    ]
    
    return networkService.request("/api/login", method: .post, parameters: parameters)
        .map { (response: AuthResponse) -> User in
            // Save the token for future requests
            self.networkService.setAuthToken(response.token)
            KeychainService.saveToken(response.token)
            
            return response.user
        }
        .eraseToAnyPublisher()
}
```

### Image Analysis

```swift
// Perform image analysis
func analyzeImage(_ image: UIImage, type: AnalysisType) -> AnyPublisher<AnalysisResponse, Error> {
    guard let imageData = image.jpegData(compressionQuality: 0.8) else {
        return Fail(error: NSError(
            domain: "com.symptomsentry.analysis",
            code: 1,
            userInfo: [NSLocalizedDescriptionKey: "Failed to convert image to data"]
        )).eraseToAnyPublisher()
    }
    
    let parameters = [
        "type": type.rawValue
    ]
    
    return networkService.uploadImage(imageData, to: "/api/analyze", parameters: parameters)
        .decode(type: AnalysisAPIResponse.self, decoder: JSONDecoder())
        .tryMap { apiResponse -> AnalysisResponse in
            guard let analysisResponse = apiResponse.toAnalysisResponse() else {
                throw NSError(
                    domain: "com.symptomsentry.analysis",
                    code: 2,
                    userInfo: [NSLocalizedDescriptionKey: apiResponse.message ?? "Analysis failed"]
                )
            }
            return analysisResponse
        }
        .eraseToAnyPublisher()
}
```

### User Profile Management

```swift
// Get user profile
func getUserProfile() -> AnyPublisher<User, Error> {
    return networkService.request("/api/user-profile")
        .map { (response: UserProfileResponse) -> User in
            return response.user
        }
        .eraseToAnyPublisher()
}

// Update user profile
func updateProfile(name: String, email: String) -> AnyPublisher<User, Error> {
    let parameters = [
        "name": name,
        "email": email
    ]
    
    return networkService.request("/api/update-profile", method: .put, parameters: parameters)
        .map { (response: UserProfileResponse) -> User in
            return response.user
        }
        .eraseToAnyPublisher()
}
```

### Subscription Management

```swift
// Update subscription
func updateSubscription(to subscriptionType: SubscriptionType, paymentToken: String) -> AnyPublisher<User, Error> {
    let parameters: [String: Any] = [
        "subscription": subscriptionType.rawValue,
        "paymentToken": paymentToken
    ]
    
    return networkService.request("/api/update-subscription", method: .post, parameters: parameters)
        .map { (response: UserProfileResponse) -> User in
            return response.user
        }
        .eraseToAnyPublisher()
}
```

## Error Handling Best Practices

```swift
// Example of proper error handling in a SwiftUI view
func performImageAnalysis() {
    isLoading = true
    errorMessage = nil
    
    analysisService.analyzeImage(selectedImage, type: selectedType)
        .receive(on: DispatchQueue.main)
        .sink(
            receiveCompletion: { [weak self] completion in
                self?.isLoading = false
                
                if case .failure(let error) = completion {
                    self?.handleAnalysisError(error)
                }
            },
            receiveValue: { [weak self] analysisResponse in
                self?.analysisResult = analysisResponse
                self?.showResults = true
            }
        )
        .store(in: &cancellables)
}

private func handleAnalysisError(_ error: Error) {
    if let networkError = error as? NetworkError {
        switch networkError {
        case .apiError(_, let message):
            errorMessage = message
        case .httpError(let statusCode):
            if statusCode == 429 {
                errorMessage = "You've reached your analysis limit for this month."
            } else {
                errorMessage = "Server error (\(statusCode)). Please try again later."
            }
        default:
            errorMessage = "Network error: \(networkError.localizedDescription)"
        }
    } else {
        errorMessage = "Error: \(error.localizedDescription)"
    }
}