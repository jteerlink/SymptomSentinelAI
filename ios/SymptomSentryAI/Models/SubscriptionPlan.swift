import Foundation

struct SubscriptionPlanModel: Codable, Identifiable {
    var id: String
    var name: String
    var price: Double
    var billingPeriod: BillingPeriod
    var features: [String]
    var notIncludedFeatures: [String]
    var productIdentifier: String // For App Store In-App Purchase
    
    enum BillingPeriod: String, Codable {
        case none = "none"
        case monthly = "monthly"
        case yearly = "yearly"
        
        var displayText: String {
            switch self {
            case .none:
                return ""
            case .monthly:
                return "month"
            case .yearly:
                return "year"
            }
        }
    }
    
    var isFreePlan: Bool {
        return price <= 0
    }
    
    var formattedPrice: String {
        if isFreePlan {
            return "Free"
        } else {
            return String(format: "$%.2f", price)
        }
    }
    
    var formattedBillingCycle: String {
        if billingPeriod == .none {
            return ""
        } else {
            return "/\(billingPeriod.displayText)"
        }
    }
    
    // Standard plans for the app
    static let freePlan = SubscriptionPlanModel(
        id: "free",
        name: "Free",
        price: 0.0,
        billingPeriod: .none,
        features: [
            "Limited to 2 analyses per month",
            "Basic educational resources",
            "Standard analysis results",
            "Advertisement supported"
        ],
        notIncludedFeatures: [
            "Priority processing",
            "Detailed health insights",
            "Specialist consultations",
            "History tracking"
        ],
        productIdentifier: ""
    )
    
    static let monthlyPlan = SubscriptionPlanModel(
        id: "premium_monthly",
        name: "Premium",
        price: 9.99,
        billingPeriod: .monthly,
        features: [
            "Unlimited analyses",
            "Full educational library",
            "Detailed condition information",
            "History tracking and trends",
            "Ad-free experience",
            "Email support"
        ],
        notIncludedFeatures: [
            "Specialist consultations"
        ],
        productIdentifier: "com.symptomsentryai.premium.monthly"
    )
    
    static let yearlyPlan = SubscriptionPlanModel(
        id: "premium_yearly",
        name: "Premium Annual",
        price: 99.99,
        billingPeriod: .yearly,
        features: [
            "Unlimited analyses",
            "Full educational library",
            "Detailed condition information",
            "History tracking and trends",
            "Ad-free experience", 
            "Priority email support",
            "Two telemedicine consultations",
            "17% savings over monthly"
        ],
        notIncludedFeatures: [],
        productIdentifier: "com.symptomsentryai.premium.yearly"
    )
    
    static let allPlans = [freePlan, monthlyPlan, yearlyPlan]
}