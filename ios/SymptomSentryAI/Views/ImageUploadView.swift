import SwiftUI
import UIKit

struct ImageUploadView: View {
    enum AnalysisType: String, CaseIterable, Identifiable {
        case throat = "Throat"
        case ear = "Ear"
        
        var id: String { self.rawValue }
        
        var icon: String {
            switch self {
            case .throat: return "mouth"
            case .ear: return "ear"
            }
        }
        
        var description: String {
            switch self {
            case .throat: return "Analyze throat conditions such as strep throat, tonsillitis, or pharyngitis"
            case .ear: return "Analyze ear conditions such as ear infections, earwax buildup, or inflammation"
            }
        }
    }
    
    // MARK: - Properties
    @State private var selectedAnalysisType: AnalysisType = .throat
    @State private var selectedImage: UIImage?
    @State private var isShowingImagePicker = false
    @State private var sourceType: UIImagePickerController.SourceType = .photoLibrary
    @State private var isShowingActionSheet = false
    @State private var isUploading = false
    @State private var uploadProgress: Float = 0.0
    @State private var errorMessage: String?
    @State private var isShowingError = false
    @State private var isShowingResults = false
    @State private var analysisResults: [AnalysisCondition]?
    
    // MARK: - Maximum image size in bytes (5MB)
    private let maxImageSize: Int = 5 * 1024 * 1024
    
    // MARK: - Body
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Analysis type selector
                    analysisTypePicker
                    
                    // Image preview area
                    imagePreviewSection
                    
                    // Error message
                    if let errorMessage = errorMessage {
                        Text(errorMessage)
                            .foregroundColor(.red)
                            .padding()
                            .background(Color.red.opacity(0.1))
                            .cornerRadius(8)
                    }
                    
                    // Upload button
                    uploadButton
                    
                    // How to use help button
                    AnalysisTutorialButton()
                        .padding(.top, 20)
                }
                .padding()
                .disabled(isUploading)
                .overlay(
                    // Upload progress overlay
                    progressOverlay
                )
            }
            .navigationTitle("Image Analysis")
            .sheet(isPresented: $isShowingImagePicker) {
                ImagePicker(selectedImage: $selectedImage, sourceType: sourceType)
            }
            .actionSheet(isPresented: $isShowingActionSheet) {
                actionSheetOptions
            }
            .alert(isPresented: $isShowingError) {
                Alert(
                    title: Text("Error"),
                    message: Text(errorMessage ?? "An unknown error occurred"),
                    dismissButton: .default(Text("OK"))
                )
            }
            .navigationViewStyle(StackNavigationViewStyle())
        }
        .fullScreenCover(isPresented: $isShowingResults) {
            // Results view
            if let results = analysisResults {
                AnalysisResultsView(results: results, analysisType: selectedAnalysisType, image: selectedImage)
            } else {
                // This should not happen, but just in case
                Text("No results available")
                    .onAppear {
                        isShowingResults = false
                    }
            }
        }
    }
    
    // MARK: - Analysis Type Picker
    private var analysisTypePicker: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Select Analysis Type")
                .font(.headline)
            
            HStack(spacing: 15) {
                ForEach(AnalysisType.allCases) { type in
                    AnalysisTypeButton(
                        type: type,
                        isSelected: selectedAnalysisType == type,
                        action: { selectedAnalysisType = type }
                    )
                }
            }
        }
    }
    
    // MARK: - Image Preview Section
    private var imagePreviewSection: some View {
        VStack(spacing: 15) {
            if let image = selectedImage {
                // Show selected image
                Image(uiImage: image)
                    .resizable()
                    .scaledToFit()
                    .frame(maxHeight: 300)
                    .cornerRadius(12)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.gray.opacity(0.3), lineWidth: 1)
                    )
                
                // Change image button
                Button(action: { isShowingActionSheet = true }) {
                    Label("Change Image", systemImage: "arrow.triangle.2.circlepath")
                        .foregroundColor(.blue)
                }
            } else {
                // Empty image area with add button
                ZStack {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(Color.gray.opacity(0.1))
                        .frame(height: 200)
                    
                    VStack(spacing: 12) {
                        Image(systemName: "photo.on.rectangle.angled")
                            .resizable()
                            .scaledToFit()
                            .frame(width: 60, height: 60)
                            .foregroundColor(.gray)
                        
                        Text("Add an image of your \(selectedAnalysisType.rawValue.lowercased())")
                            .foregroundColor(.gray)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal)
                        
                        Button(action: { isShowingActionSheet = true }) {
                            Text("Upload Image")
                                .foregroundColor(.white)
                                .padding(.horizontal, 20)
                                .padding(.vertical, 10)
                                .background(Color.blue)
                                .cornerRadius(8)
                        }
                    }
                }
            }
        }
    }
    
    // MARK: - Upload Button
    private var uploadButton: some View {
        Button(action: uploadImage) {
            Text("Analyze Image")
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding()
                .background(selectedImage == nil ? Color.gray : Color.blue)
                .cornerRadius(10)
                .shadow(radius: 2)
        }
        .disabled(selectedImage == nil)
        .opacity(selectedImage == nil ? 0.5 : 1.0)
    }
    
    // MARK: - Progress Overlay
    @ViewBuilder
    private var progressOverlay: some View {
        if isUploading {
            ZStack {
                Color.black.opacity(0.4)
                    .edgesIgnoringSafeArea(.all)
                
                VStack(spacing: 20) {
                    ProgressView(value: uploadProgress, total: 1.0)
                        .progressViewStyle(LinearProgressViewStyle())
                        .frame(width: 200)
                    
                    Text("Analyzing image...")
                        .font(.headline)
                        .foregroundColor(.white)
                }
                .padding()
                .background(Color(UIColor.systemBackground))
                .cornerRadius(12)
                .shadow(radius: 5)
            }
        }
    }
    
    // MARK: - Action Sheet Options
    private var actionSheetOptions: ActionSheet {
        ActionSheet(
            title: Text("Select Image Source"),
            message: Text("Choose where to select your image from"),
            buttons: [
                .default(Text("Camera")) {
                    if UIImagePickerController.isSourceTypeAvailable(.camera) {
                        self.sourceType = .camera
                        self.isShowingImagePicker = true
                    } else {
                        self.errorMessage = "Camera not available on this device"
                        self.isShowingError = true
                    }
                },
                .default(Text("Photo Library")) {
                    self.sourceType = .photoLibrary
                    self.isShowingImagePicker = true
                },
                .cancel()
            ]
        )
    }
    
    // MARK: - Image Upload Function
    private func uploadImage() {
        guard let image = selectedImage else { return }
        
        // Validate image using ImageValidationService
        let validationResult = ImageValidationService.shared.validateImage(image)
        
        if !validationResult.isValid {
            errorMessage = validationResult.errorMessage ?? "Invalid image. Please try another image."
            isShowingError = true
            return
        }
        
        // Get image data
        guard let imageData = ImageValidationService.shared.getImageData(from: image) else {
            errorMessage = "Failed to process the image. Please try another image."
            isShowingError = true
            return
        }
        
        // Double-check image size (redundant, but just to be safe)
        guard imageData.count <= maxImageSize else {
            errorMessage = "Image is too large. Maximum size is 5MB."
            isShowingError = true
            return
        }
        
        // Start uploading
        isUploading = true
        uploadProgress = 0.1
        
        // Simulate upload progress
        let progressTimer = Timer.scheduledTimer(withTimeInterval: 0.2, repeats: true) { timer in
            if uploadProgress < 0.9 {
                uploadProgress += 0.1
            }
        }
        
        // Use MLAnalysisService to analyze the image
        MLAnalysisService.shared.analyzeImage(
            image: image,
            type: selectedAnalysisType.rawValue.lowercased()
        ) { result in
            DispatchQueue.main.async {
                progressTimer.invalidate()
                uploadProgress = 1.0
                
                switch result {
                case .success(let conditions):
                    // Process analysis results
                    self.analysisResults = conditions
                    
                    // Delay to show complete progress before showing results
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                        self.isUploading = false
                        self.isShowingResults = true
                    }
                    
                case .failure(let error):
                    self.isUploading = false
                    self.errorMessage = "Analysis failed: \(error.localizedDescription)"
                    self.isShowingError = true
                }
            }
        }
    }
}

// MARK: - Analysis Type Button
struct AnalysisTypeButton: View {
    let type: ImageUploadView.AnalysisType
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                ZStack {
                    Circle()
                        .fill(isSelected ? Color.blue : Color.gray.opacity(0.2))
                        .frame(width: 60, height: 60)
                    
                    Image(systemName: type.icon)
                        .resizable()
                        .scaledToFit()
                        .frame(width: 30, height: 30)
                        .foregroundColor(isSelected ? .white : .gray)
                }
                
                Text(type.rawValue)
                    .font(.subheadline)
                    .foregroundColor(isSelected ? .blue : .gray)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 10)
            .background(
                RoundedRectangle(cornerRadius: 10)
                    .stroke(isSelected ? Color.blue : Color.clear, lineWidth: 2)
                    .background(
                        RoundedRectangle(cornerRadius: 10)
                            .fill(isSelected ? Color.blue.opacity(0.1) : Color.clear)
                    )
            )
        }
    }
}

// MARK: - Image Picker
struct ImagePicker: UIViewControllerRepresentable {
    @Binding var selectedImage: UIImage?
    var sourceType: UIImagePickerController.SourceType
    @Environment(\.presentationMode) private var presentationMode
    
    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.delegate = context.coordinator
        picker.sourceType = sourceType
        picker.allowsEditing = true
        return picker
    }
    
    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let parent: ImagePicker
        
        init(_ parent: ImagePicker) {
            self.parent = parent
        }
        
        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey : Any]) {
            if let editedImage = info[.editedImage] as? UIImage {
                parent.selectedImage = editedImage
            } else if let originalImage = info[.originalImage] as? UIImage {
                parent.selectedImage = originalImage
            }
            
            parent.presentationMode.wrappedValue.dismiss()
        }
        
        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            parent.presentationMode.wrappedValue.dismiss()
        }
    }
}

// MARK: - Preview Provider
struct ImageUploadView_Previews: PreviewProvider {
    static var previews: some View {
        ImageUploadView()
    }
}