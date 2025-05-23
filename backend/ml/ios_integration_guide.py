"""
iOS Integration Guide for Medical Image Analyzer

This script demonstrates how to use the medical image analyzer in an iOS app.
"""

import os
import base64
import json
from medical_image_analyzer import analyze_image

def demo_ios_integration():
    """
    Demonstrate how to integrate the medical image analyzer with iOS
    """
    print("=" * 60)
    print("iOS Integration Guide for Medical Image Analyzer")
    print("=" * 60)
    
    # In iOS, you would capture or select an image and convert it to base64
    # Here we'll simulate this with a sample encoded image (red square)
    
    # Create a sample base64 encoded image (normally this would come from iOS)
    print("\n1. Prepare the image in iOS")
    print("-" * 60)
    print("In your iOS app, after capturing or selecting an image:")
    print("```swift")
    print("// Convert UIImage to base64")
    print("func imageToBase64(_ image: UIImage) -> String? {")
    print("    guard let imageData = image.jpegData(compressionQuality: 0.7) else { return nil }")
    print("    return \"data:image/jpeg;base64,\" + imageData.base64EncodedString()")
    print("}")
    print("")
    print("// Example usage")
    print("if let base64String = imageToBase64(selectedImage) {")
    print("    // Send to server for analysis")
    print("    analyzeImage(imageData: base64String, type: \"throat\")")
    print("}")
    print("```")
    
    # Sample implementation of network request to the server
    print("\n2. Send the image to the server")
    print("-" * 60)
    print("Create a NetworkService class:")
    print("```swift")
    print("func analyzeImage(")
    print("    imageData: String,")
    print("    type: String,")
    print("    completion: @escaping (Result<AnalysisResponse, Error>) -> Void")
    print(") {")
    print("    // Create URL request")
    print("    guard let url = URL(string: \"\(baseURL)/analyze\") else {")
    print("        completion(.failure(NetworkError.invalidURL))")
    print("        return")
    print("    }")
    print("    ")
    print("    var request = URLRequest(url: url)")
    print("    request.httpMethod = \"POST\"")
    print("    request.setValue(\"application/json\", forHTTPHeaderField: \"Content-Type\")")
    print("    ")
    print("    // Create request body")
    print("    let body: [String: Any] = [")
    print("        \"image\": imageData,")
    print("        \"type\": type")
    print("    ]")
    print("    ")
    print("    // Serialize and send request")
    print("    request.httpBody = try? JSONSerialization.data(withJSONObject: body)")
    print("    ")
    print("    URLSession.shared.dataTask(with: request) { data, response, error in")
    print("        // Handle response...")
    print("    }.resume()")
    print("}")
    print("```")
    
    # Server-side processing in Python
    print("\n3. On the server side (Python)")
    print("-" * 60)
    print("```python")
    print("@app.route('/api/analyze', methods=['POST'])")
    print("def analyze_image_endpoint():")
    print("    data = request.json")
    print("    image_data = data.get('image')")
    print("    analysis_type = data.get('type')")
    print("    ")
    print("    # Validate inputs")
    print("    if not image_data or not analysis_type:")
    print("        return jsonify({'error': 'Missing image or type'}), 400")
    print("    ")
    print("    try:")
    print("        # Use the medical_image_analyzer module")
    print("        results = analyze_image(image_data, analysis_type)")
    print("        ")
    print("        return jsonify({")
    print("            'id': str(uuid.uuid4()),")
    print("            'type': analysis_type,")
    print("            'timestamp': datetime.now().isoformat(),")
    print("            'conditions': results")
    print("        })")
    print("    except Exception as e:")
    print("        return jsonify({'error': str(e)}), 500")
    print("```")
    
    # Sample response format
    print("\n4. Example response format")
    print("-" * 60)
    
    # Simulate a response (this would normally be generated by the server)
    sample_response = {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "type": "throat",
        "timestamp": "2025-03-20T15:35:42.123456",
        "conditions": [
            {
                "id": "strep_throat",
                "name": "Strep Throat",
                "description": "A bacterial infection that causes inflammation and pain in the throat.",
                "confidence": 0.85,
                "symptoms": [
                    "Throat pain that comes on quickly",
                    "Red and swollen tonsils",
                    "White patches on the tonsils",
                    "Tiny red spots on the roof of the mouth",
                    "Fever"
                ],
                "isPotentiallySerious": True
            },
            {
                "id": "tonsillitis",
                "name": "Tonsillitis",
                "description": "Inflammation of the tonsils, typically caused by viral or bacterial infection.",
                "confidence": 0.65,
                "symptoms": [
                    "Red, swollen tonsils",
                    "White or yellow coating on tonsils",
                    "Sore throat",
                    "Painful swallowing",
                    "Fever"
                ],
                "isPotentiallySerious": False
            },
            {
                "id": "pharyngitis",
                "name": "Pharyngitis",
                "description": "Inflammation of the pharynx resulting in a sore throat.",
                "confidence": 0.35,
                "symptoms": [
                    "Sore throat",
                    "Difficulty swallowing",
                    "Fever",
                    "Enlarged lymph nodes"
                ],
                "isPotentiallySerious": False
            }
        ]
    }
    
    print(json.dumps(sample_response, indent=2))
    
    # iOS handling of the response
    print("\n5. Handle the response in iOS")
    print("-" * 60)
    print("```swift")
    print("// Define model to match the response")
    print("struct AnalysisResponse: Decodable {")
    print("    let id: String")
    print("    let type: String")
    print("    let timestamp: String")
    print("    let conditions: [AnalysisCondition]")
    print("}")
    print("")
    print("struct AnalysisCondition: Identifiable, Decodable {")
    print("    let id: String")
    print("    let name: String")
    print("    let description: String")
    print("    let confidence: Double")
    print("    let symptoms: [String]")
    print("    let isPotentiallySerious: Bool")
    print("}")
    print("")
    print("// In your network completion handler:")
    print("URLSession.shared.dataTask(with: request) { data, response, error in")
    print("    if let error = error {")
    print("        completion(.failure(error))")
    print("        return")
    print("    }")
    print("    ")
    print("    guard let data = data else {")
    print("        completion(.failure(NetworkError.noData))")
    print("        return")
    print("    }")
    print("    ")
    print("    do {")
    print("        let analysisResponse = try JSONDecoder().decode(AnalysisResponse.self, from: data)")
    print("        DispatchQueue.main.async {")
    print("            completion(.success(analysisResponse))")
    print("        }")
    print("    } catch {")
    print("        completion(.failure(error))")
    print("    }")
    print("}.resume()")
    print("```")
    
    # Display results in the UI
    print("\n6. Display results in the UI")
    print("-" * 60)
    print("```swift")
    print("struct AnalysisResultsView: View {")
    print("    let analysisResponse: AnalysisResponse")
    print("    ")
    print("    var body: some View {")
    print("        ScrollView {")
    print("            VStack(alignment: .leading, spacing: 20) {")
    print("                Text(\"Analysis Results\")")
    print("                    .font(.largeTitle)")
    print("                    .fontWeight(.bold)")
    print("                ")
    print("                ForEach(analysisResponse.conditions) { condition in")
    print("                    ConditionCardView(condition: condition)")
    print("                }")
    print("                ")
    print("                // Disclaimer")
    print("                Text(\"This analysis is for informational purposes only and does not constitute medical advice.\")")
    print("                    .font(.caption)")
    print("                    .foregroundColor(.secondary)")
    print("            }")
    print("            .padding()")
    print("        }")
    print("    }")
    print("}")
    print("```")
    
    print("\n7. Running the tests")
    print("-" * 60)
    print("To run the unit tests for the medical image analyzer:")
    print("```bash")
    print("cd backend/ml")
    print("pytest tests/test_medical_image_analyzer.py -v")
    print("```")
    
    print("\n" + "=" * 60)
    print("End of iOS Integration Guide")
    print("=" * 60)


if __name__ == "__main__":
    demo_ios_integration()