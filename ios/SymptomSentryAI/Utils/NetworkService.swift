import Foundation

/// Service for handling network requests
class NetworkService {
    static let shared = NetworkService()
    
    // MARK: - Properties
    
    /// Base URL for API requests
    private let baseUrl = "https://api.symptomsentry.com/v1"
    
    /// Default request timeout
    private let defaultTimeout: TimeInterval = 30.0
    
    /// Session configuration
    private let sessionConfiguration: URLSessionConfiguration
    
    /// URL session
    private let session: URLSession
    
    // MARK: - Initialization
    
    private init() {
        // Configure session
        sessionConfiguration = URLSessionConfiguration.default
        sessionConfiguration.timeoutIntervalForRequest = defaultTimeout
        sessionConfiguration.httpShouldSetCookies = true
        sessionConfiguration.httpCookieAcceptPolicy = .always
        
        // Create session
        session = URLSession(configuration: sessionConfiguration)
    }
    
    // MARK: - Public Methods
    
    /// Make a basic HTTP request
    /// - Parameters:
    ///   - url: The URL to request
    ///   - method: HTTP method (GET, POST, etc.)
    ///   - parameters: Optional query/body parameters
    ///   - headers: Optional HTTP headers
    ///   - completion: Callback with data or error
    func request(
        url: String,
        method: String = "GET",
        parameters: [String: Any]? = nil,
        headers: [String: String]? = nil,
        completion: @escaping (Result<Data, Error>) -> Void
    ) {
        guard let url = URL(string: url) else {
            completion(.failure(NetworkError.invalidURL))
            return
        }
        
        // Create request
        var request = URLRequest(url: url)
        request.httpMethod = method
        
        // Add headers
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        headers?.forEach { request.addValue($0.value, forHTTPHeaderField: $0.key) }
        
        // Add parameters
        if let parameters = parameters {
            if method == "GET" {
                // For GET, add query parameters to URL
                var components = URLComponents(url: url, resolvingAgainstBaseURL: false)!
                components.queryItems = parameters.map { URLQueryItem(name: $0.key, value: "\($0.value)") }
                if let newURL = components.url {
                    request.url = newURL
                }
            } else {
                // For other methods, add as JSON body
                do {
                    request.httpBody = try JSONSerialization.data(withJSONObject: parameters)
                } catch {
                    completion(.failure(NetworkError.encodingFailed))
                    return
                }
            }
        }
        
        // Make request
        let task = session.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let httpResponse = response as? HTTPURLResponse else {
                completion(.failure(NetworkError.invalidResponse))
                return
            }
            
            guard (200...299).contains(httpResponse.statusCode) else {
                completion(.failure(NetworkError.httpError(statusCode: httpResponse.statusCode)))
                return
            }
            
            guard let data = data else {
                completion(.failure(NetworkError.noData))
                return
            }
            
            completion(.success(data))
        }
        
        task.resume()
    }
    
    /// Make an HTTP request that expects a JSON response
    /// - Parameters:
    ///   - url: The URL to request
    ///   - method: HTTP method (GET, POST, etc.)
    ///   - parameters: Optional query/body parameters
    ///   - headers: Optional HTTP headers
    ///   - completion: Callback with decoded object or error
    func requestJSON<T: Decodable>(
        url: String,
        method: String = "GET",
        parameters: [String: Any]? = nil,
        headers: [String: String]? = nil,
        completion: @escaping (Result<T, Error>) -> Void
    ) {
        request(url: url, method: method, parameters: parameters, headers: headers) { result in
            switch result {
            case .success(let data):
                do {
                    let decoder = JSONDecoder()
                    decoder.keyDecodingStrategy = .convertFromSnakeCase
                    let object = try decoder.decode(T.self, from: data)
                    completion(.success(object))
                } catch {
                    completion(.failure(NetworkError.decodingFailed(error: error)))
                }
                
            case .failure(let error):
                completion(.failure(error))
            }
        }
    }
    
    /// Upload data to a server
    /// - Parameters:
    ///   - url: The URL to upload to
    ///   - method: HTTP method (usually POST or PUT)
    ///   - data: The data to upload
    ///   - headers: Optional HTTP headers
    ///   - completion: Callback with response data or error
    func uploadRequest(
        url: String,
        method: String = "POST",
        data: Data,
        headers: [String: String]? = nil,
        completion: @escaping (Result<Data, Error>) -> Void
    ) {
        guard let url = URL(string: url) else {
            completion(.failure(NetworkError.invalidURL))
            return
        }
        
        // Create request
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.httpBody = data
        
        // Add headers
        headers?.forEach { request.addValue($0.value, forHTTPHeaderField: $0.key) }
        
        // Make request
        let task = session.uploadTask(with: request, from: data) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let httpResponse = response as? HTTPURLResponse else {
                completion(.failure(NetworkError.invalidResponse))
                return
            }
            
            guard (200...299).contains(httpResponse.statusCode) else {
                completion(.failure(NetworkError.httpError(statusCode: httpResponse.statusCode)))
                return
            }
            
            guard let data = data else {
                completion(.failure(NetworkError.noData))
                return
            }
            
            completion(.success(data))
        }
        
        task.resume()
    }
    
    /// Download a file from a URL
    /// - Parameters:
    ///   - url: The URL to download from
    ///   - completion: Callback with local file URL or error
    func downloadFile(
        url: String,
        completion: @escaping (Result<URL, Error>) -> Void
    ) {
        guard let url = URL(string: url) else {
            completion(.failure(NetworkError.invalidURL))
            return
        }
        
        let task = session.downloadTask(with: url) { localURL, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let httpResponse = response as? HTTPURLResponse else {
                completion(.failure(NetworkError.invalidResponse))
                return
            }
            
            guard (200...299).contains(httpResponse.statusCode) else {
                completion(.failure(NetworkError.httpError(statusCode: httpResponse.statusCode)))
                return
            }
            
            guard let localURL = localURL else {
                completion(.failure(NetworkError.noData))
                return
            }
            
            // Move to a persistent location
            let documentsDirectory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
            let destinationURL = documentsDirectory.appendingPathComponent(url.lastPathComponent)
            
            do {
                // Remove existing file if it exists
                if FileManager.default.fileExists(atPath: destinationURL.path) {
                    try FileManager.default.removeItem(at: destinationURL)
                }
                
                // Move downloaded file to documents directory
                try FileManager.default.moveItem(at: localURL, to: destinationURL)
                
                completion(.success(destinationURL))
            } catch {
                completion(.failure(error))
            }
        }
        
        task.resume()
    }
}

// MARK: - NetworkError

/// Network-related errors
enum NetworkError: Error {
    case invalidURL
    case invalidResponse
    case httpError(statusCode: Int)
    case noData
    case encodingFailed
    case decodingFailed(error: Error)
    case unauthorized
    case serverError
    case connectionFailed
    
    var localizedDescription: String {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .invalidResponse:
            return "Invalid response from server"
        case .httpError(let statusCode):
            return "HTTP error: \(statusCode)"
        case .noData:
            return "No data received"
        case .encodingFailed:
            return "Failed to encode request parameters"
        case .decodingFailed(let error):
            return "Failed to decode response: \(error.localizedDescription)"
        case .unauthorized:
            return "Authentication required"
        case .serverError:
            return "Server error"
        case .connectionFailed:
            return "Connection failed"
        }
    }
}