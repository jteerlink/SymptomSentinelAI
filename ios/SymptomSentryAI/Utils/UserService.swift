import Foundation
import Combine

/// Service for managing user-related operations
class UserService: ObservableObject {
    static let shared = UserService()
    
    // MARK: - Properties
    
    /// Current user object
    @Published var currentUser: User?
    
    /// Authentication token for API requests
    @Published var authToken: String?
    
    /// Refresh token for obtaining new access tokens
    @Published var refreshToken: String?
    
    /// Token expiration date
    @Published var tokenExpiration: Date?
    
    /// Network service for API requests
    private let networkService = NetworkService.shared
    
    /// User defaults for storing session data
    private let userDefaults = UserDefaults.standard
    
    /// Cancellable store for Combine subscriptions
    private var cancellables = Set<AnyCancellable>()
    
    /// Authentication status
    @Published var isAuthenticated: Bool = false
    
    /// Loading states
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?
    
    // MARK: - Initialization
    
    private init() {
        // Attempt to restore user session
        restoreSession()
    }
    
    // MARK: - Authentication Methods
    
    /// Register a new user
    /// - Parameters:
    ///   - email: User's email address
    ///   - password: User's password
    ///   - name: User's full name
    ///   - completion: Callback with success flag and optional error message
    func register(email: String, password: String, name: String, completion: @escaping (Bool, String?) -> Void) {
        isLoading = true
        errorMessage = nil
        
        // Validate inputs
        guard isValidEmail(email) else {
            isLoading = false
            completion(false, "Please enter a valid email address")
            return
        }
        
        guard isValidPassword(password) else {
            isLoading = false
            completion(false, "Password must be at least 8 characters with a number and special character")
            return
        }
        
        guard !name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            isLoading = false
            completion(false, "Please enter your name")
            return
        }
        
        // Create API request parameters
        let parameters: [String: Any] = [
            "email": email,
            "password": password,
            "name": name
        ]
        
        // Send request to backend using NetworkService
        networkService.request(
            endpoint: "/api/register", 
            method: .post,
            parameters: parameters
        )
        .receive(on: DispatchQueue.main)
        .sink(
            receiveCompletion: { [weak self] completionStatus in
                guard let self = self else { return }
                self.isLoading = false
                
                if case .failure(let error) = completionStatus {
                    self.errorMessage = error.localizedDescription
                    completion(false, "Registration failed: \(error.localizedDescription)")
                }
            },
            receiveValue: { [weak self] data in
                guard let self = self else { return }
                self.isLoading = false
                
                do {
                    // For debugging purposes, print the raw response
                    #if DEBUG
                    if let jsonString = String(data: data, encoding: .utf8) {
                        print("Registration response: \(jsonString)")
                    }
                    #endif
                    
                    // Use JSONDecoder for more reliable parsing
                    let decoder = JSONDecoder()
                    let authResponse = try decoder.decode(AuthResponse.self, from: data)
                    
                    // Create user object from decoded response
                    let user = User(
                        id: authResponse.user.id,
                        email: authResponse.user.email,
                        name: authResponse.user.name,
                        subscriptionLevel: SubscriptionLevel(rawValue: authResponse.user.subscription) ?? .free
                    )
                    
                    // Store user and token
                    self.currentUser = user
                    self.authToken = authResponse.token
                    self.isAuthenticated = true
                    
                    // Set the auth token in network service
                    self.networkService.setAuthToken(authResponse.token)
                    
                    // Save session
                    self.saveSession()
                    
                    completion(true, nil)
                } catch let decodingError as DecodingError {
                    // Detailed decoding error handling for better debugging
                    let errorMessage: String
                    
                    switch decodingError {
                    case .keyNotFound(let key, let context):
                        errorMessage = "Key '\(key.stringValue)' not found: \(context.debugDescription)"
                    case .typeMismatch(let type, let context):
                        errorMessage = "Type '\(type)' mismatch: \(context.debugDescription)"
                    case .valueNotFound(let type, let context):
                        errorMessage = "Value of type '\(type)' not found: \(context.debugDescription)"
                    case .dataCorrupted(let context):
                        errorMessage = "Data corrupted: \(context.debugDescription)"
                    @unknown default:
                        errorMessage = "Unknown decoding error: \(decodingError.localizedDescription)"
                    }
                    
                    self.errorMessage = "Failed to parse response: \(errorMessage)"
                    completion(false, "Registration failed: \(errorMessage)")
                } catch {
                    self.errorMessage = "Failed to parse response: \(error.localizedDescription)"
                    completion(false, "Registration failed: \(error.localizedDescription)")
                }
            }
        )
        .store(in: &cancellables)
    }
    
    /// Login an existing user
    /// - Parameters:
    ///   - email: User's email address
    ///   - password: User's password
    ///   - completion: Callback with success flag and optional error message
    func login(email: String, password: String, completion: @escaping (Bool, String?) -> Void) {
        isLoading = true
        errorMessage = nil
        
        // Validate inputs
        guard isValidEmail(email) else {
            isLoading = false
            completion(false, "Please enter a valid email address")
            return
        }
        
        guard !password.isEmpty else {
            isLoading = false
            completion(false, "Please enter your password")
            return
        }
        
        // Create API request parameters
        let parameters: [String: Any] = [
            "email": email,
            "password": password
        ]
        
        // Send request to backend using NetworkService
        networkService.request(
            endpoint: "/api/login", 
            method: .post,
            parameters: parameters
        )
        .receive(on: DispatchQueue.main)
        .sink(
            receiveCompletion: { [weak self] completionStatus in
                guard let self = self else { return }
                self.isLoading = false
                
                if case .failure(let error) = completionStatus {
                    self.errorMessage = error.localizedDescription
                    completion(false, "Login failed: \(error.localizedDescription)")
                }
            },
            receiveValue: { [weak self] data in
                guard let self = self else { return }
                self.isLoading = false
                
                do {
                    // For debugging purposes, print the raw response
                    #if DEBUG
                    if let jsonString = String(data: data, encoding: .utf8) {
                        print("Login response: \(jsonString)")
                    }
                    #endif
                    
                    // Use JSONDecoder for more reliable parsing
                    let decoder = JSONDecoder()
                    let authResponse = try decoder.decode(AuthResponse.self, from: data)
                    
                    // Create user object from decoded response
                    let user = User(
                        id: authResponse.user.id,
                        email: authResponse.user.email,
                        name: authResponse.user.name,
                        subscriptionLevel: SubscriptionLevel(rawValue: authResponse.user.subscription) ?? .free
                    )
                    
                    // Store user and token
                    self.currentUser = user
                    self.authToken = authResponse.token
                    self.isAuthenticated = true
                    
                    // Store refresh token if available
                    if let refreshToken = authResponse.refreshToken {
                        self.refreshToken = refreshToken
                    }
                    
                    // Calculate token expiration time
                    if let expirationString = authResponse.tokenExpiration {
                        // Parse expiration time from string (e.g., "1h" to add 1 hour)
                        if expirationString.hasSuffix("h") {
                            let hoursString = expirationString.dropLast()
                            if let hours = Int(hoursString) {
                                self.tokenExpiration = Calendar.current.date(byAdding: .hour, value: hours, to: Date())
                            }
                        } else if expirationString.hasSuffix("m") {
                            let minutesString = expirationString.dropLast()
                            if let minutes = Int(minutesString) {
                                self.tokenExpiration = Calendar.current.date(byAdding: .minute, value: minutes, to: Date())
                            }
                        } else if expirationString.hasSuffix("d") {
                            let daysString = expirationString.dropLast()
                            if let days = Int(daysString) {
                                self.tokenExpiration = Calendar.current.date(byAdding: .day, value: days, to: Date())
                            }
                        } else {
                            // Default to 1 hour if format not recognized
                            self.tokenExpiration = Calendar.current.date(byAdding: .hour, value: 1, to: Date())
                        }
                    } else {
                        // Default expiration (1 hour) if not provided
                        self.tokenExpiration = Calendar.current.date(byAdding: .hour, value: 1, to: Date())
                    }
                    
                    // Set the auth token in network service
                    self.networkService.setAuthToken(authResponse.token)
                    
                    // Save session
                    self.saveSession()
                    
                    completion(true, nil)
                } catch let decodingError as DecodingError {
                    // Detailed decoding error handling for better debugging
                    let errorMessage: String
                    
                    switch decodingError {
                    case .keyNotFound(let key, let context):
                        errorMessage = "Key '\(key.stringValue)' not found: \(context.debugDescription)"
                    case .typeMismatch(let type, let context):
                        errorMessage = "Type '\(type)' mismatch: \(context.debugDescription)"
                    case .valueNotFound(let type, let context):
                        errorMessage = "Value of type '\(type)' not found: \(context.debugDescription)"
                    case .dataCorrupted(let context):
                        errorMessage = "Data corrupted: \(context.debugDescription)"
                    @unknown default:
                        errorMessage = "Unknown decoding error: \(decodingError.localizedDescription)"
                    }
                    
                    self.errorMessage = "Failed to parse response: \(errorMessage)"
                    completion(false, "Login failed: \(errorMessage)")
                } catch {
                    self.errorMessage = "Failed to parse response: \(error.localizedDescription)"
                    completion(false, "Login failed: \(error.localizedDescription)")
                }
            }
        )
        .store(in: &cancellables)
    }
    
    /// Log out the current user
    func logout() {
        // Clear user data
        currentUser = nil
        authToken = nil
        refreshToken = nil
        tokenExpiration = nil
        isAuthenticated = false
        
        // Clear saved session
        userDefaults.removeObject(forKey: "authToken")
        userDefaults.removeObject(forKey: "refreshToken")
        userDefaults.removeObject(forKey: "tokenExpiration")
        userDefaults.removeObject(forKey: "userId")
        userDefaults.removeObject(forKey: "userEmail")
        userDefaults.removeObject(forKey: "userName")
        userDefaults.removeObject(forKey: "userSubscription")
    }
    
    /// Refresh the access token using the refresh token
    /// - Parameter completion: Callback with success flag and optional error message
    func refreshAccessToken(completion: @escaping (Bool, String?) -> Void) {
        guard let refreshToken = refreshToken else {
            completion(false, "No refresh token available")
            return
        }
        
        isLoading = true
        
        // Create parameters
        let parameters: [String: Any] = [
            "refreshToken": refreshToken
        ]
        
        // Send request to backend using NetworkService
        networkService.request(
            endpoint: "/api/refresh-token",
            method: .post,
            parameters: parameters
        )
        .receive(on: DispatchQueue.main)
        .sink(
            receiveCompletion: { [weak self] completionStatus in
                guard let self = self else { return }
                self.isLoading = false
                
                if case .failure(let error) = completionStatus {
                    self.errorMessage = error.localizedDescription
                    completion(false, "Token refresh failed: \(error.localizedDescription)")
                }
            },
            receiveValue: { [weak self] data in
                guard let self = self else { return }
                self.isLoading = false
                
                do {
                    // Parse the response
                    let decoder = JSONDecoder()
                    let response = try decoder.decode(RefreshTokenResponse.self, from: data)
                    
                    if response.success {
                        // Update tokens
                        self.authToken = response.accessToken
                        
                        if let newRefreshToken = response.refreshToken {
                            self.refreshToken = newRefreshToken
                        }
                        
                        // Update token in network service
                        self.networkService.setAuthToken(response.accessToken)
                        
                        // Save updated session
                        self.saveSession()
                        
                        completion(true, nil)
                    } else {
                        // Clear auth data on refresh failure
                        self.logout()
                        completion(false, response.message ?? "Token refresh failed")
                    }
                } catch {
                    completion(false, "Failed to parse response: \(error.localizedDescription)")
                }
            }
        )
        .store(in: &cancellables)
    }
    
    // MARK: - User Data Methods
    
    /// Update the user's password
    /// - Parameters:
    ///   - currentPassword: The user's current password
    ///   - newPassword: The new password to set
    ///   - completion: Callback with success flag and optional error message
    func updatePassword(currentPassword: String, newPassword: String, completion: @escaping (Bool, String?) -> Void) {
        guard let authToken = authToken else {
            completion(false, "Not authenticated")
            return
        }
        
        isLoading = true
        
        // Validate inputs
        guard !currentPassword.isEmpty else {
            isLoading = false
            completion(false, "Current password is required")
            return
        }
        
        guard isValidPassword(newPassword) else {
            isLoading = false
            completion(false, "New password must be at least 8 characters with a number and special character")
            return
        }
        
        // Create parameters for the request
        let parameters: [String: Any] = [
            "currentPassword": currentPassword,
            "newPassword": newPassword
        ]
        
        // Send request to backend using NetworkService
        networkService.request(
            endpoint: "/api/update-password",
            method: .put,
            parameters: parameters
        )
        .receive(on: DispatchQueue.main)
        .sink(
            receiveCompletion: { [weak self] completionStatus in
                guard let self = self else { return }
                self.isLoading = false
                
                if case .failure(let error) = completionStatus {
                    self.errorMessage = error.localizedDescription
                    completion(false, "Failed to update password: \(error.localizedDescription)")
                }
            },
            receiveValue: { [weak self] data in
                guard let self = self else { return }
                self.isLoading = false
                
                do {
                    // Parse the response
                    let decoder = JSONDecoder()
                    let response = try decoder.decode(GenericResponse.self, from: data)
                    
                    if response.success {
                        completion(true, "Password updated successfully")
                    } else {
                        completion(false, response.message ?? "Unknown error occurred")
                    }
                } catch {
                    completion(false, "Failed to parse response: \(error.localizedDescription)")
                }
            }
        )
        .store(in: &cancellables)
    }
    
    /// Get the current user's profile
    /// - Parameter completion: Callback with success flag and optional error message
    func getUserProfile(completion: @escaping (Bool, String?) -> Void) {
        guard let authToken = authToken else {
            completion(false, "Not authenticated")
            return
        }
        
        isLoading = true
        
        // Send request to backend using NetworkService
        networkService.request(
            endpoint: "/api/user-profile",
            method: .get,
            parameters: nil
        )
        .receive(on: DispatchQueue.main)
        .sink(
            receiveCompletion: { [weak self] completionStatus in
                guard let self = self else { return }
                self.isLoading = false
                
                if case .failure(let error) = completionStatus {
                    self.errorMessage = error.localizedDescription
                    completion(false, "Failed to get profile: \(error.localizedDescription)")
                }
            },
            receiveValue: { [weak self] data in
                guard let self = self else { return }
                self.isLoading = false
                
                do {
                    // Use JSONDecoder for more reliable parsing
                    let decoder = JSONDecoder()
                    let profileResponse = try decoder.decode(ProfileResponse.self, from: data)
                    
                    // Create user object from decoded response
                    let user = User(
                        id: profileResponse.user.id,
                        email: profileResponse.user.email,
                        name: profileResponse.user.name,
                        subscriptionLevel: SubscriptionLevel(rawValue: profileResponse.user.subscription) ?? .free
                    )
                    
                    self.currentUser = user
                    
                    // Save updated user data
                    self.saveSession()
                    
                    completion(true, nil)
                } catch {
                    completion(false, "Failed to parse response: \(error.localizedDescription)")
                }
            }
        )
        .store(in: &cancellables)
    }
    
    /// Update the current user's profile
    /// - Parameters:
    ///   - name: User's new name (optional)
    ///   - email: User's new email (optional)
    ///   - completion: Callback with success flag and optional error message
    func updateUserProfile(name: String? = nil, email: String? = nil, completion: @escaping (Bool, String?) -> Void) {
        guard let authToken = authToken, let currentUser = currentUser else {
            completion(false, "Not authenticated")
            return
        }
        
        isLoading = true
        
        // Create parameters with only the fields to update
        var parameters: [String: Any] = [:]
        
        if let name = name, !name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            parameters["name"] = name
        }
        
        if let email = email, isValidEmail(email) {
            parameters["email"] = email
        }
        
        // No fields to update
        if parameters.isEmpty {
            isLoading = false
            completion(false, "No changes to update")
            return
        }
        
        // Send request to backend using NetworkService
        networkService.request(
            endpoint: "/api/update-profile",
            method: .put,
            parameters: parameters
        )
        .receive(on: DispatchQueue.main)
        .sink(
            receiveCompletion: { [weak self] completionStatus in
                guard let self = self else { return }
                self.isLoading = false
                
                if case .failure(let error) = completionStatus {
                    self.errorMessage = error.localizedDescription
                    completion(false, "Failed to update profile: \(error.localizedDescription)")
                }
            },
            receiveValue: { [weak self] data in
                guard let self = self else { return }
                self.isLoading = false
                
                do {
                    // Use JSONDecoder for more reliable parsing
                    let decoder = JSONDecoder()
                    let profileResponse = try decoder.decode(ProfileResponse.self, from: data)
                    
                    // Update user object with new data from response
                    let updatedUser = User(
                        id: profileResponse.user.id,
                        email: profileResponse.user.email,
                        name: profileResponse.user.name,
                        subscriptionLevel: SubscriptionLevel(rawValue: profileResponse.user.subscription) ?? .free
                    )
                    
                    self.currentUser = updatedUser
                    
                    // Save updated user data
                    self.saveSession()
                    
                    completion(true, nil)
                } catch {
                    completion(false, "Failed to parse response: \(error.localizedDescription)")
                }
            }
        )
        .store(in: &cancellables)
    }
    
    // MARK: - Subscription Methods
    
    /// Upgrade the user's subscription
    /// - Parameters:
    ///   - level: The subscription level to upgrade to
    ///   - paymentToken: Payment token from payment processor
    ///   - completion: Callback with success flag and optional error message
    func upgradeSubscription(to level: SubscriptionLevel, paymentToken: String, completion: @escaping (Bool, String?) -> Void) {
        guard let authToken = authToken else {
            completion(false, "Not authenticated")
            return
        }
        
        isLoading = true
        
        // Create parameters
        let parameters: [String: Any] = [
            "subscription_level": level.rawValue,
            "payment_token": paymentToken
        ]
        
        // Send request to backend using NetworkService
        networkService.request(
            endpoint: "/api/update-subscription",
            method: .post,
            parameters: parameters
        )
        .receive(on: DispatchQueue.main)
        .sink(
            receiveCompletion: { [weak self] completionStatus in
                guard let self = self else { return }
                self.isLoading = false
                
                if case .failure(let error) = completionStatus {
                    self.errorMessage = error.localizedDescription
                    completion(false, "Subscription upgrade failed: \(error.localizedDescription)")
                }
            },
            receiveValue: { [weak self] data in
                guard let self = self else { return }
                self.isLoading = false
                
                do {
                    // Use JSONDecoder for more reliable parsing
                    let decoder = JSONDecoder()
                    let subscriptionResponse = try decoder.decode(SubscriptionResponse.self, from: data)
                    
                    // Verify success status
                    if subscriptionResponse.success {
                        // Update user's subscription
                        if let currentUser = self.currentUser {
                            let subscriptionLevel = SubscriptionLevel(rawValue: subscriptionResponse.user.subscription) ?? .free
                            
                            let updatedUser = User(
                                id: currentUser.id,
                                email: currentUser.email,
                                name: currentUser.name,
                                subscriptionLevel: subscriptionLevel
                            )
                            
                            self.currentUser = updatedUser
                            
                            // Save updated user data
                            self.saveSession()
                        }
                        
                        completion(true, nil)
                    } else {
                        completion(false, "Subscription upgrade failed")
                    }
                } catch {
                    completion(false, "Failed to parse response: \(error.localizedDescription)")
                }
            }
        )
        .store(in: &cancellables)
    }
    
    // MARK: - Analysis Methods
    
    /// Save an analysis result to the user's history
    /// - Parameters:
    ///   - type: The type of analysis (throat or ear)
    ///   - conditions: The analysis conditions
    ///   - imageReference: Reference to the analyzed image
    ///   - completion: Callback with success flag
    func saveAnalysisResult(
        type: AnalysisType,
        conditions: [AnalysisCondition],
        imageReference: String,
        completion: @escaping (Bool) -> Void
    ) {
        guard let authToken = authToken, let currentUser = currentUser else {
            completion(false)
            return
        }
        
        // Create parameters
        var parameters: [String: Any] = [
            "type": type.rawValue,
            "image_reference": imageReference,
            "date": ISO8601DateFormatter().string(from: Date())
        ]
        
        // Add conditions data
        var conditionsData: [[String: Any]] = []
        for condition in conditions {
            conditionsData.append([
                "id": condition.id,
                "name": condition.name,
                "confidence": condition.confidence,
                "description": condition.description,
                "severity": condition.severity.rawValue,
                "recommendation": condition.recommendation
            ])
        }
        parameters["conditions"] = conditionsData
        
        // Send request to backend using NetworkService
        networkService.request(
            endpoint: "/api/save-analysis",
            method: .post,
            parameters: parameters
        )
        .receive(on: DispatchQueue.main)
        .sink(
            receiveCompletion: { completionStatus in
                if case .failure = completionStatus {
                    completion(false)
                }
            },
            receiveValue: { data in
                do {
                    // Use JSONDecoder for more reliable parsing
                    let decoder = JSONDecoder()
                    let saveResponse = try decoder.decode(SaveAnalysisResponse.self, from: data)
                    completion(saveResponse.success)
                } catch {
                    completion(false)
                }
            }
        )
        .store(in: &cancellables)
    }
    
    /// Get the user's analysis history
    /// - Parameter completion: Callback with results or error
    func getAnalysisHistory(completion: @escaping (Result<[AnalysisHistoryItem], Error>) -> Void) {
        guard let authToken = authToken else {
            completion(.failure(NSError(
                domain: "UserService",
                code: 401,
                userInfo: [NSLocalizedDescriptionKey: "Not authenticated"]
            )))
            return
        }
        
        // Send request to backend using NetworkService
        networkService.request(
            endpoint: "/api/analysis-history",
            method: .get,
            parameters: nil
        )
        .receive(on: DispatchQueue.main)
        .sink(
            receiveCompletion: { completionStatus in
                if case .failure(let error) = completionStatus {
                    completion(.failure(error))
                }
            },
            receiveValue: { data in
                do {
                    // Use JSONDecoder for more reliable parsing
                    let decoder = JSONDecoder()
                    let historyResponse = try decoder.decode(AnalysisHistoryResponse.self, from: data)
                    
                    // Convert API response model to app's internal model
                    var historyItems: [AnalysisHistoryItem] = []
                    
                    for item in historyResponse.history {
                        // Convert string date to Date object
                        guard let date = ISO8601DateFormatter().date(from: item.date) else {
                            continue
                        }
                        
                        // Get top condition if available
                        guard let topCondition = item.conditions.first else {
                            continue
                        }
                        
                        // Convert API condition models to app condition models
                        var conditions: [AnalysisCondition] = []
                        
                        for conditionData in item.conditions {
                            guard let severity = ConditionSeverity(rawValue: conditionData.severity) else {
                                continue
                            }
                            
                            let condition = AnalysisCondition(
                                id: conditionData.id,
                                name: conditionData.name,
                                confidence: conditionData.confidence,
                                description: conditionData.description,
                                severity: severity,
                                recommendation: conditionData.recommendation
                            )
                            
                            conditions.append(condition)
                        }
                        
                        // Create history item
                        let historyItem = AnalysisHistoryItem(
                            id: item.id,
                            date: date,
                            type: item.type,
                            topConditionName: topCondition.name,
                            topConditionConfidence: topCondition.confidence,
                            imageReference: item.image_reference,
                            conditions: conditions
                        )
                        
                        historyItems.append(historyItem)
                    }
                    
                    // Sort by date (newest first)
                    historyItems.sort { $0.date > $1.date }
                    
                    completion(.success(historyItems))
                } catch {
                    completion(.failure(error))
                }
            }
        )
        .store(in: &cancellables)
    }
    
    // MARK: - Helper Methods
    
    /// Restore user session from UserDefaults
    private func restoreSession() {
        // Load auth token
        if let token = userDefaults.string(forKey: "authToken") {
            authToken = token
            
            // Load refresh token
            if let refreshTokenValue = userDefaults.string(forKey: "refreshToken") {
                refreshToken = refreshTokenValue
            }
            
            // Load token expiration
            if let expirationString = userDefaults.string(forKey: "tokenExpiration"),
               let expiration = ISO8601DateFormatter().date(from: expirationString) {
                tokenExpiration = expiration
            }
            
            // Load user data
            if let userId = userDefaults.string(forKey: "userId"),
               let userEmail = userDefaults.string(forKey: "userEmail"),
               let userName = userDefaults.string(forKey: "userName"),
               let subscriptionString = userDefaults.string(forKey: "userSubscription"),
               let subscription = SubscriptionLevel(rawValue: subscriptionString) {
                
                // Create user object
                let user = User(
                    id: userId,
                    email: userEmail,
                    name: userName,
                    subscriptionLevel: subscription
                )
                
                currentUser = user
                isAuthenticated = true
                
                // Set auth token in network service
                networkService.setAuthToken(token)
                
                // Check token expiration
                if let expiration = tokenExpiration, expiration <= Date() {
                    // Token expired, try to refresh
                    if let _ = refreshToken {
                        self.refreshAccessToken { success, _ in
                            if !success {
                                self.logout()
                            }
                        }
                    } else {
                        // No refresh token, logout
                        self.logout()
                    }
                } else {
                    // Verify token is still valid in background
                    validateToken { isValid in
                        if !isValid {
                            // Token expired, log out
                            self.logout()
                        }
                    }
                }
            } else {
                // Incomplete user data, reset session
                logout()
            }
        }
    }
    
    /// Save user session to UserDefaults
    private func saveSession() {
        guard let authToken = authToken, let user = currentUser else {
            return
        }
        
        // Save auth token
        userDefaults.set(authToken, forKey: "authToken")
        
        // Save refresh token if available
        if let refreshToken = refreshToken {
            userDefaults.set(refreshToken, forKey: "refreshToken")
        }
        
        // Save token expiration if available
        if let expiration = tokenExpiration {
            let iso8601String = ISO8601DateFormatter().string(from: expiration)
            userDefaults.set(iso8601String, forKey: "tokenExpiration")
        }
        
        // Save user data
        userDefaults.set(user.id, forKey: "userId")
        userDefaults.set(user.email, forKey: "userEmail")
        userDefaults.set(user.name, forKey: "userName")
        userDefaults.set(user.subscriptionLevel.rawValue, forKey: "userSubscription")
    }
    
    /// Validate the current auth token
    /// - Parameter completion: Callback with validity flag
    private func validateToken(completion: @escaping (Bool) -> Void) {
        guard let authToken = authToken else {
            completion(false)
            return
        }
        
        // Send request to backend using NetworkService
        networkService.request(
            endpoint: "/api/validate-token",
            method: .get,
            parameters: nil
        )
        .receive(on: DispatchQueue.main)
        .sink(
            receiveCompletion: { completionStatus in
                if case .failure = completionStatus {
                    completion(false)
                }
            },
            receiveValue: { data in
                do {
                    // Use JSONDecoder for more reliable parsing
                    let decoder = JSONDecoder()
                    let validationResponse = try decoder.decode(TokenValidationResponse.self, from: data)
                    completion(validationResponse.valid)
                } catch {
                    completion(false)
                }
            }
        )
        .store(in: &cancellables)
    }
    
    /// Validate email format
    /// - Parameter email: Email to validate
    /// - Returns: True if valid
    private func isValidEmail(_ email: String) -> Bool {
        let emailRegex = #"^[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"#
        let emailPredicate = NSPredicate(format: "SELF MATCHES %@", emailRegex)
        return emailPredicate.evaluate(with: email)
    }
    
    /// Validate password strength
    /// - Parameter password: Password to validate
    /// - Returns: True if valid
    private func isValidPassword(_ password: String) -> Bool {
        // At least 8 characters with at least one number and one special character
        return password.count >= 8 &&
               password.range(of: #"[0-9]+"#, options: .regularExpression) != nil &&
               password.range(of: #"[^A-Za-z0-9]+"#, options: .regularExpression) != nil
    }
    
    /// Refresh the access token using the refresh token
    /// - Parameter completion: Callback with success flag and optional error message
    private func refreshAccessToken(completion: @escaping (Bool, String?) -> Void) {
        guard let refreshToken = refreshToken else {
            completion(false, "No refresh token available")
            return
        }
        
        // Create the refresh token request
        let parameters: [String: Any] = [
            "refreshToken": refreshToken
        ]
        
        // Send request to backend using NetworkService
        networkService.request(
            endpoint: "/api/refresh-token",
            method: .post,
            parameters: parameters
        )
        .receive(on: DispatchQueue.main)
        .sink(
            receiveCompletion: { completionStatus in
                if case let .failure(error) = completionStatus {
                    completion(false, error.localizedDescription)
                }
            },
            receiveValue: { data in
                do {
                    // Decode the refresh token response
                    let decoder = JSONDecoder()
                    let response = try decoder.decode(RefreshTokenResponse.self, from: data)
                    
                    if response.success {
                        // Update tokens
                        self.authToken = response.accessToken
                        if let newRefreshToken = response.refreshToken {
                            self.refreshToken = newRefreshToken
                        }
                        
                        // Update token expiration (typically +1 hour)
                        self.tokenExpiration = Calendar.current.date(byAdding: .hour, value: 1, to: Date())
                        
                        // Update network service with new token
                        self.networkService.setAuthToken(response.accessToken)
                        
                        // Save updated session
                        self.saveSession()
                        
                        completion(true, nil)
                    } else {
                        completion(false, response.message ?? "Token refresh failed")
                    }
                } catch {
                    completion(false, "Failed to parse refresh token response")
                }
            }
        )
        .store(in: &cancellables)
    }
}

// MARK: - Supporting Types

/// Types of analysis
enum AnalysisType: String {
    case throat = "throat"
    case ear = "ear"
}