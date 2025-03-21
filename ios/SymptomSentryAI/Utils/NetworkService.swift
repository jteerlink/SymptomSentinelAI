import Foundation
import Combine
import UIKit

/// Service responsible for making network requests to the backend API
class NetworkService {
    /// Shared instance of the service
    static let shared = NetworkService()
    
    /// Base URL for the API
    #if DEBUG
    private var baseURL = "http://localhost:5000" // Development server URL
    #else
    private var baseURL = "https://api.symptomsentry.ai" // Production API URL
    #endif
    
    /// HTTP request methods
    enum HTTPMethod: String {
        case get = "GET"
        case post = "POST"
        case put = "PUT"
        case delete = "DELETE"
    }
    
    /// Active URL sessions
    private var activeSessions = Set<URLSessionDataTask>()
    
    /// Session configuration
    private let session: URLSession
    
    /// Authorization token
    private var authToken: String?
    
    /// Private initializer for singleton
    private init() {
        let configuration = URLSessionConfiguration.default
        configuration.timeoutIntervalForRequest = 30.0
        configuration.httpAdditionalHeaders = [
            "Accept": "application/json",
            "User-Agent": "SymptomSentryAI/1.0"
        ]
        session = URLSession(configuration: configuration)
        
        // For simulator, update to use correct URL
        #if DEBUG
        if ProcessInfo.processInfo.environment["SIMULATOR_DEVICE_NAME"] != nil {
            // Use special URL for simulator that can reach the host machine
            baseURL = "http://localhost:5000"
        }
        #endif
    }
    
    /// Set the authentication token
    /// - Parameter token: The JWT token
    func setAuthToken(_ token: String) {
        self.authToken = token
    }
    
    /// Clear the authentication token
    func clearAuthToken() {
        self.authToken = nil
    }
    
    /// Make a request to the API
    /// - Parameters:
    ///   - endpoint: The API endpoint
    ///   - method: The HTTP method
    ///   - parameters: Optional parameters for the request
    /// - Returns: A publisher that emits the response data or an error
    func request(
        endpoint: String,
        method: HTTPMethod,
        parameters: [String: Any]?
    ) -> AnyPublisher<Data, Error> {
        guard var urlComponents = URLComponents(string: baseURL + endpoint) else {
            return Fail(error: NetworkError.invalidURL).eraseToAnyPublisher()
        }
        
        // Add query parameters for GET requests
        if method == .get, let parameters = parameters {
            urlComponents.queryItems = parameters.map { key, value in
                URLQueryItem(name: key, value: "\(value)")
            }
        }
        
        guard let url = urlComponents.url else {
            return Fail(error: NetworkError.invalidURL).eraseToAnyPublisher()
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        
        // Add authorization header if token exists
        if let token = authToken {
            request.addValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        // Add body for non-GET requests
        if method != .get, let parameters = parameters {
            do {
                request.httpBody = try JSONSerialization.data(withJSONObject: parameters)
                request.addValue("application/json", forHTTPHeaderField: "Content-Type")
            } catch {
                return Fail(error: error).eraseToAnyPublisher()
            }
        }
        
        return requestPublisher(for: request).eraseToAnyPublisher()
    }
    
    /// Upload an image to the API
    /// - Parameters:
    ///   - imageData: The image data to upload
    ///   - endpoint: The API endpoint
    ///   - parameters: Additional parameters for the request
    /// - Returns: A publisher that emits the response data or an error
    func uploadImage(_ imageData: Data, to endpoint: String, parameters: [String: String]) -> AnyPublisher<Data, Error> {
        guard let url = URL(string: baseURL + endpoint) else {
            return Fail(error: NetworkError.invalidURL).eraseToAnyPublisher()
        }
        
        // Create multipart form data
        let boundary = "Boundary-\(UUID().uuidString)"
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        
        if let token = authToken {
            request.addValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        var body = Data()
        
        // Add text parameters
        for (key, value) in parameters {
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
        
        // Add closing boundary
        body.append("--\(boundary)--\r\n".data(using: .utf8)!)
        
        // Set the request body
        request.httpBody = body
        
        return requestPublisher(for: request).eraseToAnyPublisher()
    }
    
    /// Create a publisher for a URLRequest
    /// - Parameter request: The URLRequest
    /// - Returns: A publisher that emits the response data or an error
    private func requestPublisher(for request: URLRequest) -> AnyPublisher<Data, Error> {
        return Future<Data, Error> { [weak self] promise in
            guard let self = self else {
                return promise(.failure(NetworkError.invalidResponse))
            }
            
            let task = self.session.dataTask(with: request) { data, response, error in
                DispatchQueue.main.async {
                    // Check for a connection error
                    if let error = error {
                        promise(.failure(NetworkError.connectionError(error)))
                        return
                    }
                    
                    guard let httpResponse = response as? HTTPURLResponse else {
                        promise(.failure(NetworkError.invalidResponse))
                        return
                    }
                    
                    // Handle HTTP errors
                    if !(200...299).contains(httpResponse.statusCode) {
                        let message = String(data: data ?? Data(), encoding: .utf8) ?? "Unknown error"
                        promise(.failure(NetworkError.httpError(statusCode: httpResponse.statusCode, message: message)))
                        return
                    }
                    
                    // Check for valid data
                    guard let data = data else {
                        promise(.failure(NetworkError.invalidResponse))
                        return
                    }
                    
                    promise(.success(data))
                }
            }
            
            // Track the task and start it
            self.activeSessions.insert(task)
            task.resume()
        }
        .handleEvents(receiveCancel: { [weak self] in
            // Remove the task from active sessions when cancelled
            self?.activeSessions.forEach { task in
                task.cancel()
            }
            self?.activeSessions.removeAll()
        })
        .eraseToAnyPublisher()
    }
    
    /// Cancel all active requests
    func cancelAllRequests() {
        activeSessions.forEach { task in
            task.cancel()
        }
        activeSessions.removeAll()
    }
    
    /// Get the current environment (development or production)
    var environment: String {
        #if DEBUG
        return "development"
        #else
        return "production"
        #endif
    }
}

// MARK: - Extensions for Development/Testing

extension NetworkService {
    /// Use a local API URL for development
    func useLocalAPI() {
        if environment == "development" {
            // This would be replaced with the actual local development URL
            // For this example, we're showing localhost but you'd normally use a simulator-friendly URL
            // let baseURL = "http://localhost:5000"
        }
    }
    
    /// Create a mock response for testing
    static func mockResponse<T: Encodable>(_ data: T) -> AnyPublisher<Data, Error> {
        do {
            let jsonData = try JSONEncoder().encode(data)
            return Just(jsonData)
                .setFailureType(to: Error.self)
                .eraseToAnyPublisher()
        } catch {
            return Fail(error: error).eraseToAnyPublisher()
        }
    }
}