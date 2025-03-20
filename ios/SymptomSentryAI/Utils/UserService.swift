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
    
    /// Base URL for API requests
    private let baseUrl = "https://api.symptomsentry.com/v1"
    
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
        
        // In a real app, this would make an API request
        // For this demonstration, we'll simulate a server response
        
        // Create API request
        let parameters: [String: Any] = [
            "email": email,
            "password": password,
            "name": name
        ]
        
        networkService.request(
            url: "\(baseUrl)/auth/register",
            method: "POST",
            parameters: parameters
        ) { [weak self] result in
            guard let self = self else { return }
            
            self.isLoading = false
            
            switch result {
            case .success(let data):
                do {
                    // Parse JSON response
                    if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                       let token = json["token"] as? String,
                       let userData = json["user"] as? [String: Any],
                       let userId = userData["id"] as? String,
                       let userEmail = userData["email"] as? String,
                       let userName = userData["name"] as? String,
                       let subscription = userData["subscription"] as? String {
                        
                        // Create user object
                        let user = User(
                            id: userId,
                            email: userEmail,
                            name: userName,
                            subscriptionLevel: SubscriptionLevel(rawValue: subscription) ?? .free
                        )
                        
                        // Store user and token
                        self.currentUser = user
                        self.authToken = token
                        self.isAuthenticated = true
                        
                        // Save session
                        self.saveSession()
                        
                        completion(true, nil)
                    } else {
                        self.errorMessage = "Invalid server response"
                        completion(false, "Invalid server response")
                    }
                } catch {
                    self.errorMessage = "Failed to parse response: \(error.localizedDescription)"
                    completion(false, "Registration failed: \(error.localizedDescription)")
                }
                
            case .failure(let error):
                self.errorMessage = error.localizedDescription
                completion(false, "Registration failed: \(error.localizedDescription)")
            }
        }
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
        
        // Create API request
        let parameters: [String: Any] = [
            "email": email,
            "password": password
        ]
        
        networkService.request(
            url: "\(baseUrl)/auth/login",
            method: "POST",
            parameters: parameters
        ) { [weak self] result in
            guard let self = self else { return }
            
            self.isLoading = false
            
            switch result {
            case .success(let data):
                do {
                    // Parse JSON response
                    if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                       let token = json["token"] as? String,
                       let userData = json["user"] as? [String: Any],
                       let userId = userData["id"] as? String,
                       let userEmail = userData["email"] as? String,
                       let userName = userData["name"] as? String,
                       let subscription = userData["subscription"] as? String {
                        
                        // Create user object
                        let user = User(
                            id: userId,
                            email: userEmail,
                            name: userName,
                            subscriptionLevel: SubscriptionLevel(rawValue: subscription) ?? .free
                        )
                        
                        // Store user and token
                        self.currentUser = user
                        self.authToken = token
                        self.isAuthenticated = true
                        
                        // Save session
                        self.saveSession()
                        
                        completion(true, nil)
                    } else {
                        self.errorMessage = "Invalid server response"
                        completion(false, "Invalid server response")
                    }
                } catch {
                    self.errorMessage = "Failed to parse response: \(error.localizedDescription)"
                    completion(false, "Login failed: \(error.localizedDescription)")
                }
                
            case .failure(let error):
                self.errorMessage = error.localizedDescription
                completion(false, "Login failed: \(error.localizedDescription)")
            }
        }
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
        
        // Make API request
        networkService.request(
            url: "\(baseUrl)/user/profile",
            method: "GET",
            headers: ["Authorization": "Bearer \(authToken)"]
        ) { [weak self] result in
            guard let self = self else { return }
            
            self.isLoading = false
            
            switch result {
            case .success(let data):
                do {
                    // Parse JSON response
                    if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                       let userData = json["user"] as? [String: Any],
                       let userId = userData["id"] as? String,
                       let userEmail = userData["email"] as? String,
                       let userName = userData["name"] as? String,
                       let subscription = userData["subscription"] as? String {
                        
                        // Update user object
                        let user = User(
                            id: userId,
                            email: userEmail,
                            name: userName,
                            subscriptionLevel: SubscriptionLevel(rawValue: subscription) ?? .free
                        )
                        
                        self.currentUser = user
                        
                        // Save updated user data
                        self.saveSession()
                        
                        completion(true, nil)
                    } else {
                        completion(false, "Invalid server response")
                    }
                } catch {
                    completion(false, "Failed to parse response: \(error.localizedDescription)")
                }
                
            case .failure(let error):
                completion(false, "Failed to get profile: \(error.localizedDescription)")
            }
        }
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
        
        // Make API request
        networkService.request(
            url: "\(baseUrl)/user/profile",
            method: "PUT",
            parameters: parameters,
            headers: ["Authorization": "Bearer \(authToken)"]
        ) { [weak self] result in
            guard let self = self else { return }
            
            self.isLoading = false
            
            switch result {
            case .success(let data):
                do {
                    // Parse JSON response
                    if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                       let userData = json["user"] as? [String: Any] {
                        
                        // Update user object with new data
                        let updatedUser = User(
                            id: currentUser.id,
                            email: (email ?? currentUser.email),
                            name: (name ?? currentUser.name),
                            subscriptionLevel: currentUser.subscriptionLevel
                        )
                        
                        self.currentUser = updatedUser
                        
                        // Save updated user data
                        self.saveSession()
                        
                        completion(true, nil)
                    } else {
                        completion(false, "Invalid server response")
                    }
                } catch {
                    completion(false, "Failed to parse response: \(error.localizedDescription)")
                }
                
            case .failure(let error):
                completion(false, "Failed to update profile: \(error.localizedDescription)")
            }
        }
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
        
        // Make API request
        networkService.request(
            url: "\(baseUrl)/user/subscription",
            method: "POST",
            parameters: parameters,
            headers: ["Authorization": "Bearer \(authToken)"]
        ) { [weak self] result in
            guard let self = self else { return }
            
            self.isLoading = false
            
            switch result {
            case .success(let data):
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
                
            case .failure(let error):
                completion(false, "Subscription upgrade failed: \(error.localizedDescription)")
            }
        }
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
        
        // Make API request
        networkService.request(
            url: "\(baseUrl)/analysis/save",
            method: "POST",
            parameters: parameters,
            headers: ["Authorization": "Bearer \(authToken)"]
        ) { result in
            switch result {
            case .success:
                completion(true)
            case .failure:
                completion(false)
            }
        }
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
        
        // Make API request
        networkService.request(
            url: "\(baseUrl)/analysis/history",
            method: "GET",
            headers: ["Authorization": "Bearer \(authToken)"]
        ) { result in
            switch result {
            case .success(let data):
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
                
            case .failure(let error):
                completion(.failure(error))
            }
        }
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
        
        // Make API request to validate token
        networkService.request(
            url: "\(baseUrl)/auth/validate",
            method: "GET",
            headers: ["Authorization": "Bearer \(authToken)"]
        ) { result in
            switch result {
            case .success(let data):
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
                
            case .failure:
                completion(false)
            }
        }
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