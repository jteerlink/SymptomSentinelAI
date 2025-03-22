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
            endpoint: "/api/auth/register", 
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
            endpoint: "/api/auth/login", 
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
        isAuthenticated = false
        
        // Clear saved session
        userDefaults.removeObject(forKey: "authToken")
        userDefaults.removeObject(forKey: "userId")
        userDefaults.removeObject(forKey: "userEmail")
        userDefaults.removeObject(forKey: "userName")
        userDefaults.removeObject(forKey: "userSubscription")
    }
    
    // MARK: - User Data Methods
    
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
            endpoint: "/api/user/profile",
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
            endpoint: "/api/user/profile",
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
            endpoint: "/api/user/subscription",
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
                    // Parse JSON response
                    if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                       let success = json["success"] as? Bool,
                       success,
                       let userData = json["user"] as? [String: Any],
                       let subscription = userData["subscription"] as? String,
                       let subscriptionLevel = SubscriptionLevel(rawValue: subscription) {
                        
                        // Update user's subscription
                        if let currentUser = self.currentUser {
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
            endpoint: "/api/analysis/save",
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
            receiveValue: { _ in
                completion(true)
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
            endpoint: "/api/analysis/history",
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
                    // Parse JSON response
                    if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                       let historyData = json["history"] as? [[String: Any]] {
                        
                        // Create history items
                        var historyItems: [AnalysisHistoryItem] = []
                        
                        for itemData in historyData {
                            if let id = itemData["id"] as? String,
                               let dateString = itemData["date"] as? String,
                               let date = ISO8601DateFormatter().date(from: dateString),
                               let type = itemData["type"] as? String,
                               let imageReference = itemData["image_reference"] as? String,
                               let conditionsData = itemData["conditions"] as? [[String: Any]],
                               let topCondition = conditionsData.first,
                               let topConditionName = topCondition["name"] as? String,
                               let topConditionConfidence = topCondition["confidence"] as? Double {
                                
                                // Parse conditions
                                var conditions: [AnalysisCondition] = []
                                
                                for conditionData in conditionsData {
                                    if let condId = conditionData["id"] as? String,
                                       let name = conditionData["name"] as? String,
                                       let confidence = conditionData["confidence"] as? Double,
                                       let description = conditionData["description"] as? String,
                                       let severityString = conditionData["severity"] as? String,
                                       let severity = ConditionSeverity(rawValue: severityString),
                                       let recommendation = conditionData["recommendation"] as? String {
                                        
                                        let condition = AnalysisCondition(
                                            id: condId,
                                            name: name,
                                            confidence: confidence,
                                            description: description,
                                            severity: severity,
                                            recommendation: recommendation
                                        )
                                        
                                        conditions.append(condition)
                                    }
                                }
                                
                                // Create history item
                                let historyItem = AnalysisHistoryItem(
                                    id: id,
                                    date: date,
                                    type: type,
                                    topConditionName: topConditionName,
                                    topConditionConfidence: topConditionConfidence,
                                    imageReference: imageReference,
                                    conditions: conditions
                                )
                                
                                historyItems.append(historyItem)
                            }
                        }
                        
                        // Sort by date (newest first)
                        historyItems.sort { $0.date > $1.date }
                        
                        completion(.success(historyItems))
                    } else {
                        completion(.failure(NSError(
                            domain: "UserService",
                            code: 500,
                            userInfo: [NSLocalizedDescriptionKey: "Invalid server response"]
                        )))
                    }
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
                
                // Verify token is still valid in background
                validateToken { isValid in
                    if !isValid {
                        // Token expired, log out
                        self.logout()
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
            endpoint: "/api/auth/validate",
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
                    // Parse JSON response
                    if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                       let isValid = json["valid"] as? Bool {
                        completion(isValid)
                    } else {
                        completion(false)
                    }
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
}

// MARK: - Supporting Types

/// Types of analysis
enum AnalysisType: String {
    case throat = "throat"
    case ear = "ear"
}